const leaveService = require('../services/leaveService');

/**
 * POST /api/leave/submit
 * multipart/form-data: employeeId, leaveType, startDate, endDate?, reason, file?
 */
const submitLeave = async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;
    if (!employeeId || !leaveType || !startDate || !reason) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    const request = await leaveService.submitLeave(
      employeeId,
      { leaveType, startDate, endDate: endDate || null, reason },
      req.file || null
    );
    res.status(201).json({ success: true, request });
  } catch (err) {
    if (err.code === 'LEAVE_EXCEEDED') return res.status(422).json({ message: err.message, code: 'LEAVE_EXCEEDED' });
    res.status(400).json({ message: err.message });
  }
};

/**
 * PUT /api/leave/:id
 */
const updateLeave = async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;
    const request = await leaveService.updateLeave(
      req.params.id,
      employeeId,
      { leaveType, startDate, endDate: endDate || null, reason },
      req.file || null
    );
    res.json({ success: true, request });
  } catch (err) {
    if (err.code === 'LEAVE_EXCEEDED') return res.status(422).json({ message: err.message, code: 'LEAVE_EXCEEDED' });
    res.status(400).json({ message: err.message });
  }
};

/**
 * DELETE /api/leave/:id
 * Body: { employeeId }
 */
const deleteLeave = async (req, res) => {
  try {
    const { employeeId } = req.body;
    await leaveService.deleteLeave(req.params.id, employeeId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * GET /api/leave/balance/:employeeId
 */
const getBalance = async (req, res) => {
  try {
    const balance = await leaveService.getOrCreateBalance(req.params.employeeId);
    res.json({ balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/leave/history/:employeeId?page=1&limit=10
 */
const getHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const data = await leaveService.getEmployeeLeaveHistory(req.params.employeeId, page, limit);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/leave/pending?page=1&limit=10  (HR)
 */
const getPending = async (req, res) => {
  try {
    const data = await leaveService.getPendingRequests(
      parseInt(req.query.page) || 1,
      parseInt(req.query.limit) || 10
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/leave/approved?page=1&limit=10  (HR)
 */
const getApproved = async (req, res) => {
  try {
    const data = await leaveService.getApprovedRequests(
      parseInt(req.query.page) || 1,
      parseInt(req.query.limit) || 10
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/leave/rejected?page=1&limit=10  (HR)
 */
const getRejected = async (req, res) => {
  try {
    const data = await leaveService.getRejectedRequests(
      parseInt(req.query.page) || 1,
      parseInt(req.query.limit) || 10
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/leave/:id/approve
 * Body: { hrId }
 */
const approveLeave = async (req, res) => {
  try {
    const { hrId } = req.body;
    const hrIdToUse = req.user?.id || hrId;
    if (!hrIdToUse) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const request = await leaveService.approveLeave(req.params.id, hrIdToUse);
    res.json({ success: true, request });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * POST /api/leave/:id/reject
 * Body: { hrId, comment? }
 */
const rejectLeave = async (req, res) => {
  try {
    const { hrId, comment } = req.body;
    const hrIdToUse = req.user?.id || hrId;
    if (!hrIdToUse) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const request = await leaveService.rejectLeave(req.params.id, hrIdToUse, comment || '');
    res.json({ success: true, request });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * GET /api/leave/:id  (get single request - for view modal)
 */
const getSingleRequest = async (req, res) => {
  try {
    const LeaveRequest = require('../models/LeaveRequest');
    const req2 = await LeaveRequest.findById(req.params.id);
    if (!req2) return res.status(404).json({ message: 'Not found' });
    res.json({ request: req2 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  submitLeave,
  updateLeave,
  deleteLeave,
  getBalance,
  getHistory,
  getPending,
  getApproved,
  getRejected,
  approveLeave,
  rejectLeave,
  getSingleRequest,
};