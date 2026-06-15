import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const payrollEmployees = [
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
  {
    id: "EMP-0041",
    name: "Michael Johnson",
    department: "HR",
    baseSalary: 6800,
    fixedAllowance: 950,
    paymentMethod: "Bank Transfer",
    bankName: "Union Trust",
    accountNo: "**** 9921",
  },
  {
    id: "EMP-0050",
    name: "Robert Taylor",
    department: "Operations",
    baseSalary: 6200,
    fixedAllowance: 700,
    paymentMethod: "Direct Deposit",
    bankName: "Continental Bank",
    accountNo: "**** 2841",
  },
];

const payrollRecords = [
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
    id: "PR-202603-0003",
    employeeId: "EMP-0028",
    employeeName: "Emily Chen",
    department: "Finance",
    period: "March 2026",
    attendanceDays: 20,
    leaveDays: 2,
    gross: 9800,
    deductions: 2620,
    net: 7180,
    status: "Pending",
    paymentDate: "2026-03-31",
  },
  {
    id: "PR-202602-0001",
    employeeId: "EMP-0041",
    employeeName: "Michael Johnson",
    department: "HR",
    period: "February 2026",
    attendanceDays: 20,
    leaveDays: 1,
    gross: 8700,
    deductions: 2060,
    net: 6640,
    status: "Processed",
    paymentDate: "2026-02-28",
  },
  {
    id: "PR-202602-0002",
    employeeId: "EMP-0050",
    employeeName: "Robert Taylor",
    department: "Operations",
    period: "February 2026",
    attendanceDays: 18,
    leaveDays: 2,
    gross: 7600,
    deductions: 2300,
    net: 5300,
    status: "On Hold",
    paymentDate: "2026-02-28",
  },
];

const payslips = [
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
    id: "PR-202603-0003",
    payrollId: "PR-202603-0003",
    employeeId: "EMP-0028",
    employeeName: "Emily Chen",
    department: "Finance",
    period: "2026-03",
    periodLabel: "March 2026",
    paymentDate: "2026-03-31",
    paymentMethod: "Bank Transfer",
    bankName: "Union Trust",
    accountNo: "**** 7751",
    earnings: [
      { label: "Basic Salary", amount: 7300 },
      { label: "Finance Allowance", amount: 950 },
      { label: "Overtime", amount: 420 },
      { label: "Accuracy Bonus", amount: 1130 },
    ],
    deductions: [
      { label: "Federal Tax", amount: 1176 },
      { label: "Social Security", amount: 520 },
      { label: "Health Insurance", amount: 224 },
      { label: "Statutory Contribution", amount: 700 },
    ],
    gross: 9800,
    totalDeductions: 2620,
    net: 7180,
    attendanceDays: 20,
    leaveDays: 2,
  },
  {
    id: "PR-202602-0001",
    payrollId: "PR-202602-0001",
    employeeId: "EMP-0041",
    employeeName: "Michael Johnson",
    department: "HR",
    period: "2026-02",
    periodLabel: "February 2026",
    paymentDate: "2026-02-28",
    paymentMethod: "Bank Transfer",
    bankName: "Union Trust",
    accountNo: "**** 9921",
    earnings: [
      { label: "Basic Salary", amount: 6800 },
      { label: "HR Allowance", amount: 950 },
      { label: "KPI Bonus", amount: 550 },
      { label: "Other Allowance", amount: 400 },
    ],
    deductions: [
      { label: "Federal Tax", amount: 1040 },
      { label: "Social Security", amount: 475 },
      { label: "Health Insurance", amount: 220 },
      { label: "Statutory Contribution", amount: 465 },
    ],
    gross: 8700,
    totalDeductions: 2060,
    net: 6640,
    attendanceDays: 20,
    leaveDays: 1,
  },
  {
    id: "PR-202602-0002",
    payrollId: "PR-202602-0002",
    employeeId: "EMP-0050",
    employeeName: "Robert Taylor",
    department: "Operations",
    period: "2026-02",
    periodLabel: "February 2026",
    paymentDate: "2026-02-28",
    paymentMethod: "Direct Deposit",
    bankName: "Continental Bank",
    accountNo: "**** 2841",
    earnings: [
      { label: "Basic Salary", amount: 6200 },
      { label: "Operations Allowance", amount: 700 },
      { label: "Overtime", amount: 250 },
      { label: "Special Bonus", amount: 450 },
    ],
    deductions: [
      { label: "Federal Tax", amount: 912 },
      { label: "Social Security", amount: 430 },
      { label: "Health Insurance", amount: 215 },
      { label: "Statutory Contribution", amount: 743 },
    ],
    gross: 7600,
    totalDeductions: 2300,
    net: 5300,
    attendanceDays: 18,
    leaveDays: 2,
  },
];

const performanceReviews = [
  {
    id: "PRV-2026-Q1-001",
    employeeName: "Sarah Williams",
    employeeId: "EMP-0034",
    department: "Sales & Marketing",
    reviewer: "Diana Carter",
    cycle: "Q1 2026",
    goalsScore: 4.6,
    competencyScore: 4.4,
    behaviorScore: 4.8,
    finalRating: 4.6,
    recommendation: "Promotion",
    status: "Completed",
  },
  {
    id: "PRV-2026-Q1-002",
    employeeName: "John Davis",
    employeeId: "EMP-0012",
    department: "Engineering",
    reviewer: "Rahul Perera",
    cycle: "Q1 2026",
    goalsScore: 4.1,
    competencyScore: 4.3,
    behaviorScore: 4.0,
    finalRating: 4.1,
    recommendation: "Bonus",
    status: "Completed",
  },
  {
    id: "PRV-2026-Q1-003",
    employeeName: "Emily Chen",
    employeeId: "EMP-0028",
    department: "Finance",
    reviewer: "Kevin Fernando",
    cycle: "Q1 2026",
    goalsScore: 3.4,
    competencyScore: 3.7,
    behaviorScore: 3.6,
    finalRating: 3.6,
    recommendation: "No Change",
    status: "Completed",
  },
  {
    id: "PRV-2026-Q2-001",
    employeeName: "Michael Johnson",
    employeeId: "EMP-0041",
    department: "HR",
    reviewer: "Nadeeka Silva",
    cycle: "Q2 2026",
    goalsScore: 0,
    competencyScore: 0,
    behaviorScore: 0,
    finalRating: 0,
    recommendation: "Pending",
    status: "In Progress",
  },
];

const performanceGoals = [
  {
    id: "KPI-001",
    employeeName: "Sarah Williams",
    employeeId: "EMP-0034",
    goal: "Increase enterprise client renewals",
    metric: "Renewal Rate %",
    target: 92,
    current: 95,
    weight: 35,
    dueDate: "2026-03-31",
    lowerIsBetter: false,
  },
  {
    id: "KPI-002",
    employeeName: "John Davis",
    employeeId: "EMP-0012",
    goal: "Reduce production incident recovery time",
    metric: "Average MTTR (hours)",
    target: 3,
    current: 3.6,
    weight: 30,
    dueDate: "2026-03-31",
    lowerIsBetter: true,
  },
  {
    id: "KPI-003",
    employeeName: "Emily Chen",
    employeeId: "EMP-0028",
    goal: "Close monthly books faster",
    metric: "Days to close",
    target: 4,
    current: 4,
    weight: 20,
    dueDate: "2026-03-31",
    lowerIsBetter: true,
  },
  {
    id: "KPI-004",
    employeeName: "Michael Johnson",
    employeeId: "EMP-0041",
    goal: "Improve employee onboarding completion",
    metric: "Completion Rate %",
    target: 96,
    current: 88,
    weight: 15,
    dueDate: "2026-03-31",
    lowerIsBetter: false,
  },
];

const seed = async () => {
  await prisma.payslip.deleteMany();
  await prisma.payrollRecord.deleteMany();
  await prisma.performanceReview.deleteMany();
  await prisma.performanceGoal.deleteMany();
  await prisma.payrollEmployee.deleteMany();

  for (const employee of payrollEmployees) {
    await prisma.payrollEmployee.create({ data: employee });
  }

  for (const record of payrollRecords) {
    await prisma.payrollRecord.create({ data: record });
  }

  for (const payslip of payslips) {
    await prisma.payslip.create({ data: payslip });
  }

  for (const review of performanceReviews) {
    await prisma.performanceReview.create({ data: review });
  }

  for (const goal of performanceGoals) {
    await prisma.performanceGoal.create({ data: goal });
  }
};

seed()
  .then(async () => {
    // eslint-disable-next-line no-console
    console.log("Seed complete. Test data inserted.");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error("Seed failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
