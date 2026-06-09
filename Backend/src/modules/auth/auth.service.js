import fs from "fs/promises";
import path from "path";
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
  profileImage: user.profileImage || "",
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

const buildProfileUpdateData = (payload = {}) => {
  const data = {};

  if (payload.name !== undefined) {
    const name = String(payload.name || "").trim();
    if (name) data.name = name;
  }

  if (payload.email !== undefined) {
    const email = normalize(payload.email);
    if (email) data.email = email;
  }

  if (payload.department !== undefined) {
    data.department = String(payload.department || "").trim();
  }

  if (payload.jobTitle !== undefined) {
    data.jobTitle = String(payload.jobTitle || "").trim();
  }

  if (payload.phone !== undefined) {
    data.phone = String(payload.phone || "").trim();
  }

  if (payload.location !== undefined) {
    data.location = String(payload.location || "").trim();
  }

  return data;
};

const deleteProfileImageFile = async (profileImage) => {
  if (!profileImage) return;

  const relativePath = profileImage.replace(/^\/+/, "");

  if (!relativePath.startsWith("uploads/profiles/")) {
    return;
  }

  const absolutePath = path.resolve(process.cwd(), relativePath);
  const allowedDir = path.resolve(process.cwd(), "uploads", "profiles");

  if (!absolutePath.startsWith(allowedDir)) {
    return;
  }

  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Failed to delete profile image:", error.message);
    }
  }
};

export const authService = {
  async login({ identifier, password, role }) {
    const lookup = String(identifier || "").trim();
    const passwordValue = String(password || "");
    const selectedRole = normalize(role);

    if (!lookup || !passwordValue) {
      return {
        error: "Identifier and password are required",
        status: 400,
      };
    }

    const user = await findUserByIdentifier(lookup);

    if (!user || !user.isActive) {
      return {
        error: "Invalid email or password",
        status: 401,
      };
    }

    if (String(user.password || "") !== passwordValue) {
      return {
        error: "Invalid email or password",
        status: 401,
      };
    }

    if (selectedRole && normalize(user.role) !== selectedRole) {
      return {
        error: "Selected role does not match this account",
        status: 401,
      };
    }

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        employeeId: user.employeeId,
      },
      env.jwtSecret,
      {
        expiresIn: env.jwtExpiresIn,
      }
    );

    return {
      token,
      user: sanitizeUser(user),
    };
  },

  async getCurrentUser(userId) {
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || !user.isActive) return null;

    return sanitizeUser(user);
  },

  async updateProfile(userId, payload = {}) {
    if (!userId) return null;

    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!existingUser || !existingUser.isActive) {
      return null;
    }

    const data = buildProfileUpdateData(payload);

    if (data.email && normalize(data.email) !== normalize(existingUser.email)) {
      const emailOwner = await prisma.user.findUnique({
        where: {
          email: data.email,
        },
      });

      if (emailOwner && emailOwner.id !== userId) {
        return {
          error: "Email is already used by another user",
          status: 409,
        };
      }
    }

    if (Object.keys(data).length === 0) {
      return sanitizeUser(existingUser);
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data,
    });

    return sanitizeUser(updatedUser);
  },

  async updateProfileImage(userId, profileImage) {
    if (!userId || !profileImage) return null;

    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!existingUser || !existingUser.isActive) {
      return null;
    }

    const oldProfileImage = existingUser.profileImage || "";

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        profileImage,
      },
    });

    if (oldProfileImage && oldProfileImage !== profileImage) {
      await deleteProfileImageFile(oldProfileImage);
    }

    return sanitizeUser(updatedUser);
  },

  async deleteProfileImage(userId) {
    if (!userId) return null;

    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!existingUser || !existingUser.isActive) {
      return null;
    }

    const oldProfileImage = existingUser.profileImage || "";

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        profileImage: null,
      },
    });

    if (oldProfileImage) {
      await deleteProfileImageFile(oldProfileImage);
    }

    return sanitizeUser(updatedUser);
  },

  verifyToken(token) {
    return jwt.verify(token, env.jwtSecret);
  },
};
