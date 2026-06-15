import User from "../../../models/User.js";

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
  profileImage: user.profileImage || "",
  status: user.isActive ? "Active" : "Inactive",
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const nextEmployeeIdFromUsers = (users) => {
  const maxNum = users.reduce((max, u) => {
    const match = String(u.employeeId || "").match(/EMP[-_]?0*(\d+)/i);
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

    let users = await User.find().lean();

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
        const hay = `${u.name} ${u.email} ${u.employeeId} ${u.jobTitle || ""}`.toLowerCase();
        return hay.includes(search);
      });
    }

    users.sort((a, b) => String(a.employeeId).localeCompare(String(b.employeeId)));

    return {
      users: users.map(sanitizeUser),
      total: users.length,
    };
  },

  async getByEmployeeId(employeeId) {
    const user = await User.findOne({ employeeId }).lean();
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

    const existing = await User.find({}, "employeeId email").lean();

    if (existing.some((u) => normalizeEmail(u.email) === email)) {
      return { error: "Email already exists", status: 409 };
    }

    const employeeId = payload.employeeId || nextEmployeeIdFromUsers(existing);

    if (existing.some((u) => u.employeeId === employeeId)) {
      return { error: "Employee ID already exists", status: 409 };
    }

    const user = await User.create({
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
      profileImage: String(payload.profileImage || "").trim() || null,
      isActive: String(payload.status || "Active").toLowerCase() !== "inactive",
    });

    return { user: sanitizeUser(user.toObject()) };
  },

  async update(employeeId, payload) {
    const user = await User.findOne({ employeeId }).lean();
    if (!user) return { error: "User not found", status: 404 };

    const data = {};

    if (payload.email && normalizeEmail(payload.email) !== normalizeEmail(user.email)) {
      const others = await User.find({}, "employeeId email").lean();
      const taken = others.some(
        (u) => u.employeeId !== employeeId && normalizeEmail(u.email) === normalizeEmail(payload.email)
      );
      if (taken) return { error: "Email already exists", status: 409 };
      data.email = normalizeEmail(payload.email);
    }

    if (payload.name !== undefined) data.name = String(payload.name).trim();
    if (payload.role !== undefined) data.role = String(payload.role).trim();
    if (payload.department !== undefined) data.department = String(payload.department).trim();
    if (payload.jobTitle !== undefined) data.jobTitle = String(payload.jobTitle || "").trim();
    if (payload.phone !== undefined) data.phone = String(payload.phone || "").trim();
    if (payload.location !== undefined) data.location = String(payload.location || "").trim();
    if (payload.profileImage !== undefined) data.profileImage = String(payload.profileImage || "").trim() || null;
    if (payload.status !== undefined) data.isActive = String(payload.status).toLowerCase() !== "inactive";
    if (payload.password) data.password = String(payload.password);

    const updated = await User.findOneAndUpdate({ employeeId }, data, { new: true }).lean();
    return { user: sanitizeUser(updated) };
  },

  async remove(employeeId) {
    const result = await User.findOneAndDelete({ employeeId });
    if (!result) return { error: "User not found", status: 404 };
    return { success: true };
  },
};
