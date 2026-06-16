import PerformanceReview from "../../models/PerformanceReview.js";
import PerformanceGoal from "../../models/PerformanceGoal.js";
import PayrollEmployee from "../../models/PayrollEmployee.js";
import { toNumber } from "../../utils/number.js";

const getRatingBand = (rating) => {
  if (rating >= 4.5) return "Outstanding";
  if (rating >= 4.0) return "Exceeds";
  if (rating >= 3.0) return "Meets";
  return "Needs Improvement";
};

const getGoalProgress = (goal) => {
  if (goal.lowerIsBetter) {
    if (goal.current <= 0) return 0;
    return Math.min(140, (goal.target / goal.current) * 100);
  }
  if (goal.target <= 0) return 0;
  return Math.min(140, (goal.current / goal.target) * 100);
};

const getGoalStatus = (progress) => {
  if (progress >= 100) return "Achieved";
  if (progress >= 75) return "On Track";
  return "At Risk";
};

const filterReviews = (reviews, query) => {
  const search = String(query.search || "").toLowerCase();
  const cycle = query.cycle || "All Cycles";
  const status = query.status || "All Status";

  return reviews.filter((r) => {
    const matchSearch =
      !search ||
      r.employeeName.toLowerCase().includes(search) ||
      r.employeeId.toLowerCase().includes(search) ||
      r.department.toLowerCase().includes(search);

    const matchCycle = cycle === "All Cycles" || r.cycle === cycle;
    const matchStatus = status === "All Status" || r.status === status;
    return matchSearch && matchCycle && matchStatus;
  });
};

const summarizeReviews = (reviews) => {
  const completed = reviews.filter((r) => r.status === "Completed");
  const avg =
    completed.length === 0
      ? 0
      : completed.reduce((sum, r) => sum + toNumber(r.finalRating), 0) / completed.length;

  return {
    totalReviews: reviews.length,
    completed: completed.length,
    promotions: reviews.filter((r) => r.recommendation === "Promotion").length,
    bonuses: reviews.filter((r) => r.recommendation === "Bonus").length,
    avgRating: Number(avg.toFixed(2)),
  };
};

const decorateGoals = (goals) =>
  goals.map((g) => {
    const progress = getGoalProgress(g);
    return { ...g, progress: Number(progress.toFixed(2)), status: getGoalStatus(progress) };
  });

const filterGoals = (goals, query) => {
  const employee = query.employee || "All Employees";
  const status = query.status || "All Status";

  return goals.filter((g) => {
    const label = `${g.employeeName} (${g.employeeId})`;
    const matchEmp = employee === "All Employees" || employee === label;
    const matchStatus = status === "All Status" || g.status === status;
    return matchEmp && matchStatus;
  });
};

const summarizeGoals = (goals) => {
  if (goals.length === 0) {
    return { activeGoals: 0, achieved: 0, atRisk: 0, weightedPerformance: 0 };
  }

  const totalWeight = goals.reduce((sum, g) => sum + toNumber(g.weight), 0) || 1;
  const weightedProgress = goals.reduce((sum, g) => {
    const norm = Math.min(toNumber(g.progress), 120);
    return sum + norm * toNumber(g.weight);
  }, 0);

  return {
    activeGoals: goals.length,
    achieved: goals.filter((g) => g.status === "Achieved").length,
    atRisk: goals.filter((g) => g.status === "At Risk").length,
    weightedPerformance: Number((weightedProgress / totalWeight).toFixed(2)),
  };
};

const nextReviewId = async (cycle) => {
  const token = String(cycle || "NA")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toUpperCase();

  const count = await PerformanceReview.countDocuments({
    _id: { $regex: `^PRV-${token}-` },
  });
  return `PRV-${token}-${String(count + 1).padStart(3, "0")}`;
};

const nextGoalId = async () => {
  const goals = await PerformanceGoal.find({}, "_id").lean();
  const maxId = goals.reduce((max, g) => {
    const raw = g._id.startsWith("KPI-") ? g._id.slice(4) : "";
    const num = Number(raw);
    return Number.isFinite(num) ? Math.max(max, num) : max;
  }, 0);
  return `KPI-${String(maxId + 1).padStart(3, "0")}`;
};

const toBoolean = (value) => value === true || value === "true";

const PROMOTION_RAISE_FACTOR = 1.10;

/**
 * Apply payroll side-effects when a review is completed with Bonus or Promotion.
 * - Promotion: permanently increases baseSalary by 10% in PayrollEmployee.
 * - Bonus: stores the amount; payrollProcessed stays false for the payroll run to pick up.
 */
const applyRecommendationSideEffects = async (review) => {
  if (review.status !== "Completed") return;

  if (review.recommendation === "Promotion") {
    console.log("[Performance] Promotion review detected for employeeId:", review.employeeId);

    // Guard: check if salary bump was already applied (prevents double-bumping on re-save)
    const existingReview = await PerformanceReview.findById(review._id).lean();
    if (existingReview?.salaryBumpApplied) {
      console.log("[Performance] Salary bump already applied for this review, skipping");
      return;
    }

    // PayrollEmployee uses _id as the employee identifier.
    // Try direct lookup first, then fallback to searching by name.
    let employee = await PayrollEmployee.findById(review.employeeId);
    if (!employee) {
      employee = await PayrollEmployee.findOne({ name: review.employeeName });
      console.log("[Performance] Fallback lookup by name:", employee ? employee._id : "not found");
    }

    if (employee) {
      const oldSalary = employee.baseSalary;
      employee.baseSalary = Number((employee.baseSalary * PROMOTION_RAISE_FACTOR).toFixed(2));
      await employee.save();
      console.log("[Performance] Updated Base Salary for Employee:", {
        id: employee._id,
        name: employee.name,
        oldSalary,
        newSalary: employee.baseSalary,
      });
    } else {
      console.log("[Performance] PayrollEmployee not found for promotion, skipping salary update");
    }

    // Mark salary bump as applied, but do NOT set payrollProcessed = true.
    // payrollProcessed stays false so getRecommendation() can find this review
    // and the green banner will show on the Generate Payroll page.
    await PerformanceReview.findByIdAndUpdate(review._id, { salaryBumpApplied: true });
    console.log("[Performance] Review marked salaryBumpApplied=true, payrollProcessed stays false");
  }
  // Bonus reviews stay payrollProcessed = false so calculatePayroll picks them up
};

export const performanceService = {
  async getReviews(query) {
    const filter = {};
    if (query.employeeId) filter.employeeId = query.employeeId;

    const allReviews = await PerformanceReview.find(filter)
      .sort({ cycle: -1, _id: -1 })
      .lean();

    const reviews = filterReviews(allReviews, query);

    return {
      reviews: reviews.map((r) => ({
        ...r,
        id: r._id,
        ratingBand: r.finalRating ? getRatingBand(r.finalRating) : "Not Rated",
      })),
      summary: summarizeReviews(reviews),
      cycles: [...new Set(allReviews.map((r) => r.cycle))],
    };
  },

  async createReview(payload) {
    const goalsScore = toNumber(payload.goalsScore);
    const competencyScore = toNumber(payload.competencyScore);
    const behaviorScore = toNumber(payload.behaviorScore);
    const calculated = Number(((goalsScore + competencyScore + behaviorScore) / 3).toFixed(1));
    const finalRating = payload.finalRating !== undefined ? toNumber(payload.finalRating) : calculated;

    const recommendation = payload.recommendation || "No Change";
    const status = payload.status || "In Progress";

    const review = {
      _id: await nextReviewId(payload.cycle),
      employeeName: payload.employeeName,
      employeeId: payload.employeeId,
      department: payload.department,
      reviewer: payload.reviewer,
      cycle: payload.cycle,
      goalsScore,
      competencyScore,
      behaviorScore,
      finalRating,
      recommendation,
      status,
      bonusAmount: recommendation === "Bonus" ? toNumber(payload.bonusAmount) : 0,
      payrollProcessed: false,
    };

    const created = await PerformanceReview.create(review);
    const result = created.toObject();

    await applyRecommendationSideEffects(result);

    return result;
  },

  async updateReview(id, payload) {
    const goalsScore = toNumber(payload.goalsScore);
    const competencyScore = toNumber(payload.competencyScore);
    const behaviorScore = toNumber(payload.behaviorScore);
    const calculated = Number(((goalsScore + competencyScore + behaviorScore) / 3).toFixed(1));
    const finalRating = payload.finalRating !== undefined ? toNumber(payload.finalRating) : calculated;

    const recommendation = payload.recommendation || "No Change";

    const updated = await PerformanceReview.findByIdAndUpdate(
      id,
      {
        employeeName: payload.employeeName,
        employeeId: payload.employeeId,
        department: payload.department,
        reviewer: payload.reviewer,
        cycle: payload.cycle,
        goalsScore,
        competencyScore,
        behaviorScore,
        finalRating,
        recommendation,
        status: payload.status,
        bonusAmount: recommendation === "Bonus" ? toNumber(payload.bonusAmount) : 0,
        payrollProcessed: false,
      },
      { new: true }
    ).lean();

    if (updated) {
      await applyRecommendationSideEffects(updated);
    }

    return updated;
  },

  async getGoals(query) {
    const allGoals = await PerformanceGoal.find()
      .sort({ dueDate: 1, _id: 1 })
      .lean();

    const decorated = decorateGoals(allGoals);
    const filtered = filterGoals(decorated, query);

    return {
      goals: filtered.map((g) => ({ ...g, id: g._id })),
      summary: summarizeGoals(filtered),
      employees: [...new Set(allGoals.map((g) => `${g.employeeName} (${g.employeeId})`))],
    };
  },

  async createGoal(payload) {
    const goal = {
      _id: await nextGoalId(),
      employeeName: payload.employeeName,
      employeeId: payload.employeeId,
      goal: payload.goal,
      metric: payload.metric,
      target: toNumber(payload.target),
      current: toNumber(payload.current),
      weight: toNumber(payload.weight),
      dueDate: payload.dueDate,
      lowerIsBetter: toBoolean(payload.lowerIsBetter),
    };

    const created = await PerformanceGoal.create(goal);
    return created.toObject();
  },

  async updateGoalCurrent(id, payload) {
    const updated = await PerformanceGoal.findByIdAndUpdate(
      id,
      { current: toNumber(payload.current) },
      { new: true }
    ).lean();

    return updated || null;
  },

  /**
   * Clear unprocessed test review data.
   * Only deletes reviews where payrollProcessed === false (safe for production).
   * Rolls back any promotion salary bumps before deleting.
   */
  async clearTestReviews() {
    // 1. Find promotion reviews that had salary bumps applied but aren't payroll-processed
    const promotionReviews = await PerformanceReview.find({
      payrollProcessed: { $ne: true },
      recommendation: "Promotion",
      salaryBumpApplied: true,
    }).lean();

    // 2. Rollback those salary bumps
    let rolledBack = 0;
    for (const review of promotionReviews) {
      let employee = await PayrollEmployee.findById(review.employeeId);
      if (!employee) {
        employee = await PayrollEmployee.findOne({ name: review.employeeName });
      }
      if (employee) {
        const oldSalary = employee.baseSalary;
        employee.baseSalary = Number((employee.baseSalary / PROMOTION_RAISE_FACTOR).toFixed(2));
        await employee.save();
        console.log("[Performance] Rolled back salary:", oldSalary, "->", employee.baseSalary, "for", employee._id);
        rolledBack++;
      }
    }

    // 3. Delete all unprocessed reviews
    const result = await PerformanceReview.deleteMany({ payrollProcessed: { $ne: true } });
    console.log("[Performance] Cleared test reviews:", result.deletedCount, "| Rolled back salaries:", rolledBack);

    return { deletedCount: result.deletedCount, rolledBack };
  },
};
