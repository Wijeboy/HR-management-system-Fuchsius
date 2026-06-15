const LeaveRequest = require('../models/LeaveRequest');
const LeaveBalance = require('../models/LeaveBalance');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { defaultLeaveBalances } = require('../data/dummyData');

/**
 * LeaveService
 * ------------
 * All business logic for leave management.
 */

/**
 * Calculate number of calendar days between two dates (inclusive).
 */
const calcDuration = (startDate, endDate) => {
  if (!endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end - start;
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
};

/**
 * Get or initialize leave balance for an employee for the current year.
 */
const getOrCreateBalance = async (employeeId) => {
  const year = new Date().getFullYear();
  let balance = await LeaveBalance.findOne({ employeeId, year });
  if (!balance) {
    balance = await LeaveBalance.create({
      employeeId,
      year,
      medical: defaultLeaveBalances.medical,
      vacation: defaultLeaveBalances.vacation,
      medicalUsed: 0,
      vacationUsed: 0,
    });
  }
  return balance;
};

/**
 * Submit a new leave request.
 */
const submitLeave = async (employeeId, data, file) => {
  const emp = await User.findOne({ employeeId, isActive: true }).select('id name department');
  if (!emp) throw new Error('Employee not found');

  const { leaveType, startDate, endDate, reason } = data;
  const duration = calcDuration(startDate, endDate);

  // Check balance
  const balance = await getOrCreateBalance(employeeId);
  const remaining = leaveType === 'medical' ? balance.medical : balance.vacation;
  if (remaining < duration) {
    const err = new Error(
      `You have exceeded your ${leaveType} leave limit. Only ${remaining} day(s) remaining.`
    );
    err.code = 'LEAVE_EXCEEDED';
    throw err;
  }

  const leaveData = {
    employeeId,
    employeeName: emp.name,
    department: emp.department,
    leaveType,
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : null,
    durationDays: duration,
    reason,
    status: 'pending',
  };

  if (file) {
    leaveData.supportingDocument = file.filename;
    leaveData.documentMimeType = file.mimetype;
  }

  const request = await LeaveRequest.create(leaveData);

  // Notify all HR managers
  const hrUsers = await User.find({ role: 'hr', isActive: true }).select('id role');
  if (hrUsers.length > 0) {
    const notifications = hrUsers.map((hr) => ({
      recipientId: hr.id,
      recipientRole: 'hr',
      message: `${emp.name} submitted a ${leaveType} leave request (${duration} day${duration > 1 ? 's' : ''}).`,
      type: 'leave_submitted',
      relatedLeaveId: request._id.toString(),
    }));
    await Notification.insertMany(notifications);
  }

  return request;
};

/**
 * Update a pending leave request.
 */
const updateLeave = async (leaveId, employeeId, data, file) => {
  const request = await LeaveRequest.findById(leaveId);
  if (!request) throw new Error('Leave request not found');
  if (request.employeeId !== employeeId) throw new Error('Unauthorized');
  if (request.status !== 'pending') throw new Error('Only pending requests can be updated');

  const { leaveType, startDate, endDate, reason } = data;
  const duration = calcDuration(startDate, endDate);

  // Check new balance if leave type or duration changed
  if (leaveType !== request.leaveType || duration !== request.durationDays) {
    const balance = await getOrCreateBalance(employeeId);
    // Add back old duration first, then check new
    const oldUsed = request.leaveType === 'medical' ? balance.medicalUsed : balance.vacationUsed;
    const newRemaining =
      (leaveType === 'medical' ? balance.medical : balance.vacation) + request.durationDays;
    if (newRemaining < duration) {
      const err = new Error(
        `You have exceeded your ${leaveType} leave limit.`
      );
      err.code = 'LEAVE_EXCEEDED';
      throw err;
    }
  }

  request.leaveType = leaveType;
  request.startDate = new Date(startDate);
  request.endDate = endDate ? new Date(endDate) : null;
  request.durationDays = duration;
  request.reason = reason;
  if (file) {
    request.supportingDocument = file.filename;
    request.documentMimeType = file.mimetype;
  }

  await request.save();
  return request;
};

/**
 * Delete a leave request and restore balance if approved.
 */
const deleteLeave = async (leaveId, employeeId) => {
  const request = await LeaveRequest.findById(leaveId);
  if (!request) throw new Error('Leave request not found');
  if (request.employeeId !== employeeId) throw new Error('Unauthorized');

  // If approved, restore balance
  if (request.status === 'approved') {
    const balance = await getOrCreateBalance(employeeId);
    if (request.leaveType === 'medical') {
      balance.medical += request.durationDays;
      balance.medicalUsed = Math.max(0, balance.medicalUsed - request.durationDays);
    } else {
      balance.vacation += request.durationDays;
      balance.vacationUsed = Math.max(0, balance.vacationUsed - request.durationDays);
    }
    await balance.save();
  }

  await LeaveRequest.findByIdAndDelete(leaveId);
  return { success: true };
};

/**
 * Get leave history for an employee with pagination.
 */
const getEmployeeLeaveHistory = async (employeeId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const total = await LeaveRequest.countDocuments({ employeeId });
  const records = await LeaveRequest.find({ employeeId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  return { records, total, page, totalPages: Math.ceil(total / limit) };
};

/**
 * HR: Get all pending leave requests with pagination.
 */
const getPendingRequests = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const total = await LeaveRequest.countDocuments({ status: 'pending' });
  const records = await LeaveRequest.find({ status: 'pending' })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  return { records, total, page, totalPages: Math.ceil(total / limit) };
};

/**
 * HR: Get approved leave requests with pagination.
 */
const getApprovedRequests = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const total = await LeaveRequest.countDocuments({ status: 'approved' });
  const records = await LeaveRequest.find({ status: 'approved' })
    .sort({ reviewedAt: -1 })
    .skip(skip)
    .limit(limit);
  return { records, total, page, totalPages: Math.ceil(total / limit) };
};

/**
 * HR: Get rejected leave requests with pagination.
 */
const getRejectedRequests = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const total = await LeaveRequest.countDocuments({ status: 'rejected' });
  const records = await LeaveRequest.find({ status: 'rejected' })
    .sort({ reviewedAt: -1 })
    .skip(skip)
    .limit(limit);
  return { records, total, page, totalPages: Math.ceil(total / limit) };
};

/**
 * HR: Approve a leave request.
 */
const approveLeave = async (leaveId, hrId) => {
  const request = await LeaveRequest.findById(leaveId);
  if (!request) throw new Error('Leave request not found');
  if (request.status !== 'pending') throw new Error('Request is not pending');

  // Deduct from balance
  const balance = await getOrCreateBalance(request.employeeId);
  if (request.leaveType === 'medical') {
    if (balance.medical < request.durationDays) throw new Error('Insufficient medical leave balance');
    balance.medical -= request.durationDays;
    balance.medicalUsed += request.durationDays;
  } else {
    if (balance.vacation < request.durationDays) throw new Error('Insufficient vacation leave balance');
    balance.vacation -= request.durationDays;
    balance.vacationUsed += request.durationDays;
  }
  await balance.save();

  request.status = 'approved';
  request.reviewedBy = hrId;
  request.reviewedAt = new Date();
  await request.save();

  // Notify employee
  const employeeUser = await User.findOne({ employeeId: request.employeeId, isActive: true }).select('id');
  await Notification.create({
    recipientId: employeeUser?.id || request.employeeId,
    recipientRole: 'employee',
    message: `Your ${request.leaveType} leave request has been approved.`,
    type: 'leave_approved',
    relatedLeaveId: leaveId,
  });

  return request;
};

/**
 * HR: Reject a leave request.
 */
const rejectLeave = async (leaveId, hrId, comment = '') => {
  const request = await LeaveRequest.findById(leaveId);
  if (!request) throw new Error('Leave request not found');
  if (request.status !== 'pending') throw new Error('Request is not pending');

  request.status = 'rejected';
  request.reviewedBy = hrId;
  request.reviewedAt = new Date();
  request.hrComment = comment;
  await request.save();

  // Notify employee
  const employeeUser = await User.findOne({ employeeId: request.employeeId, isActive: true }).select('id');
  await Notification.create({
    recipientId: employeeUser?.id || request.employeeId,
    recipientRole: 'employee',
    message: `Your ${request.leaveType} leave request has been rejected.${comment ? ' Reason: ' + comment : ''}`,
    type: 'leave_rejected',
    relatedLeaveId: leaveId,
  });

  return request;
};

/**
 * Get approved leave employee IDs for a specific date (for attendance stats).
 */
const getApprovedLeaveEmployeeIdsForDate = async (dateStr) => {
  const date = new Date(dateStr);
  const requests = await LeaveRequest.find({
    status: 'approved',
    startDate: { $lte: date },
    $or: [{ endDate: { $gte: date } }, { endDate: null, startDate: date }],
  });
  return requests.map((r) => r.employeeId);
};

module.exports = {
  submitLeave,
  updateLeave,
  deleteLeave,
  getOrCreateBalance,
  getEmployeeLeaveHistory,
  getPendingRequests,
  getApprovedRequests,
  getRejectedRequests,
  approveLeave,
  rejectLeave,
  getApprovedLeaveEmployeeIdsForDate,
};