import bcrypt from "bcryptjs";
import User from "../../../models/User.js";

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
  const maxNum = users.reduce((max, u) => {
    const match = String(u.employeeId || "").match(/DEMO(\d+)/i);
    const num = match ? Number(match[1]) : 0;
    return Math.max(max, num);
  }, 0);

  return `DEMO${String(maxNum + 1).padStart(3, "0")}`;
};

export const ensureSystemUsers = async () => {
  const existingUsers = await User.find({}, "id email employeeId name role department isActive").lean();

  for (const seed of defaultUsers) {
    const byEmail = existingUsers.find((u) => normalizeEmail(u.email) === normalizeEmail(seed.email));
    const hashed = await bcrypt.hash(seed.password, 10);

    if (byEmail) {
      await User.findOneAndUpdate(
        { id: byEmail.id },
        { password: hashed, role: seed.role, name: seed.name, department: seed.department, isActive: true }
      );
      continue;
    }

    const idTaken = existingUsers.some((u) => u.employeeId === seed.employeeId);
    const empId = idTaken ? nextEmployeeId(existingUsers) : seed.employeeId;

    const created = await User.create({
      id: `user_${seed.role}_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      employeeId: empId,
      name: seed.name,
      email: seed.email,
      password: hashed,
      role: seed.role,
      department: seed.department,
      jobTitle: "",
      phone: "",
      location: "",
      isActive: true,
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
