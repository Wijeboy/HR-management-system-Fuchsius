import User from "../../../models/User.js";
import LeaveRequest from "../../../models/LeaveRequest.js";
import LeaveBalance from "../../../models/LeaveBalance.js";
import Notification from "../../../models/Notification.js";

const DEFAULT_BALANCE = {
  medical: 12,
  vacation: 18,
  medicalUsed: 0,
  vacationUsed: 0,
};

const paginate = (items, page = 1, limit = 10) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 10);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const records = items.slice((safePage - 1) * safeLimit, safePage * safeLimit);
  return { records, total, page: safePage, totalPages };
};

const calcDuration = (startDate, endDate) => {
  if (!endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
};

const nextId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const attachProfileImages = async (records = []) => {
  const empIds = [...new Set(records.map((r) => r.employeeId).filter(Boolean))];
  if (empIds.length === 0) return records;

  const users = await User.find({ employeeId: { $in: empIds } }, "employeeId profileImage").lean();
  const imageMap = new Map(users.map((u) => [u.employeeId, u.profileImage || ""]));

  return records.map((r) => ({
    ...r,
    profileImage: imageMap.get(r.employeeId) || "",
  }));
};

export const leaveService = {
  async getOrCreateBalance(employeeId) {
    const year = new Date().getFullYear();
    const existing = await LeaveBalance.findOne({ employeeId, year }).lean();
    if (existing) return existing;

    const created = await LeaveBalance.create({
      employeeId,
      year,
      ...DEFAULT_BALANCE,
    });
    return created.toObject();
  },

  async submitLeave(employeeId, data, file) {
    const employee = await User.findOne({ employeeId, isActive: true }).lean();
    if (!employee) throw new Error("Employee not found");

    const { leaveType, startDate, endDate, reason } = data;
    const duration = calcDuration(startDate, endDate);

    const balance = await this.getOrCreateBalance(employeeId);
    const remaining = leaveType === "medical" ? balance.medical : balance.vacation;

    if (remaining < duration) {
      const err = new Error(
        `You have exceeded your ${leaveType} leave limit. Only ${remaining} day(s) remaining.`
      );
      err.code = "LEAVE_EXCEEDED";
      throw err;
    }

    const request = await LeaveRequest.create({
      employeeId,
      employeeName: employee.name,
      department: employee.department,
      leaveType,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      durationDays: duration,
      reason,
      status: "pending",
      supportingDocument: file?.filename || null,
      documentMimeType: file?.mimetype || null,
      reviewedBy: null,
      reviewedAt: null,
      hrComment: "",
    });

    // notify HR
    const hrUsers = await User.find({ role: "hr", isActive: true }).lean();
    for (const hr of hrUsers) {
      await Notification.create({
        recipientId: hr.id,
        recipientRole: "hr",
        message: `${employee.name} submitted a ${leaveType} leave request (${duration} day${duration > 1 ? "s" : ""}).`,
        type: "leave_submitted",
        relatedLeaveId: String(request._id),
        read: false,
      });
    }

    return request.toObject();
  },

  async updateLeave(leaveId, employeeId, data, file) {
    const request = await LeaveRequest.findById(leaveId).lean();
    if (!request) throw new Error("Leave request not found");
    if (request.employeeId !== employeeId) throw new Error("Unauthorized");
    if (request.status !== "pending") throw new Error("Only pending requests can be updated");

    const { leaveType, startDate, endDate, reason } = data;
    const duration = calcDuration(startDate, endDate);

    if (leaveType !== request.leaveType || duration !== request.durationDays) {
      const balance = await this.getOrCreateBalance(employeeId);
      const adjusted =
        (leaveType === "medical" ? balance.medical : balance.vacation) + request.durationDays;

      if (adjusted < duration) {
        const err = new Error(`You have exceeded your ${leaveType} leave limit.`);
        err.code = "LEAVE_EXCEEDED";
        throw err;
      }
    }

    const updateData = {
      leaveType,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      durationDays: duration,
      reason,
    };

    if (file) {
      updateData.supportingDocument = file.filename;
      updateData.documentMimeType = file.mimetype;
    }

    const updated = await LeaveRequest.findByIdAndUpdate(leaveId, updateData, { new: true }).lean();
    return updated;
  },

  async deleteLeave(leaveId, employeeId) {
    const request = await LeaveRequest.findById(leaveId).lean();
    if (!request) throw new Error("Leave request not found");
    if (request.employeeId !== employeeId) throw new Error("Unauthorized");

    if (request.status === "approved") {
      const balance = await this.getOrCreateBalance(employeeId);
      const update = {};

      if (request.leaveType === "medical") {
        update.medical = balance.medical + request.durationDays;
        update.medicalUsed = Math.max(0, balance.medicalUsed - request.durationDays);
      } else {
        update.vacation = balance.vacation + request.durationDays;
        update.vacationUsed = Math.max(0, balance.vacationUsed - request.durationDays);
      }

      await LeaveBalance.findByIdAndUpdate(balance._id, update);
    }

    await LeaveRequest.findByIdAndDelete(leaveId);
    return { success: true };
  },

  async getEmployeeLeaveHistory(employeeId, page = 1, limit = 10) {
    const records = await LeaveRequest.find({ employeeId }).sort({ createdAt: -1 }).lean();
    return paginate(await attachProfileImages(records), page, limit);
  },

  async getPendingRequests(page = 1, limit = 10) {
    const records = await LeaveRequest.find({ status: "pending" }).sort({ createdAt: -1 }).lean();
    return paginate(await attachProfileImages(records), page, limit);
  },

  async getApprovedRequests(page = 1, limit = 10) {
    const records = await LeaveRequest.find({ status: "approved" }).sort({ reviewedAt: -1 }).lean();
    return paginate(await attachProfileImages(records), page, limit);
  },

  async getRejectedRequests(page = 1, limit = 10) {
    const records = await LeaveRequest.find({ status: "rejected" }).sort({ reviewedAt: -1 }).lean();
    return paginate(await attachProfileImages(records), page, limit);
  },

  async approveLeave(leaveId, hrId) {
    const request = await LeaveRequest.findById(leaveId).lean();
    if (!request) throw new Error("Leave request not found");
    if (request.status !== "pending") throw new Error("Request is not pending");

    const balance = await this.getOrCreateBalance(request.employeeId);

    if (request.leaveType === "medical") {
      if (balance.medical < request.durationDays) throw new Error("Insufficient medical leave balance");
      await LeaveBalance.findByIdAndUpdate(balance._id, {
        medical: balance.medical - request.durationDays,
        medicalUsed: balance.medicalUsed + request.durationDays,
      });
    } else {
      if (balance.vacation < request.durationDays) throw new Error("Insufficient vacation leave balance");
      await LeaveBalance.findByIdAndUpdate(balance._id, {
        vacation: balance.vacation - request.durationDays,
        vacationUsed: balance.vacationUsed + request.durationDays,
      });
    }

    const updated = await LeaveRequest.findByIdAndUpdate(
      leaveId,
      { status: "approved", reviewedBy: hrId, reviewedAt: new Date() },
      { new: true }
    ).lean();

    const empUser = await User.findOne({ employeeId: request.employeeId, isActive: true }).lean();
    await Notification.create({
      recipientId: empUser?.id || request.employeeId,
      recipientRole: "employee",
      message: `Your ${request.leaveType} leave request has been approved.`,
      type: "leave_approved",
      relatedLeaveId: String(request._id),
      read: false,
    });

    return updated;
  },

  async rejectLeave(leaveId, hrId, comment = "") {
    const request = await LeaveRequest.findById(leaveId).lean();
    if (!request) throw new Error("Leave request not found");
    if (request.status !== "pending") throw new Error("Request is not pending");

    const updated = await LeaveRequest.findByIdAndUpdate(
      leaveId,
      { status: "rejected", reviewedBy: hrId, reviewedAt: new Date(), hrComment: comment },
      { new: true }
    ).lean();

    const empUser = await User.findOne({ employeeId: request.employeeId, isActive: true }).lean();
    await Notification.create({
      recipientId: empUser?.id || request.employeeId,
      recipientRole: "employee",
      message: `Your ${request.leaveType} leave request has been rejected.${comment ? ` Reason: ${comment}` : ""}`,
      type: "leave_rejected",
      relatedLeaveId: String(request._id),
      read: false,
    });

    return updated;
  },

  async getRequestById(leaveId) {
    const request = await LeaveRequest.findById(leaveId).lean();
    if (!request) return null;
    const [record] = await attachProfileImages([request]);
    return record;
  },
};
