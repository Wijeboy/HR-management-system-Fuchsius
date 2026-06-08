import { prisma } from "../../lib/prisma.js";

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

const sortByDateDesc = (items, field) =>
  [...items].sort((left, right) => new Date(right[field] || 0) - new Date(left[field] || 0));

export const leaveService = {
  async getOrCreateBalance(employeeId) {
    const year = new Date().getFullYear();
    const existing = await prisma.leaveBalance.findFirst({ where: { employeeId, year } });
    if (existing) return existing;

    return prisma.leaveBalance.create({
      data: {
        id: nextId("leave-balance"),
        employeeId,
        year,
        ...DEFAULT_BALANCE,
      },
    });
  },

  async submitLeave(employeeId, data, file) {
    const employee = await prisma.user.findFirst({ where: { employeeId, isActive: true } });
    if (!employee) throw new Error("Employee not found");

    const { leaveType, startDate, endDate, reason } = data;
    const duration = calcDuration(startDate, endDate);

    const balance = await this.getOrCreateBalance(employeeId);
    const remaining = leaveType === "medical" ? balance.medical : balance.vacation;

    if (remaining < duration) {
      const error = new Error(
        `You have exceeded your ${leaveType} leave limit. Only ${remaining} day(s) remaining.`
      );
      error.code = "LEAVE_EXCEEDED";
      throw error;
    }

    const request = await prisma.leaveRequest.create({
      data: {
        id: nextId("leave"),
      employeeId,
      employeeName: employee.name,
      department: employee.department,
      leaveType,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : null,
      durationDays: duration,
      reason,
      status: "pending",
      supportingDocument: file?.filename || null,
      documentMimeType: file?.mimetype || null,
      reviewedBy: null,
      reviewedAt: null,
      hrComment: "",
      },
    });

    const hrUsers = await prisma.user.findMany({ where: { role: "hr", isActive: true } });
    for (const hr of hrUsers) {
      await prisma.notification.create({
        data: {
        id: nextId("notif"),
        recipientId: hr.id,
        recipientRole: "hr",
        message: `${employee.name} submitted a ${leaveType} leave request (${duration} day${duration > 1 ? "s" : ""}).`,
        type: "leave_submitted",
        relatedLeaveId: request.id,
        read: false,
        },
      });
    }

    return request;
  },

  async updateLeave(leaveId, employeeId, data, file) {
    const request = await prisma.leaveRequest.findUnique({ where: { id: leaveId } });
    if (!request) throw new Error("Leave request not found");
    if (request.employeeId !== employeeId) throw new Error("Unauthorized");
    if (request.status !== "pending") throw new Error("Only pending requests can be updated");

    const { leaveType, startDate, endDate, reason } = data;
    const duration = calcDuration(startDate, endDate);

    if (leaveType !== request.leaveType || duration !== request.durationDays) {
      const balance = await this.getOrCreateBalance(employeeId);
      const adjustedRemaining =
        (leaveType === "medical" ? balance.medical : balance.vacation) + request.durationDays;

      if (adjustedRemaining < duration) {
        const error = new Error(`You have exceeded your ${leaveType} leave limit.`);
        error.code = "LEAVE_EXCEEDED";
        throw error;
      }
    }

    return prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        leaveType,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        durationDays: duration,
        reason,
        ...(file ? { supportingDocument: file.filename, documentMimeType: file.mimetype } : {}),
      },
    });
  },

  async deleteLeave(leaveId, employeeId) {
    const request = await prisma.leaveRequest.findUnique({ where: { id: leaveId } });
    if (!request) throw new Error("Leave request not found");
    if (request.employeeId !== employeeId) throw new Error("Unauthorized");

    if (request.status === "approved") {
      const balance = await this.getOrCreateBalance(employeeId);
      if (request.leaveType === "medical") {
        balance.medical += request.durationDays;
        balance.medicalUsed = Math.max(0, balance.medicalUsed - request.durationDays);
      } else {
        balance.vacation += request.durationDays;
        balance.vacationUsed = Math.max(0, balance.vacationUsed - request.durationDays);
      }
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          medical: balance.medical,
          vacation: balance.vacation,
          medicalUsed: balance.medicalUsed,
          vacationUsed: balance.vacationUsed,
        },
      });
    }

    await prisma.leaveRequest.delete({ where: { id: leaveId } });
    return { success: true };
  },

  async getEmployeeLeaveHistory(employeeId, page = 1, limit = 10) {
    const records = await prisma.leaveRequest.findMany({ where: { employeeId }, orderBy: { createdAt: "desc" } });
    return paginate(records, page, limit);
  },

  async getPendingRequests(page = 1, limit = 10) {
    const records = await prisma.leaveRequest.findMany({ where: { status: "pending" }, orderBy: { createdAt: "desc" } });
    return paginate(records, page, limit);
  },

  async getApprovedRequests(page = 1, limit = 10) {
    const records = await prisma.leaveRequest.findMany({ where: { status: "approved" }, orderBy: { reviewedAt: "desc" } });
    return paginate(records, page, limit);
  },

  async getRejectedRequests(page = 1, limit = 10) {
    const records = await prisma.leaveRequest.findMany({ where: { status: "rejected" }, orderBy: { reviewedAt: "desc" } });
    return paginate(records, page, limit);
  },

  async approveLeave(leaveId, hrId) {
    const request = await prisma.leaveRequest.findUnique({ where: { id: leaveId } });
    if (!request) throw new Error("Leave request not found");
    if (request.status !== "pending") throw new Error("Request is not pending");

    const balance = await this.getOrCreateBalance(request.employeeId);

    if (request.leaveType === "medical") {
      if (balance.medical < request.durationDays) throw new Error("Insufficient medical leave balance");
      balance.medical -= request.durationDays;
      balance.medicalUsed += request.durationDays;
    } else {
      if (balance.vacation < request.durationDays) throw new Error("Insufficient vacation leave balance");
      balance.vacation -= request.durationDays;
      balance.vacationUsed += request.durationDays;
    }

    await prisma.leaveBalance.update({
      where: { id: balance.id },
      data: {
        medical: balance.medical,
        vacation: balance.vacation,
        medicalUsed: balance.medicalUsed,
        vacationUsed: balance.vacationUsed,
      },
    });

    const updated = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: "approved",
        reviewedBy: hrId,
        reviewedAt: new Date().toISOString(),
      },
    });

    const employeeUser = await prisma.user.findFirst({ where: { employeeId: request.employeeId, isActive: true } });
    await prisma.notification.create({
      data: {
        id: nextId("notif"),
        recipientId: employeeUser?.id || request.employeeId,
        recipientRole: "employee",
        message: `Your ${request.leaveType} leave request has been approved.`,
        type: "leave_approved",
        relatedLeaveId: request.id,
        read: false,
      },
    });

    return updated;
  },

  async rejectLeave(leaveId, hrId, comment = "") {
    const request = await prisma.leaveRequest.findUnique({ where: { id: leaveId } });
    if (!request) throw new Error("Leave request not found");
    if (request.status !== "pending") throw new Error("Request is not pending");

    const updated = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: "rejected",
        reviewedBy: hrId,
        reviewedAt: new Date().toISOString(),
        hrComment: comment,
      },
    });

    const employeeUser = await prisma.user.findFirst({ where: { employeeId: request.employeeId, isActive: true } });
    await prisma.notification.create({
      data: {
        id: nextId("notif"),
        recipientId: employeeUser?.id || request.employeeId,
        recipientRole: "employee",
        message: `Your ${request.leaveType} leave request has been rejected.${comment ? ` Reason: ${comment}` : ""}`,
        type: "leave_rejected",
        relatedLeaveId: request.id,
        read: false,
      },
    });

    return updated;
  },

  async getRequestById(leaveId) {
    return prisma.leaveRequest.findUnique({ where: { id: leaveId } });
  },
};
