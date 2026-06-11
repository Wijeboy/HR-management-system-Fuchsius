import User from "../../../models/User.js";
import Attendance from "../../../models/Attendance.js";
import LeaveRequest from "../../../models/LeaveRequest.js";

const WORK_START_HOUR = 9;
const LATE_THRESHOLD_MINUTES = 30;

const dateOnly = (value = new Date()) => {
  const d = value instanceof Date ? value : new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const paginate = (items, page = 1, limit = 10) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const records = items.slice((safePage - 1) * safeLimit, safePage * safeLimit);
  return { records, total, page: safePage, totalPages };
};

const getApprovedLeaveIdsForDate = async (dateStr) => {
  const selected = new Date(`${dateStr}T00:00:00`);
  const requests = await LeaveRequest.find({ status: "approved" }).lean();
  return requests
    .filter((r) => {
      const start = new Date(r.startDate);
      const end = r.endDate ? new Date(r.endDate) : start;
      return start <= selected && selected <= end;
    })
    .map((r) => r.employeeId);
};

const findRecord = (employeeId, dateStr) =>
  Attendance.findOne({ employeeId, date: dateStr }).lean();

export const attendanceService = {
  async checkIn(employeeId) {
    const employee = await User.findOne({ employeeId, isActive: true }).lean();
    if (!employee) throw new Error("Employee not found");

    const today = new Date();
    const dateStr = dateOnly(today);
    const existing = await findRecord(employeeId, dateStr);

    if (existing?.checkIn) throw new Error("Already checked in today");

    const status =
      today.getHours() > WORK_START_HOUR ||
      (today.getHours() === WORK_START_HOUR && today.getMinutes() > LATE_THRESHOLD_MINUTES)
        ? "late"
        : "present";

    if (existing) {
      return Attendance.findByIdAndUpdate(
        existing._id,
        {
          employeeName: employee.name,
          department: employee.department,
          checkIn: today,
          checkOut: null,
          totalHours: 0,
          status,
        },
        { new: true }
      ).lean();
    }

    const created = await Attendance.create({
      employeeId,
      employeeName: employee.name,
      department: employee.department,
      date: dateStr,
      checkIn: today,
      checkOut: null,
      totalHours: 0,
      status,
    });
    return created.toObject();
  },

  async checkOut(employeeId) {
    const dateStr = dateOnly(new Date());
    const record = await findRecord(employeeId, dateStr);

    if (!record?.checkIn) throw new Error("No check-in record found for today");
    if (record.checkOut) throw new Error("Already checked out today");

    const checkOut = new Date();
    const totalHours = Number(((checkOut.getTime() - new Date(record.checkIn).getTime()) / 3600000).toFixed(2));

    return Attendance.findByIdAndUpdate(
      record._id,
      { checkOut, totalHours: Math.max(0, totalHours) },
      { new: true }
    ).lean();
  },

  getTodayStatus(employeeId) {
    return findRecord(employeeId, dateOnly(new Date()));
  },

  async getEmployeeHistory(employeeId, page = 1, limit = 10) {
    const records = await Attendance.find({ employeeId }).sort({ date: -1 }).lean();
    return paginate(records, page, limit);
  },

  async getWeeklyAttendance(employeeId) {
    const today = new Date();
    const dow = today.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const days = [];
    let totalWeekHours = 0;
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const ds = dateOnly(d);
      const rec = await findRecord(employeeId, ds);
      const hrs = rec?.totalHours || 0;
      totalWeekHours += hrs;
      days.push({ label: labels[i], date: ds, hours: hrs });
    }

    return { days, totalWeekHours: Number(totalWeekHours.toFixed(2)) };
  },

  async getDailyAttendance(dateStr, department = "", status = "", page = 1, limit = 10) {
    const leaveIds = new Set(await getApprovedLeaveIdsForDate(dateStr));
    const users = await User.find({ isActive: true }).lean();
    const employees = users.map((u) => ({
      employeeId: u.employeeId,
      name: u.name,
      department: u.department,
      profileImage: u.profileImage || "",
      isActive: u.isActive,
    }));

    const filtered = department ? employees.filter((e) => e.department === department) : employees;

    let records = [];
    for (const emp of filtered) {
      const rec = await findRecord(emp.employeeId, dateStr);
      if (rec) {
        records.push({
          ...rec,
          employeeName: rec.employeeName || emp.name,
          department: rec.department || emp.department,
          profileImage: emp.profileImage || "",
        });
      } else {
        records.push({
          employeeId: emp.employeeId,
          employeeName: emp.name,
          department: emp.department,
          profileImage: emp.profileImage || "",
          checkIn: null,
          checkOut: null,
          totalHours: 0,
          status: leaveIds.has(emp.employeeId) ? "on_leave" : "absent",
        });
      }
    }

    if (status) {
      records = records.filter((r) => r.status === status);
    }

    records.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
    return paginate(records, page, limit);
  },

  async getDailyStats(dateStr) {
    const employees = await User.find({ isActive: true }).lean();
    const attendance = await this.getDailyAttendance(dateStr, "", "", 1, employees.length || 1);
    const recs = attendance.records;
    const total = recs.length;

    const count = (val) => recs.filter((r) => r.status === val).length;
    const ratio = (val) => (total === 0 ? "0.0" : ((val / total) * 100).toFixed(1));

    const present = count("present");
    const late = count("late");
    const absent = count("absent");
    const onLeave = count("on_leave");

    return {
      total,
      present,
      presentPct: ratio(present),
      absent,
      absentPct: ratio(absent),
      onLeave,
      onLeavePct: ratio(onLeave),
      late,
      latePct: ratio(late),
    };
  },

  async getDepartments() {
    const users = await User.find({ isActive: true }, "department").lean();
    return [...new Set(users.map((u) => u.department))];
  },
};
