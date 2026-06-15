import { Router } from "express";
import { attendanceRouter } from "../modules/attendance/attendance.routes.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { leaveRouter } from "../modules/leave/leave.routes.js";
import { notificationRouter } from "../modules/notifications/notifications.routes.js";
import { payrollRouter } from "../modules/payroll/payroll.routes.js";
import { performanceRouter } from "../modules/performance/performance.routes.js";
import { recruitmentRouter } from "../modules/recruitment/recruitment.routes.js";
import { usersRouter } from "../modules/users/users.routes.js";

const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    moduleCoverage: {
      attendance: true,
      leave: true,
      notifications: true,
      payroll: true,
      performance: true,
      recruitment: true,
    },
  });
});

apiRouter.use("/attendance", attendanceRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/leave", leaveRouter);
apiRouter.use("/notifications", notificationRouter);
apiRouter.use("/payroll", payrollRouter);
apiRouter.use("/performance", performanceRouter);
apiRouter.use("/recruitment", recruitmentRouter);
apiRouter.use("/users", usersRouter);

export { apiRouter };
