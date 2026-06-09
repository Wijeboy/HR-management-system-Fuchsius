import attendanceService from '../services/attendanceService.js';
import leaveService from '../services/leaveService.js';

/**
 * POST /api/attendance/checkin
 * Body: { employeeId }
 */
const checkIn = async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ message: 'employeeId is required' });
    const record = await attendanceService.checkIn(employeeId);
    res.json({ success: true, record });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * POST /api/attendance/checkout
 * Body: { employeeId }
 */
const checkOut = async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ message: 'employeeId is required' });
    const record = await attendanceService.checkOut(employeeId);
    res.json({ success: true, record });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * GET /api/attendance/today/:employeeId
 */
const getTodayStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const record = await attendanceService.getTodayStatus(employeeId);
    res.json({ record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/attendance/history/:employeeId?page=1&limit=10
 */
const getHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const data = await attendanceService.getEmployeeHistory(employeeId, page, limit);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/attendance/weekly/:employeeId
 */
const getWeekly = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const data = await attendanceService.getWeeklyAttendance(employeeId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/attendance/daily?date=YYYY-MM-DD&department=&status=&page=1&limit=10
 */
const getDailyAttendance = async (req, res) => {
  try {
    const { date, department, status, page = 1, limit = 10 } = req.query;
    const dateStr = date || new Date().toISOString().split('T')[0];

    const approvedLeaveIds = await leaveService.getApprovedLeaveEmployeeIdsForDate(dateStr);

    const data = await attendanceService.getDailyAttendance(
      dateStr,
      department || null,
      status || null,
      parseInt(page),
      parseInt(limit)
    );

    // Mark on-leave employees
    data.records = data.records.map((r) => {
      if (approvedLeaveIds.includes(r.employeeId) && r.status === 'absent') {
        return { ...r, status: 'on_leave' };
      }
      return r;
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/attendance/stats?date=YYYY-MM-DD
 */
const getDailyStats = async (req, res) => {
  try {
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    const approvedLeaveIds = await leaveService.getApprovedLeaveEmployeeIdsForDate(dateStr);
    const stats = await attendanceService.getDailyStats(dateStr, approvedLeaveIds);
    const departments = await attendanceService.getDepartments();
    res.json({ stats, departments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export default { checkIn, checkOut, getTodayStatus, getHistory, getWeekly, getDailyAttendance, getDailyStats };