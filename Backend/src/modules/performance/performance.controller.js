import { performanceService } from "./performance.service.js";

export const performanceController = {
  async listReviews(req, res, next) {
    try {
      const result = await performanceService.getReviews(req.query);
      res.json({
        data: result.reviews,
        summary: result.summary,
        cycles: result.cycles,
      });
    } catch (error) {
      next(error);
    }
  },

  async createReview(req, res, next) {
    const required = ["employeeName", "employeeId", "department", "reviewer", "cycle"];
    const missing = required.find((key) => !req.body?.[key]);
    if (missing) {
      res.status(400).json({ message: `${missing} is required` });
      return;
    }

    try {
      const created = await performanceService.createReview(req.body);
      res.status(201).json({ data: created });
    } catch (error) {
      next(error);
    }
  },

  async updateReview(req, res, next) {
    const required = ["employeeName", "employeeId", "department", "reviewer", "cycle"];
    const missing = required.find((key) => !req.body?.[key]);
    if (missing) {
      res.status(400).json({ message: `${missing} is required` });
      return;
    }

    try {
      const updated = await performanceService.updateReview(req.params.id, req.body);
      res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  },

  async listGoals(req, res, next) {
    try {
      const result = await performanceService.getGoals(req.query);
      res.json({
        data: result.goals,
        summary: result.summary,
        employees: result.employees,
      });
    } catch (error) {
      next(error);
    }
  },

  async createGoal(req, res, next) {
    const required = ["employeeName", "employeeId", "goal", "metric", "dueDate"];
    const missing = required.find((key) => !req.body?.[key]);
    if (missing) {
      res.status(400).json({ message: `${missing} is required` });
      return;
    }

    try {
      const created = await performanceService.createGoal(req.body);
      res.status(201).json({ data: created });
    } catch (error) {
      next(error);
    }
  },

  async updateGoalCurrent(req, res, next) {
    if (req.body?.current === undefined) {
      res.status(400).json({ message: "current is required" });
      return;
    }

    try {
      const updated = await performanceService.updateGoalCurrent(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ message: "Goal not found" });
        return;
      }

      res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  },
};
