import User from "../../../models/User.js";
import LeaveRequest from "../../../models/LeaveRequest.js";

const PRIVILEGED_ROLES = ["admin", "hr", "manager"];
const MAX_PER_CATEGORY = 5;

const toFullResult = (u) => ({
  id: u.id,
  employeeId: u.employeeId,
  name: u.name,
  email: u.email,
  department: u.department,
  jobTitle: u.jobTitle || "",
  phone: u.phone || "",
  location: u.location || "",
  profileImage: u.profileImage || "",
  status: u.isActive ? "Active" : "Inactive",
});

const toDirectoryEntry = (u) => ({
  id: u.id,
  employeeId: u.employeeId,
  name: u.name,
  department: u.department,
  jobTitle: u.jobTitle || "",
  profileImage: u.profileImage || "",
});

const toLeaveResult = (r) => ({
  id: String(r._id),
  employeeId: r.employeeId,
  employeeName: r.employeeName,
  department: r.department,
  leaveType: r.leaveType,
  status: r.status,
  startDate: r.startDate,
  endDate: r.endDate,
  durationDays: r.durationDays,
});

const hit = (val, q) => String(val || "").toLowerCase().includes(q);

export const searchService = {
  async search(rawQuery, authUser) {
    const q = String(rawQuery || "").trim().toLowerCase();
    if (!q || q.length < 2) {
      return { employees: [], leaveRequests: [], departments: [] };
    }

    const priv = PRIVILEGED_ROLES.includes(String(authUser.role || "").toLowerCase());

    const [employees, leaveRequests, departments] = await Promise.all([
      this.searchEmployees(q, authUser, priv),
      this.searchLeaveRequests(q, authUser, priv),
      this.searchDepartments(q),
    ]);

    return { employees, leaveRequests, departments };
  },

  async searchEmployees(q, authUser, priv) {
    const users = await User.find({ isActive: true }).lean();

    if (priv) {
      return users
        .filter((u) => hit(u.name, q) || hit(u.email, q) || hit(u.employeeId, q) || hit(u.department, q) || hit(u.jobTitle, q))
        .slice(0, MAX_PER_CATEGORY)
        .map(toFullResult);
    }

    const matched = users.filter(
      (u) => hit(u.name, q) || hit(u.employeeId, q) || hit(u.department, q) || hit(u.jobTitle, q)
    );

    return matched.slice(0, MAX_PER_CATEGORY).map((u) => {
      if (u.employeeId === authUser.employeeId) return toFullResult(u);
      return toDirectoryEntry(u);
    });
  },

  async searchLeaveRequests(q, authUser, priv) {
    const filter = priv ? {} : { employeeId: authUser.employeeId };
    const requests = await LeaveRequest.find(filter).sort({ createdAt: -1 }).lean();

    return requests
      .filter((r) => hit(r.employeeName, q) || hit(r.department, q) || hit(r.leaveType, q) || hit(r.status, q) || hit(r.employeeId, q))
      .slice(0, MAX_PER_CATEGORY)
      .map(toLeaveResult);
  },

  async searchDepartments(q) {
    const users = await User.find({ isActive: true }, "department").lean();
    const deptMap = new Map();

    for (const u of users) {
      const dept = String(u.department || "").trim();
      if (!dept) continue;
      deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
    }

    const results = [];
    for (const [name, employeeCount] of deptMap) {
      if (hit(name, q)) results.push({ name, employeeCount });
      if (results.length >= MAX_PER_CATEGORY) break;
    }

    return results;
  },
};
