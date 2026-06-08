import { prisma } from "../../lib/prisma.js";

const seedEmployees = [
  {
    id: "EMP-0034",
    name: "Sarah Williams",
    department: "Sales & Marketing",
    baseSalary: 8500,
    fixedAllowance: 1500,
    paymentMethod: "Direct Deposit",
    bankName: "First National Bank",
    accountNo: "**** 4567",
  },
  {
    id: "EMP-0012",
    name: "John Davis",
    department: "Engineering",
    baseSalary: 7800,
    fixedAllowance: 1200,
    paymentMethod: "Direct Deposit",
    bankName: "City Bank",
    accountNo: "**** 1220",
  },
  {
    id: "EMP-0028",
    name: "Emily Chen",
    department: "Finance",
    baseSalary: 7300,
    fixedAllowance: 950,
    paymentMethod: "Bank Transfer",
    bankName: "Union Trust",
    accountNo: "**** 7751",
  },
];

const seedRecords = [
  {
    id: "PR-202603-0001",
    employeeId: "EMP-0034",
    employeeName: "Sarah Williams",
    department: "Sales & Marketing",
    period: "March 2026",
    attendanceDays: 22,
    leaveDays: 0,
    gross: 12500,
    deductions: 3200,
    net: 9300,
    status: "Processed",
    paymentDate: "2026-03-31",
  },
  {
    id: "PR-202603-0002",
    employeeId: "EMP-0012",
    employeeName: "John Davis",
    department: "Engineering",
    period: "March 2026",
    attendanceDays: 21,
    leaveDays: 1,
    gross: 10600,
    deductions: 2595,
    net: 8005,
    status: "Processed",
    paymentDate: "2026-03-31",
  },
  {
    id: "PR-202602-0001",
    employeeId: "EMP-0028",
    employeeName: "Emily Chen",
    department: "Finance",
    period: "February 2026",
    attendanceDays: 20,
    leaveDays: 2,
    gross: 9800,
    deductions: 2620,
    net: 7180,
    status: "Pending",
    paymentDate: "2026-02-28",
  },
];

const seedPayslips = [
  {
    id: "PR-202603-0001",
    payrollId: "PR-202603-0001",
    employeeId: "EMP-0034",
    employeeName: "Sarah Williams",
    department: "Sales & Marketing",
    period: "2026-03",
    periodLabel: "March 2026",
    paymentDate: "2026-03-31",
    paymentMethod: "Direct Deposit",
    bankName: "First National Bank",
    accountNo: "**** 4567",
    earnings: [
      { label: "Basic Salary", amount: 8500 },
      { label: "Housing Allowance", amount: 1500 },
      { label: "Performance Bonus", amount: 2000 },
      { label: "Other Allowance", amount: 500 },
    ],
    deductions: [
      { label: "Federal Tax", amount: 1500 },
      { label: "Social Security", amount: 620 },
      { label: "Health Insurance", amount: 235 },
      { label: "Statutory Contribution", amount: 845 },
    ],
    gross: 12500,
    totalDeductions: 3200,
    net: 9300,
    attendanceDays: 22,
    leaveDays: 0,
  },
  {
    id: "PR-202603-0002",
    payrollId: "PR-202603-0002",
    employeeId: "EMP-0012",
    employeeName: "John Davis",
    department: "Engineering",
    period: "2026-03",
    periodLabel: "March 2026",
    paymentDate: "2026-03-31",
    paymentMethod: "Direct Deposit",
    bankName: "City Bank",
    accountNo: "**** 1220",
    earnings: [
      { label: "Basic Salary", amount: 7800 },
      { label: "Technical Allowance", amount: 1200 },
      { label: "Overtime", amount: 900 },
      { label: "Project Bonus", amount: 700 },
    ],
    deductions: [
      { label: "Federal Tax", amount: 1272 },
      { label: "Social Security", amount: 560 },
      { label: "Health Insurance", amount: 230 },
      { label: "Statutory Contribution", amount: 533 },
    ],
    gross: 10600,
    totalDeductions: 2595,
    net: 8005,
    attendanceDays: 21,
    leaveDays: 1,
  },
  {
    id: "PR-202602-0001",
    payrollId: "PR-202602-0001",
    employeeId: "EMP-0028",
    employeeName: "Emily Chen",
    department: "Finance",
    period: "2026-02",
    periodLabel: "February 2026",
    paymentDate: "2026-02-28",
    paymentMethod: "Bank Transfer",
    bankName: "Union Trust",
    accountNo: "**** 7751",
    earnings: [
      { label: "Basic Salary", amount: 7300 },
      { label: "Fixed Allowance", amount: 950 },
      { label: "Overtime", amount: 650 },
      { label: "Other Allowance", amount: 900 },
    ],
    deductions: [
      { label: "Federal Tax", amount: 1170 },
      { label: "Social Security", amount: 510 },
      { label: "Health Insurance", amount: 220 },
      { label: "Statutory Contribution", amount: 720 },
    ],
    gross: 9800,
    totalDeductions: 2620,
    net: 7180,
    attendanceDays: 20,
    leaveDays: 2,
  },
];

export const ensurePayrollSeed = async () => {
  const existingEmployees = await prisma.payrollEmployee.count();
  if (existingEmployees > 0) {
    return;
  }

  await prisma.payrollEmployee.createMany({ data: seedEmployees });
  await prisma.payrollRecord.createMany({ data: seedRecords });
  await prisma.payslip.createMany({ data: seedPayslips });
};
