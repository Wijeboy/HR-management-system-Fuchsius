import PerformanceReview from "../../models/PerformanceReview.js";
import PerformanceGoal from "../../models/PerformanceGoal.js";
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

  const prefix = `PRV-${token}-`;
  const lastReview = await PerformanceReview.findOne({ _id: { $regex: `^${prefix}` } })
    .sort({ _id: -1 })
    .lean();

  let nextSeq = 1;
  if (lastReview && lastReview._id) {
    const parts = lastReview._id.split("-");
    if (parts.length >= 3) {
      // Handle potential extra hyphens in token
      const seqStr = parts[parts.length - 1];
      const lastSeq = parseInt(seqStr, 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }
  }

  return `${prefix}${String(nextSeq).padStart(3, "0")}`;
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
      recommendation: payload.recommendation || "No Change",
      status: payload.status || "In Progress",
    };

    const created = await PerformanceReview.create(review);
    return created.toObject();
  },

  async updateReview(id, payload) {
    const goalsScore = toNumber(payload.goalsScore);
    const competencyScore = toNumber(payload.competencyScore);
    const behaviorScore = toNumber(payload.behaviorScore);
    const calculated = Number(((goalsScore + competencyScore + behaviorScore) / 3).toFixed(1));
    const finalRating = payload.finalRating !== undefined ? toNumber(payload.finalRating) : calculated;

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
        recommendation: payload.recommendation,
        status: payload.status,
      },
      { new: true }
    ).lean();

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
};
