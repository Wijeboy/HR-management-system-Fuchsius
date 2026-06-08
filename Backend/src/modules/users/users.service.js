import { prisma } from "../../lib/prisma.js";

const sanitizeUser = (user) => ({
  id: user.id,
  employeeId: user.employeeId,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  jobTitle: user.jobTitle || "",
  phone: user.phone || "",
  location: user.location || "",
  status: user.isActive ? "Active" : "Inactive",
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const nextEmployeeIdFromUsers = (users) => {
  const maxNum = users.reduce((max, user) => {
    const match = String(user.employeeId || "").match(/EMP[-_]?0*(\d+)/i);
    const num = match ? Number(match[1]) : 0;
    return Math.max(max, num);
  }, 0);

  return `EMP${String(maxNum + 1).padStart(3, "0")}`;
};

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

export const usersService = {
  async list(query = {}) {
    const search = String(query.search || "").toLowerCase();
    const department = String(query.department || "").trim();
    const role = String(query.role || "").trim();
    const status = String(query.status || "").trim().toLowerCase();

    let users = await prisma.user.findMany();

    if (department) {
      users = users.filter((u) => u.department === department);
    }

    if (role) {
      users = users.filter((u) => u.role === role);
    }

    if (status === "active") {
      users = users.filter((u) => u.isActive);
    } else if (status === "inactive") {
      users = users.filter((u) => !u.isActive);
    }

    if (search) {
      users = users.filter((u) => {
        const haystack = `${u.name} ${u.email} ${u.employeeId} ${u.jobTitle || ""}`.toLowerCase();
        return haystack.includes(search);
      });
    }

    users.sort((a, b) => String(a.employeeId).localeCompare(String(b.employeeId)));

    return {
      users: users.map(sanitizeUser),
      total: users.length,
    };
  },

  async getByEmployeeId(employeeId) {
    const user = await prisma.user.findUnique({ where: { employeeId } });
    return user ? sanitizeUser(user) : null;
  },

  async create(payload) {
    const name = String(payload.name || "").trim();
    const email = normalizeEmail(payload.email);
    const password = String(payload.password || "");
    const role = String(payload.role || "").trim();
    const department = String(payload.department || "").trim();

    if (!name || !email || !password || !role || !department) {
      return { error: "name, email, password, role, and department are required", status: 400 };
    }

    const existingUsers = await prisma.user.findMany({
      select: { employeeId: true, email: true },
    });

    if (existingUsers.some((u) => normalizeEmail(u.email) === email)) {
      return { error: "Email already exists", status: 409 };
    }

    const employeeId = payload.employeeId || nextEmployeeIdFromUsers(existingUsers);
    if (existingUsers.some((u) => u.employeeId === employeeId)) {
      return { error: "Employee ID already exists", status: 409 };
    }

    const now = new Date().toISOString();
    const userData = {
      id: `user_${role}_${Date.now()}`,
      employeeId,
      name,
      email,
      password,
      role,
      department,
      jobTitle: String(payload.jobTitle || "").trim(),
      phone: String(payload.phone || "").trim(),
      location: String(payload.location || "").trim(),
      isActive: String(payload.status || "Active").toLowerCase() !== "inactive",
      createdAt: now,
      updatedAt: now,
    };

    const user = await prisma.user.create({ data: userData });

    return { user: sanitizeUser(user) };
  },

  async update(employeeId, payload) {
    const user = await prisma.user.findUnique({ where: { employeeId } });

    if (!user) return { error: "User not found", status: 404 };

    if (payload.email && normalizeEmail(payload.email) !== normalizeEmail(user.email)) {
      const existingUsers = await prisma.user.findMany({ select: { employeeId: true, email: true } });

      const emailExists = existingUsers.some(
        (u) => u.employeeId !== employeeId && normalizeEmail(u.email) === normalizeEmail(payload.email)
      );
      if (emailExists) return { error: "Email already exists", status: 409 };
      user.email = normalizeEmail(payload.email);
    }

    if (payload.name !== undefined) user.name = String(payload.name).trim();
    if (payload.role !== undefined) user.role = String(payload.role).trim();
    if (payload.department !== undefined) user.department = String(payload.department).trim();
    if (payload.jobTitle !== undefined) user.jobTitle = String(payload.jobTitle || "").trim();
    if (payload.phone !== undefined) user.phone = String(payload.phone || "").trim();
    if (payload.location !== undefined) user.location = String(payload.location || "").trim();
    if (payload.status !== undefined) user.isActive = String(payload.status).toLowerCase() !== "inactive";
    if (payload.password) user.password = String(payload.password);
    const updated = await prisma.user.update({
      where: { employeeId },
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
        department: user.department,
        jobTitle: user.jobTitle,
        phone: user.phone,
        location: user.location,
        isActive: user.isActive,
      },
    });

    return { user: sanitizeUser(updated) };
  },

  async remove(employeeId) {
    try {
      await prisma.user.delete({ where: { employeeId } });
    } catch {
      return { error: "User not found", status: 404 };
    }

    return { success: true };
  },
};
