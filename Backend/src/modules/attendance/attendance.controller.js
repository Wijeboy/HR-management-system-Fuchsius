import { attendanceService } from "./attendance.service.js";

export const attendanceController = {
  async checkIn(req, res, next) {
    try {
      if (!req.body?.employeeId) {
        res.status(400).json({ message: "employeeId is required" });
        return;
      }

      res.json({ success: true, record: await attendanceService.checkIn(req.body.employeeId) });
    } catch (error) {
      res.status(400).json({ message: error.message || "Failed to check in" });
    }
  },

  async checkOut(req, res, next) {
    try {
      if (!req.body?.employeeId) {
        res.status(400).json({ message: "employeeId is required" });
        return;
      }

      res.json({ success: true, record: await attendanceService.checkOut(req.body.employeeId) });
    } catch (error) {
      res.status(400).json({ message: error.message || "Failed to check out" });
    }
  },

  async getTodayStatus(req, res, next) {
    try {
      res.json({ record: await attendanceService.getTodayStatus(req.params.employeeId) });
    } catch (error) {
      next(error);
    }
  },

  async getHistory(req, res, next) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      res.json(await attendanceService.getEmployeeHistory(req.params.employeeId, page, limit));
    } catch (error) {
      next(error);
    }
  },

  async getWeekly(req, res, next) {
    try {
      res.json(await attendanceService.getWeeklyAttendance(req.params.employeeId));
    } catch (error) {
      next(error);
    }
  },

  async getDailyAttendance(req, res, next) {
    try {
      const dateStr = req.query.date || new Date().toISOString().split("T")[0];
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      res.json(
        await attendanceService.getDailyAttendance(
          dateStr,
          String(req.query.department || ""),
          String(req.query.status || ""),
          page,
          limit
        )
      );
    } catch (error) {
      next(error);
    }
  },

  async getDailyStats(req, res, next) {
    try {
      const dateStr = req.query.date || new Date().toISOString().split("T")[0];
      res.json({
        stats: await attendanceService.getDailyStats(dateStr),
        departments: await attendanceService.getDepartments(),
      });
    } catch (error) {
      next(error);
    }
  },
};
