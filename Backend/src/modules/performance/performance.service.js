import { prisma } from "../../lib/prisma.js";
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

  return reviews.filter((review) => {
    const matchesSearch =
      !search ||
      review.employeeName.toLowerCase().includes(search) ||
      review.employeeId.toLowerCase().includes(search) ||
      review.department.toLowerCase().includes(search);

    const matchesCycle = cycle === "All Cycles" || review.cycle === cycle;
    const matchesStatus = status === "All Status" || review.status === status;

    return matchesSearch && matchesCycle && matchesStatus;
  });
};

const summarizeReviews = (reviews) => {
  const completed = reviews.filter((review) => review.status === "Completed");
  const avgRating =
    completed.length === 0
      ? 0
      : completed.reduce((sum, review) => sum + toNumber(review.finalRating), 0) / completed.length;

  return {
    totalReviews: reviews.length,
    completed: completed.length,
    promotions: reviews.filter((review) => review.recommendation === "Promotion").length,
    bonuses: reviews.filter((review) => review.recommendation === "Bonus").length,
    avgRating: Number(avgRating.toFixed(2)),
  };
};

const decorateGoals = (goals) =>
  goals.map((goal) => {
    const progress = getGoalProgress(goal);
    return {
      ...goal,
      progress: Number(progress.toFixed(2)),
      status: getGoalStatus(progress),
    };
  });

const filterGoals = (goals, query) => {
  const employee = query.employee || "All Employees";
  const status = query.status || "All Status";

  return goals.filter((goal) => {
    const employeeLabel = `${goal.employeeName} (${goal.employeeId})`;
    const matchesEmployee = employee === "All Employees" || employee === employeeLabel;
    const matchesStatus = status === "All Status" || goal.status === status;
    return matchesEmployee && matchesStatus;
  });
};

const summarizeGoals = (goals) => {
  if (goals.length === 0) {
    return {
      activeGoals: 0,
      achieved: 0,
      atRisk: 0,
      weightedPerformance: 0,
    };
  }

  const totalWeight = goals.reduce((sum, goal) => sum + toNumber(goal.weight), 0) || 1;
  const weightedProgress = goals.reduce((sum, goal) => {
    const normalized = Math.min(toNumber(goal.progress), 120);
    return sum + normalized * toNumber(goal.weight);
  }, 0);

  return {
    activeGoals: goals.length,
    achieved: goals.filter((goal) => goal.status === "Achieved").length,
    atRisk: goals.filter((goal) => goal.status === "At Risk").length,
    weightedPerformance: Number((weightedProgress / totalWeight).toFixed(2)),
  };
};

const nextReviewId = async (cycle) => {
  const token = String(cycle || "NA")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toUpperCase();

  const count = await prisma.performanceReview.count({
    where: { id: { startsWith: `PRV-${token}-` } },
  });

  return `PRV-${token}-${String(count + 1).padStart(3, "0")}`;
};

const nextGoalId = async () => {
  const existing = await prisma.performanceGoal.findMany({
    select: { id: true },
  });

  const maxId = existing.reduce((max, goal) => {
    const raw = goal.id.startsWith("KPI-") ? goal.id.slice(4) : "";
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
  }, 0);

  return `KPI-${String(maxId + 1).padStart(3, "0")}`;
};

const toBoolean = (value) => value === true || value === "true";

export const performanceService = {
  async getReviews(query) {
    const allReviews = await prisma.performanceReview.findMany({
      orderBy: [{ cycle: "desc" }, { id: "desc" }],
    });

    const reviews = filterReviews(allReviews, query);

    return {
      reviews: reviews.map((item) => ({
        ...item,
        ratingBand: item.finalRating ? getRatingBand(item.finalRating) : "Not Rated",
      })),
      summary: summarizeReviews(reviews),
      cycles: [...new Set(allReviews.map((review) => review.cycle))],
    };
  },

  async createReview(payload) {
    const goalsScore = toNumber(payload.goalsScore);
    const competencyScore = toNumber(payload.competencyScore);
    const behaviorScore = toNumber(payload.behaviorScore);
    const calculated = Number(((goalsScore + competencyScore + behaviorScore) / 3).toFixed(1));
    const finalRating = payload.finalRating !== undefined ? toNumber(payload.finalRating) : calculated;

    const review = {
      id: await nextReviewId(payload.cycle),
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

    return prisma.performanceReview.create({ data: review });
  },

  async updateReview(id, payload) {
    const goalsScore = toNumber(payload.goalsScore);
    const competencyScore = toNumber(payload.competencyScore);
    const behaviorScore = toNumber(payload.behaviorScore);
    const calculated = Number(((goalsScore + competencyScore + behaviorScore) / 3).toFixed(1));
    const finalRating = payload.finalRating !== undefined ? toNumber(payload.finalRating) : calculated;

    return prisma.performanceReview.update({
      where: { id },
      data: {
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
    });
  },

  async getGoals(query) {
    const allGoals = await prisma.performanceGoal.findMany({
      orderBy: [{ dueDate: "asc" }, { id: "asc" }],
    });

    const decorated = decorateGoals(allGoals);
    const filtered = filterGoals(decorated, query);

    return {
      goals: filtered,
      summary: summarizeGoals(filtered),
      employees: [...new Set(allGoals.map((goal) => `${goal.employeeName} (${goal.employeeId})`))],
    };
  },

  async createGoal(payload) {
    const goal = {
      id: await nextGoalId(),
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

    return prisma.performanceGoal.create({ data: goal });
  },

  async updateGoalCurrent(id, payload) {
    const result = await prisma.performanceGoal.updateMany({
      where: { id },
      data: { current: toNumber(payload.current) },
    });

    if (result.count === 0) return null;

    return prisma.performanceGoal.findUnique({ where: { id } });
  },
};
