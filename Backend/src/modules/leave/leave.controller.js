import { leaveService } from "./leave.service.js";

const mapLeaveRecord = (record) => (record ? { ...record, id: record._id || record.id } : record);
const mapPaged = (data) => ({ ...data, records: (data.records || []).map(mapLeaveRecord) });

export const leaveController = {
  async submitLeave(req, res, next) {
    try {
      const { employeeId, leaveType, startDate, endDate, reason } = req.body || {};
      if (!employeeId || !leaveType || !startDate || !reason) {
        res.status(400).json({ message: "Required fields missing" });
        return;
      }

      const request = await leaveService.submitLeave(
        employeeId,
        { leaveType, startDate, endDate: endDate || null, reason },
        req.file || null
      );

      res.status(201).json({ success: true, request: mapLeaveRecord(request) });
    } catch (error) {
      res.status(error.code === "LEAVE_EXCEEDED" ? 422 : 400).json({
        message: error.message || "Failed to submit leave request",
        ...(error.code ? { code: error.code } : {}),
      });
    }
  },

  async updateLeave(req, res, next) {
    try {
      const { employeeId, leaveType, startDate, endDate, reason } = req.body || {};
      const request = await leaveService.updateLeave(
        req.params.id,
        employeeId,
        { leaveType, startDate, endDate: endDate || null, reason },
        req.file || null
      );

      res.json({ success: true, request: mapLeaveRecord(request) });
    } catch (error) {
      res.status(error.code === "LEAVE_EXCEEDED" ? 422 : 400).json({
        message: error.message || "Failed to update leave request",
        ...(error.code ? { code: error.code } : {}),
      });
    }
  },

  async deleteLeave(req, res, next) {
    try {
      await leaveService.deleteLeave(req.params.id, req.body?.employeeId);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: error.message || "Failed to delete leave request" });
    }
  },

  async getBalance(req, res, next) {
    try {
      res.json({ balance: await leaveService.getOrCreateBalance(req.params.employeeId) });
    } catch (error) {
      next(error);
    }
  },

  async getHistory(req, res, next) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      res.json(mapPaged(await leaveService.getEmployeeLeaveHistory(req.params.employeeId, page, limit)));
    } catch (error) {
      next(error);
    }
  },

  async getPending(req, res, next) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      res.json(mapPaged(await leaveService.getPendingRequests(page, limit)));
    } catch (error) {
      next(error);
    }
  },

  async getApproved(req, res, next) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      res.json(mapPaged(await leaveService.getApprovedRequests(page, limit)));
    } catch (error) {
      next(error);
    }
  },

  async getRejected(req, res, next) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      res.json(mapPaged(await leaveService.getRejectedRequests(page, limit)));
    } catch (error) {
      next(error);
    }
  },

  async approveLeave(req, res, next) {
    try {
      if (!req.body?.hrId) {
        res.status(400).json({ message: "hrId is required" });
        return;
      }

      res.json({ success: true, request: mapLeaveRecord(await leaveService.approveLeave(req.params.id, req.body.hrId)) });
    } catch (error) {
      res.status(400).json({ message: error.message || "Failed to approve leave request" });
    }
  },

  async rejectLeave(req, res, next) {
    try {
      if (!req.body?.hrId) {
        res.status(400).json({ message: "hrId is required" });
        return;
      }

      res.json({
        success: true,
        request: mapLeaveRecord(await leaveService.rejectLeave(req.params.id, req.body.hrId, req.body.comment || "")),
      });
    } catch (error) {
      res.status(400).json({ message: error.message || "Failed to reject leave request" });
    }
  },

  async getSingleRequest(req, res, next) {
    try {
      const request = await leaveService.getRequestById(req.params.id);
      if (!request) {
        res.status(404).json({ message: "Not found" });
        return;
      }

      res.json({ request: mapLeaveRecord(request) });
    } catch (error) {
      next(error);
    }
  },
};
