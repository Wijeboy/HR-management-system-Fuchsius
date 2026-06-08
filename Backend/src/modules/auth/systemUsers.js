import { prisma } from "../../lib/prisma.js";

const defaultUsers = [
  {
    email: "admin@company.com",
    password: "admin",
    role: "admin",
    name: "Admin User",
    department: "IT",
    employeeId: "DEMO001",
  },
  {
    email: "hr@company.com",
    password: "hr",
    role: "hr",
    name: "HR Manager",
    department: "Human Resources",
    employeeId: "DEMO002",
  },
  {
    email: "manager@company.com",
    password: "manager",
    role: "manager",
    name: "Department Manager",
    department: "Engineering",
    employeeId: "DEMO003",
  },
  {
    email: "employee@company.com",
    password: "employee",
    role: "employee",
    name: "Employee User",
    department: "Sales",
    employeeId: "DEMO004",
  },
];

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const nextEmployeeId = (users) => {
  const maxNum = users.reduce((max, user) => {
    const match = String(user.employeeId || "").match(/DEMO(\d+)/i);
    const num = match ? Number(match[1]) : 0;
    return Math.max(max, num);
  }, 0);

  return `DEMO${String(maxNum + 1).padStart(3, "0")}`;
};

export const ensureSystemUsers = async () => {
  const existingUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      employeeId: true,
      name: true,
      role: true,
      department: true,
      isActive: true,
    },
  });

  for (const seedUser of defaultUsers) {
    const byEmail = existingUsers.find((user) => normalizeEmail(user.email) === normalizeEmail(seedUser.email));

    if (byEmail) {
      await prisma.user.update({
        where: { id: byEmail.id },
        data: {
          password: seedUser.password,
          role: seedUser.role,
          name: seedUser.name,
          department: seedUser.department,
          isActive: true,
        },
      });
      continue;
    }

    const preferredEmployeeIdInUse = existingUsers.some((user) => user.employeeId === seedUser.employeeId);
    const employeeId = preferredEmployeeIdInUse ? nextEmployeeId(existingUsers) : seedUser.employeeId;

    const created = await prisma.user.create({
      data: {
        id: `user_${seedUser.role}_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
        employeeId,
        name: seedUser.name,
        email: seedUser.email,
        password: seedUser.password,
        role: seedUser.role,
        department: seedUser.department,
        jobTitle: "",
        phone: "",
        location: "",
        isActive: true,
      },
    });

    existingUsers.push({
      id: created.id,
      email: created.email,
      employeeId: created.employeeId,
      name: created.name,
      role: created.role,
      department: created.department,
      isActive: created.isActive,
    });
  }
};
