import { Router } from "express";
import { attendanceController } from "./attendance.controller.js";

const attendanceRouter = Router();

attendanceRouter.post("/checkin", attendanceController.checkIn);
attendanceRouter.post("/checkout", attendanceController.checkOut);
attendanceRouter.get("/today/:employeeId", attendanceController.getTodayStatus);
attendanceRouter.get("/history/:employeeId", attendanceController.getHistory);
attendanceRouter.get("/weekly/:employeeId", attendanceController.getWeekly);
attendanceRouter.get("/daily", attendanceController.getDailyAttendance);
attendanceRouter.get("/stats", attendanceController.getDailyStats);

export { attendanceRouter };
