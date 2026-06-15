import Attendance from '../models/Attendance.js';
import User from '../models/User.js';

/**
 * AttendanceService
 * -----------------
 * All business logic for attendance management.
 */

const WORK_START_HOUR = 9;          // 9:00 AM
const LATE_THRESHOLD_MINUTES = 30;  // 9:30 AM = late

const getActiveUsers = async (department = null) => {
  const query = { isActive: true };
  if (department) query.department = department;
  return User.find(query).select('employeeId name department');
};

/**
 * Get or create today's attendance record for an employee.
 * Used when employee checks in.
 */
const checkIn = async (employeeId) => {
  const emp = await User.findOne({ employeeId, isActive: true }).select('name department');
  if (!emp) throw new Error('Employee not found');

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  // Prevent double check-in
  const existing = await Attendance.findOne({ employeeId, date: dateStr });
  if (existing && existing.checkIn) throw new Error('Already checked in today');

  const checkInTime = new Date();

  // Determine status
  const checkInHour = checkInTime.getHours();
  const checkInMin = checkInTime.getMinutes();
  let status = 'present';
  if (
    checkInHour > WORK_START_HOUR ||
    (checkInHour === WORK_START_HOUR && checkInMin > LATE_THRESHOLD_MINUTES)
  ) {
    status = 'late';
  }

  const record = await Attendance.findOneAndUpdate(
    { employeeId, date: dateStr },
    {
      employeeId,
      employeeName: emp.name,
      department: emp.department,
      date: dateStr,
      checkIn: checkInTime,
      status,
    },
    { upsert: true, new: true }
  );

  return record;
};

/**
 * Record check-out for an employee and calculate total hours.
 */
const checkOut = async (employeeId) => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  const record = await Attendance.findOne({ employeeId, date: dateStr });
  if (!record || !record.checkIn) throw new Error('No check-in record found for today');
  if (record.checkOut) throw new Error('Already checked out today');

  const checkOutTime = new Date();
  const diffMs = checkOutTime - new Date(record.checkIn);
  const totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

  record.checkOut = checkOutTime;
  record.totalHours = totalHours;
  await record.save();

  return record;
};

/**
 * Get attendance history for a specific employee with pagination.
 */
const getEmployeeHistory = async (employeeId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const total = await Attendance.countDocuments({ employeeId });
  const records = await Attendance.find({ employeeId })
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);

  return { records, total, page, totalPages: Math.ceil(total / limit) };
};

/**
 * Get weekly attendance for an employee (Mon–Sun of the current week).
 */
const getWeeklyAttendance = async (employeeId) => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const mondayStr = monday.toISOString().split('T')[0];
  const sundayStr = sunday.toISOString().split('T')[0];

  const records = await Attendance.find({
    employeeId,
    date: { $gte: mondayStr, $lte: sundayStr },
  });

  // Build a map: date → hours worked
  const weekMap = {};
  records.forEach((r) => {
    weekMap[r.date] = r.totalHours || 0;
  });

  // Build 7-day array
  const days = [];
  let totalWeekHours = 0;
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const hours = weekMap[dateStr] || 0;
    totalWeekHours += hours;
    days.push({ label: dayLabels[i], date: dateStr, hours });
  }

  return { days, totalWeekHours: parseFloat(totalWeekHours.toFixed(2)) };
};

/**
 * Get today's status for an employee (for the check-in button state).
 */
const getTodayStatus = async (employeeId) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const record = await Attendance.findOne({ employeeId, date: dateStr });
  return record || null;
};

/**
 * Get all attendance records for a specific date (HR dashboard).
 * Merges with dummy employee list to show absent employees too.
 */
const getDailyAttendance = async (dateStr, department = null, status = null, page = 1, limit = 10) => {
  let query = { date: dateStr };
  if (department) query.department = department;

  const checkedInRecords = await Attendance.find(query);

  const allEmployees = await getActiveUsers(department);

  // Merge: employees without records are "absent" (unless on leave – handled via LeaveRequest)
  const mergedMap = {};
  allEmployees.forEach((emp) => {
    mergedMap[emp.employeeId] = {
      employeeId: emp.employeeId,
      employeeName: emp.name,
      department: emp.department,
      checkIn: null,
      checkOut: null,
      totalHours: 0,
      status: 'absent',
    };
  });

  checkedInRecords.forEach((r) => {
    mergedMap[r.employeeId] = {
      employeeId: r.employeeId,
      employeeName: r.employeeName,
      department: r.department,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      totalHours: r.totalHours,
      status: r.status,
    };
  });

  let merged = Object.values(mergedMap);

  // Apply status filter after merge
  if (status) merged = merged.filter((r) => r.status === status);

  const total = merged.length;
  const paginated = merged.slice((page - 1) * limit, page * limit);

  return { records: paginated, total, page, totalPages: Math.ceil(total / limit) };
};

/**
 * Calculate stat counts for HR dashboard for a given date.
 * present   = checked in before 9:30 AM
 * late      = checked in after 9:30 AM
 * absent    = not checked in and not on leave
 * on_leave  = has approved leave for that date
 */
const getDailyStats = async (dateStr, approvedLeaveEmployeeIds = []) => {
  const activeUsers = await User.find({ isActive: true }).select('employeeId');
  const activeEmployeeIds = activeUsers.map((u) => u.employeeId);
  const activeEmployeeSet = new Set(activeEmployeeIds);
  const records = await Attendance.find({ date: dateStr, employeeId: { $in: activeEmployeeIds } });
  const totalEmployees = activeEmployeeIds.length;

  if (totalEmployees === 0) {
    return {
      total: 0,
      present: 0,
      presentPct: '0.0',
      absent: 0,
      absentPct: '0.0',
      onLeave: 0,
      onLeavePct: '0.0',
      late: 0,
      latePct: '0.0',
    };
  }

  const presentCount = records.filter((r) => r.status === 'present').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const onLeaveCount = new Set(approvedLeaveEmployeeIds.filter((id) => activeEmployeeSet.has(id))).size;
  const absentCount = totalEmployees - presentCount - lateCount - onLeaveCount;

  const pct = (n) => ((n / totalEmployees) * 100).toFixed(1);

  return {
    total: totalEmployees,
    present: presentCount,
    presentPct: pct(presentCount),
    absent: Math.max(0, absentCount),
    absentPct: pct(Math.max(0, absentCount)),
    onLeave: onLeaveCount,
    onLeavePct: pct(onLeaveCount),
    late: lateCount,
    latePct: pct(lateCount),
  };
};

const getDepartments = async () => {
  return User.distinct('department', { isActive: true });
};

export default {
  checkIn,
  checkOut,
  getEmployeeHistory,
  getWeeklyAttendance,
  getTodayStatus,
  getDailyAttendance,
  getDailyStats,
  getDepartments,
};