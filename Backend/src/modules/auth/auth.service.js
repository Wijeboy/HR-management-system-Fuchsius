import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
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

const normalize = (value) => String(value || "").trim().toLowerCase();

const findUserByIdentifier = async (identifier) => {
  const lookup = normalize(identifier);
  if (!lookup) return null;

  const users = await prisma.user.findMany();

  return (
    users.find((user) => normalize(user.email) === lookup) ||
    users.find((user) => normalize(user.employeeId) === lookup) ||
    users.find((user) => normalize(user.name) === lookup) ||
    null
  );
};

export const authService = {
  async login({ identifier, password, role }) {
    const lookup = String(identifier || "").trim();
    const passwordValue = String(password || "");
    const selectedRole = normalize(role);

    if (!lookup || !passwordValue) {
      return { error: "Identifier and password are required", status: 400 };
    }

    const user = await findUserByIdentifier(lookup);
    if (!user || !user.isActive) {
      return { error: "Invalid email or password", status: 401 };
    }

    const isPasswordValid = passwordValue === String(user.password) || await bcrypt.compare(passwordValue, String(user.password || ""));
    if (!isPasswordValid) {
      return { error: "Invalid email or password", status: 401 };
    }

    if (selectedRole && normalize(user.role) !== selectedRole) {
      return { error: "Selected role does not match this account", status: 401 };
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role, employeeId: user.employeeId },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    return {
      token,
      user: sanitizeUser(user),
    };
  },

  async getCurrentUser(userId) {
    if (!userId) return null;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) return null;
    return sanitizeUser(user);
  },

  verifyToken(token) {
    return jwt.verify(token, env.jwtSecret);
  },
};
