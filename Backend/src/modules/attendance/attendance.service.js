import { prisma } from "../../lib/prisma.js";

const WORK_START_HOUR = 9;
const LATE_THRESHOLD_MINUTES = 30;

const dateOnly = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const paginate = (items, page = 1, limit = 10) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const records = items.slice((safePage - 1) * safeLimit, safePage * safeLimit);
  return { records, total, page: safePage, totalPages };
};

const getApprovedLeaveEmployeeIdsForDate = async (dateStr) => {
  const selectedDate = new Date(`${dateStr}T00:00:00`);
  const requests = await prisma.leaveRequest.findMany({ where: { status: "approved" } });
  return requests
    .filter((request) => {
      const startDate = new Date(request.startDate);
      const endDate = request.endDate ? new Date(request.endDate) : startDate;
      return startDate <= selectedDate && selectedDate <= endDate;
    })
    .map((request) => request.employeeId);
};

const findAttendanceRecord = (employeeId, dateStr) =>
  prisma.attendanceRecord.findFirst({ where: { employeeId, date: dateStr } });

export const attendanceService = {
  async checkIn(employeeId) {
    const employee = await prisma.user.findFirst({ where: { employeeId, isActive: true } });
    if (!employee) throw new Error("Employee not found");

    const today = new Date();
    const dateStr = dateOnly(today);
    const existing = await findAttendanceRecord(employeeId, dateStr);

    if (existing?.checkIn) throw new Error("Already checked in today");

    const status =
      today.getHours() > WORK_START_HOUR ||
      (today.getHours() === WORK_START_HOUR && today.getMinutes() > LATE_THRESHOLD_MINUTES)
        ? "late"
        : "present";

    const nextRecord = {
      id: existing?.id || `att-${employeeId.toLowerCase()}-${dateStr}`,
      employeeId,
      employeeName: employee.name,
      department: employee.department,
      date: dateStr,
      checkIn: today.toISOString(),
      checkOut: null,
      totalHours: 0,
      status,
    };

    if (existing) {
      return prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: {
          employeeName: nextRecord.employeeName,
          department: nextRecord.department,
          checkIn: nextRecord.checkIn,
          checkOut: null,
          totalHours: 0,
          status: nextRecord.status,
        },
      });
    }

    return prisma.attendanceRecord.create({ data: nextRecord });
  },

  async checkOut(employeeId) {
    const dateStr = dateOnly(new Date());
    const record = await findAttendanceRecord(employeeId, dateStr);

    if (!record?.checkIn) throw new Error("No check-in record found for today");
    if (record.checkOut) throw new Error("Already checked out today");

    const checkOut = new Date();
    const totalHours = Number(((checkOut.getTime() - new Date(record.checkIn).getTime()) / 3600000).toFixed(2));

    return prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        checkOut: checkOut.toISOString(),
        totalHours: Math.max(0, totalHours),
      },
    });
  },

  getTodayStatus(employeeId) {
    return findAttendanceRecord(employeeId, dateOnly(new Date()));
  },

  async getEmployeeHistory(employeeId, page = 1, limit = 10) {
    const records = await prisma.attendanceRecord.findMany({
      where: { employeeId },
      orderBy: { date: "desc" },
    });

    return paginate(records, page, limit);
  },

  async getWeeklyAttendance(employeeId) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const days = [];
    let totalWeekHours = 0;
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    for (let index = 0; index < 7; index += 1) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const dateStr = dateOnly(date);
      const record = await findAttendanceRecord(employeeId, dateStr);
      const hours = record?.totalHours || 0;
      totalWeekHours += hours;
      days.push({ label: labels[index], date: dateStr, hours });
    }

    return {
      days,
      totalWeekHours: Number(totalWeekHours.toFixed(2)),
    };
  },

  async getDailyAttendance(dateStr, department = "", status = "", page = 1, limit = 10) {
    const approvedLeaveEmployeeIds = new Set(await getApprovedLeaveEmployeeIdsForDate(dateStr));
    const users = await prisma.user.findMany({ where: { isActive: true } });
    const employees = users.map((user) => ({
      employeeId: user.employeeId,
      name: user.name,
      department: user.department,
      profileImage: user.profileImage || "",
      isActive: user.isActive,
    }));
    const filteredEmployees = department
      ? employees.filter((employee) => employee.department === department)
      : employees;

    let records = [];
    for (const employee of filteredEmployees) {
      const record = await findAttendanceRecord(employee.employeeId, dateStr);
      if (record) {
        records.push({
          ...record,
          employeeName: record.employeeName || employee.name,
          department: record.department || employee.department,
          profileImage: employee.profileImage || "",
        });
      } else {
        records.push({
          employeeId: employee.employeeId,
          employeeName: employee.name,
          department: employee.department,
          profileImage: employee.profileImage || "",
          checkIn: null,
          checkOut: null,
          totalHours: 0,
          status: approvedLeaveEmployeeIds.has(employee.employeeId) ? "on_leave" : "absent",
        });
      }
    }

    if (status) {
      records = records.filter((record) => record.status === status);
    }

    records.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
    return paginate(records, page, limit);
  },

  async getDailyStats(dateStr) {
    const employees = await prisma.user.findMany({ where: { isActive: true } });
    const attendance = await this.getDailyAttendance(dateStr, "", "", 1, employees.length || 1);
    const records = attendance.records;
    const total = records.length;

    const count = (value) => records.filter((record) => record.status === value).length;
    const ratio = (value) => (total === 0 ? "0.0" : ((value / total) * 100).toFixed(1));

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
    const users = await prisma.user.findMany({ where: { isActive: true }, select: { department: true } });
    return [...new Set(users.map((user) => user.department))];
  },
};
