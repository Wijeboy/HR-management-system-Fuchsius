import { Router } from "express";
import { performanceController } from "./performance.controller.js";

const performanceRouter = Router();

performanceRouter.get("/reviews", performanceController.listReviews);
performanceRouter.post("/reviews", performanceController.createReview);
performanceRouter.delete("/reviews/clear-test", performanceController.clearTestReviews);
performanceRouter.put("/reviews/:id", performanceController.updateReview);

performanceRouter.get("/goals", performanceController.listGoals);
performanceRouter.post("/goals", performanceController.createGoal);
performanceRouter.patch("/goals/:id/current", performanceController.updateGoalCurrent);

export { performanceRouter };
