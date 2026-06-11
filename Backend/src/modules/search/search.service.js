import { prisma } from "../../lib/prisma.js";

const PRIVILEGED_ROLES = ["admin", "hr", "manager"];
const MAX_RESULTS_PER_CATEGORY = 5;

/**
 * Sanitize a user record for privileged viewers (admin/hr/manager).
 * Returns the full public profile.
 */
const toFullEmployeeResult = (user) => ({
  id: user.id,
  employeeId: user.employeeId,
  name: user.name,
  email: user.email,
  department: user.department,
  jobTitle: user.jobTitle || "",
  phone: user.phone || "",
  location: user.location || "",
  profileImage: user.profileImage || "",
  status: user.isActive ? "Active" : "Inactive",
});

/**
 * Sanitize a user record for the public company directory (employee role viewing others).
 * Only non-sensitive fields are included.
 */
const toDirectoryEntry = (user) => ({
  id: user.id,
  employeeId: user.employeeId,
  name: user.name,
  department: user.department,
  jobTitle: user.jobTitle || "",
  profileImage: user.profileImage || "",
});

/**
 * Sanitize a leave request record for search results.
 */
const toLeaveResult = (request) => ({
  id: request.id,
  employeeId: request.employeeId,
  employeeName: request.employeeName,
  department: request.department,
  leaveType: request.leaveType,
  status: request.status,
  startDate: request.startDate,
  endDate: request.endDate,
  durationDays: request.durationDays,
});

/**
 * Check whether a string contains the query (case-insensitive).
 */
const matches = (value, query) =>
  String(value || "")
    .toLowerCase()
    .includes(query);

export const searchService = {
  /**
   * Perform a global search across Employees, Leave Requests, and Departments.
   *
   * @param {string} rawQuery — the user's search input
   * @param {object} authUser — the authenticated user from req.authUser
   * @returns {{ employees: object[], leaveRequests: object[], departments: object[] }}
   */
  async search(rawQuery, authUser) {
    const query = String(rawQuery || "").trim().toLowerCase();

    if (!query || query.length < 2) {
      return { employees: [], leaveRequests: [], departments: [] };
    }

    const isPrivileged = PRIVILEGED_ROLES.includes(
      String(authUser.role || "").toLowerCase()
    );

    const [employees, leaveRequests, departments] = await Promise.all([
      this.searchEmployees(query, authUser, isPrivileged),
      this.searchLeaveRequests(query, authUser, isPrivileged),
      this.searchDepartments(query),
    ]);

    return { employees, leaveRequests, departments };
  },

  /**
   * Search employees with RBAC.
   * - Privileged: full search across all users.
   * - Employee: own full record if matching + public directory entries for others.
   */
  async searchEmployees(query, authUser, isPrivileged) {
    const allUsers = await prisma.user.findMany({
      where: { isActive: true },
    });

    if (isPrivileged) {
      // Admin/HR/Manager — unrestricted search, full details
      return allUsers
        .filter(
          (user) =>
            matches(user.name, query) ||
            matches(user.email, query) ||
            matches(user.employeeId, query) ||
            matches(user.department, query) ||
            matches(user.jobTitle, query)
        )
        .slice(0, MAX_RESULTS_PER_CATEGORY)
        .map(toFullEmployeeResult);
    }

    // Standard employee — own record gets full details, others get directory-only
    const matched = allUsers.filter(
      (user) =>
        matches(user.name, query) ||
        matches(user.employeeId, query) ||
        matches(user.department, query) ||
        matches(user.jobTitle, query)
    );

    return matched.slice(0, MAX_RESULTS_PER_CATEGORY).map((user) => {
      if (user.employeeId === authUser.employeeId) {
        return toFullEmployeeResult(user);
      }
      return toDirectoryEntry(user);
    });
  },

  /**
   * Search leave requests with RBAC.
   * - Privileged: search across all requests.
   * - Employee: only their own requests.
   */
  async searchLeaveRequests(query, authUser, isPrivileged) {
    const whereClause = isPrivileged
      ? {}
      : { employeeId: authUser.employeeId };

    const allRequests = await prisma.leaveRequest.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return allRequests
      .filter(
        (request) =>
          matches(request.employeeName, query) ||
          matches(request.department, query) ||
          matches(request.leaveType, query) ||
          matches(request.status, query) ||
          matches(request.employeeId, query)
      )
      .slice(0, MAX_RESULTS_PER_CATEGORY)
      .map(toLeaveResult);
  },

  /**
   * Search departments (derived from distinct department values on the User table).
   * This is public information — no RBAC restriction.
   */
  async searchDepartments(query) {
    const allUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: { department: true },
    });

    // Build a map of department name → employee count
    const deptMap = new Map();
    for (const user of allUsers) {
      const dept = String(user.department || "").trim();
      if (!dept) continue;
      deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
    }

    // Filter departments that match the query
    const results = [];
    for (const [name, employeeCount] of deptMap) {
      if (matches(name, query)) {
        results.push({ name, employeeCount });
      }
      if (results.length >= MAX_RESULTS_PER_CATEGORY) break;
    }

    return results;
  },
};
