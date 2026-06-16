import PayrollEmployee from "../../models/PayrollEmployee.js";
import PayrollRecord from "../../models/PayrollRecord.js";
import Payslip from "../../models/Payslip.js";
import PerformanceReview from "../../models/PerformanceReview.js";
import User from "../../../models/User.js";
import { monthLabelFromPeriod, paydayFromPeriod, periodFromLabel } from "../../utils/date.js";
import { toNumber } from "../../utils/number.js";

const withId = (doc) => (doc ? { ...doc, id: doc._id } : doc);

const computeSummary = (records) =>
  records.reduce(
    (acc, r) => {
      acc.totalGross += r.gross;
      acc.totalDeductions += r.deductions;
      acc.totalNet += r.net;
      if (r.status === "Pending") acc.pending += 1;
      return acc;
    },
    { totalGross: 0, totalDeductions: 0, totalNet: 0, pending: 0 }
  );

const toWholeNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  return Math.max(0, Math.round(toNumber(value)));
};

const nextPayrollId = async (period) => {
  const token = String(period || "").replace("-", "");
  const count = await PayrollRecord.countDocuments({
    _id: { $regex: `^PR-${token}-` },
  });
  return `PR-${token}-${String(count + 1).padStart(4, "0")}`;
};

const makePayrollCalculation = (payload, employee) => {
  const payPeriod = payload.payPeriod || new Date().toISOString().slice(0, 7);
  const workingDays = 22;
  const dayRate = employee.baseSalary / workingDays;

  const attendanceDays = toWholeNumber(payload.attendanceDays, 22);
  const unpaidLeaveDays = toWholeNumber(payload.unpaidLeaveDays, 0);
  const overtimeHours = toNumber(payload.overtimeHours ?? 0);
  const overtimeRate = toNumber(payload.overtimeRate ?? 0);
  const performanceBonus = toNumber(payload.performanceBonus ?? 0);
  const otherAllowance = toNumber(payload.otherAllowance ?? 0);
  const taxRate = toNumber(payload.taxRate ?? 12);
  const insuranceDeduction = toNumber(payload.insuranceDeduction ?? 0);
  const statutoryDeduction = toNumber(payload.statutoryDeduction ?? 0);
  const otherDeductions = toNumber(payload.otherDeductions ?? 0);

  const attendanceEarning = dayRate * attendanceDays;
  const leaveDeduction = dayRate * unpaidLeaveDays;
  const overtimePay = overtimeHours * overtimeRate;
  const totalAllowance = employee.fixedAllowance + performanceBonus + otherAllowance + overtimePay;
  const gross = attendanceEarning + totalAllowance;
  const taxDeduction = gross * (taxRate / 100);

  const totalDeductions =
    taxDeduction + insuranceDeduction + statutoryDeduction + otherDeductions + leaveDeduction;
  const netSalary = gross - totalDeductions;

  return {
    payPeriod,
    attendanceDays,
    unpaidLeaveDays,
    attendanceEarning,
    leaveDeduction,
    overtimePay,
    performanceBonus,
    otherAllowance,
    taxRate,
    taxDeduction,
    insuranceDeduction,
    statutoryDeduction,
    otherDeductions,
    gross,
    totalDeductions,
    netSalary,
  };
};

const filterRecords = (records, query) => {
  const search = String(query.search || "").toLowerCase();
  const status = query.status || "All Status";
  const period = query.period || "All Periods";

  return records.filter((r) => {
    const matchSearch =
      !search ||
      r.employeeName.toLowerCase().includes(search) ||
      r.employeeId.toLowerCase().includes(search) ||
      r._id.toLowerCase().includes(search);

    const matchStatus = status === "All Status" || r.status === status;
    const matchPeriod = period === "All Periods" || r.period === period;

    return matchSearch && matchStatus && matchPeriod;
  });
};

export const payrollService = {
  async getEmployees() {
    const docs = await PayrollEmployee.find().sort({ _id: 1 }).lean();
    return docs.map(withId);
  },

  async createEmployee(payload) {
    const existing = await PayrollEmployee.findById(payload.id).lean();
    if (existing) return null;

    const created = await PayrollEmployee.create({
      _id: payload.id,
      name: payload.name,
      department: payload.department,
      baseSalary: toNumber(payload.baseSalary),
      fixedAllowance: toNumber(payload.fixedAllowance),
      paymentMethod: payload.paymentMethod || "Bank Transfer",
      bankName: payload.bankName || "",
      accountNo: payload.accountNo || "",
    });
    return withId(created.toObject());
  },

  async getRecords(query) {
    const records = await PayrollRecord.find()
      .sort({ paymentDate: -1, _id: -1 })
      .lean();

    const filtered = filterRecords(records, query).map(withId);
    return {
      records: filtered,
      summary: computeSummary(filtered),
    };
  },

  async getPayslips(query) {
    const filter = {};
    if (query.employeeId) filter.employeeId = String(query.employeeId);
    if (query.period) filter.period = String(query.period);

    const docs = await Payslip.find(filter).sort({ paymentDate: -1, _id: -1 }).lean();
    return docs.map(withId);
  },

  async getPayslipById(id) {
    const doc = await Payslip.findById(id).lean();
    return withId(doc);
  },

  async calculatePayroll(payload) {
    let employee = await PayrollEmployee.findById(payload.employeeId).lean();
    if (!employee) {
      const user = await User.findOne({
        $or: [{ employeeId: payload.employeeId }, { id: payload.employeeId }],
      }).lean();

      if (user) {
        const created = await PayrollEmployee.create({
          _id: user.employeeId,
          name: user.name,
          department: user.department,
          baseSalary: 5000,
          fixedAllowance: 1000,
          paymentMethod: "Bank Transfer",
          bankName: "",
          accountNo: "",
        });
        employee = created.toObject();
      }
    }
    if (!employee) return null;

    // --- Performance → Payroll integration ---
    // Look for a completed, unprocessed review (Bonus OR Promotion) for this employee.
    // Try both the PayrollEmployee _id and the original payload employeeId,
    // because PerformanceReview stores the employeeId from the User model (e.g. "EMP001")
    // while PayrollEmployee._id may be in a different format (e.g. "EMP-0034").
    const candidateIds = [...new Set([employee._id, payload.employeeId].filter(Boolean))];
    console.log("[Payroll] Looking for pending review for IDs:", candidateIds);

    const pendingReview = await PerformanceReview.findOne({
      employeeId: { $in: candidateIds },
      status: "Completed",
      recommendation: { $in: ["Bonus", "Promotion"] },
      payrollProcessed: { $ne: true },
    }).sort({ _id: -1 }).lean();

    console.log("[Payroll] Pending review found:", pendingReview ? { id: pendingReview._id, type: pendingReview.recommendation } : "none");

    // If a bonus review exists and the caller didn't explicitly set a bonus,
    // use the review's bonusAmount (falls back to 500 if not specified).
    if (pendingReview && pendingReview.recommendation === "Bonus") {
      const reviewBonus = Number(pendingReview.bonusAmount) || 500;
      const currentBonus = toNumber(payload.performanceBonus);
      if (!currentBonus || currentBonus === 0) {
        console.log("[Payroll] Auto-injecting bonus from review:", reviewBonus);
        payload.performanceBonus = reviewBonus;
      }
    }

    const calc = makePayrollCalculation(payload, employee);
    const payrollId = await nextPayrollId(calc.payPeriod);
    const periodLabel = monthLabelFromPeriod(calc.payPeriod);
    const paymentDate = payload.paymentDate || paydayFromPeriod(calc.payPeriod);

    const payrollRecord = {
      _id: payrollId,
      employeeId: employee._id,
      employeeName: employee.name,
      department: employee.department,
      period: periodLabel,
      attendanceDays: calc.attendanceDays,
      leaveDays: calc.unpaidLeaveDays,
      gross: Number(calc.gross.toFixed(2)),
      deductions: Number(calc.totalDeductions.toFixed(2)),
      net: Number(calc.netSalary.toFixed(2)),
      status: payload.status || "Processed",
      paymentDate,
    };

    const payslip = {
      _id: payrollId,
      payrollId,
      employeeId: employee._id,
      employeeName: employee.name,
      department: employee.department,
      period: calc.payPeriod,
      periodLabel,
      paymentDate,
      paymentMethod: employee.paymentMethod,
      bankName: employee.bankName,
      accountNo: employee.accountNo,
      earnings: [
        { label: "Attendance-based Salary", amount: Number(calc.attendanceEarning.toFixed(2)) },
        { label: "Fixed Allowance", amount: Number(employee.fixedAllowance.toFixed(2)) },
        { label: "Overtime", amount: Number(calc.overtimePay.toFixed(2)) },
        { label: "Performance Bonus", amount: Number(calc.performanceBonus.toFixed(2)) },
        { label: "Other Allowances", amount: Number(calc.otherAllowance.toFixed(2)) },
      ],
      deductions: [
        { label: `Tax (${calc.taxRate}%)`, amount: Number(calc.taxDeduction.toFixed(2)) },
        { label: "Insurance", amount: Number(calc.insuranceDeduction.toFixed(2)) },
        { label: "Statutory Contribution", amount: Number(calc.statutoryDeduction.toFixed(2)) },
        { label: "Leave Deduction", amount: Number(calc.leaveDeduction.toFixed(2)) },
        { label: "Other Deductions", amount: Number(calc.otherDeductions.toFixed(2)) },
      ],
      gross: Number(calc.gross.toFixed(2)),
      totalDeductions: Number(calc.totalDeductions.toFixed(2)),
      net: Number(calc.netSalary.toFixed(2)),
      attendanceDays: calc.attendanceDays,
      leaveDays: calc.unpaidLeaveDays,
    };

    await PayrollRecord.create(payrollRecord);
    await Payslip.create(payslip);

    // Mark any pending review (Bonus or Promotion) as processed so it won't trigger again
    if (pendingReview) {
      await PerformanceReview.findByIdAndUpdate(pendingReview._id, {
        payrollProcessed: true,
      });
      console.log("[Payroll] Marked review as payrollProcessed:", pendingReview._id, pendingReview.recommendation);
    }

    return {
      payrollRecord,
      payslip,
      breakdown: calc,
    };
  },

  findPeriodFromLabel(periodLabel) {
    return periodFromLabel(periodLabel);
  },

  /**
   * Get the latest unprocessed performance recommendation for an employee.
   * Used by the payroll UI to show alert banners and pre-fill bonus amounts.
   */
  async getRecommendation(employeeId) {
    console.log("[Payroll] getRecommendation called with employeeId:", employeeId);

    const review = await PerformanceReview.findOne({
      employeeId,
      status: "Completed",
      payrollProcessed: { $ne: true },
      recommendation: { $in: ["Bonus", "Promotion"] },
    }).sort({ _id: -1 }).lean();

    console.log("[Payroll] getRecommendation query result:", review
      ? { id: review._id, recommendation: review.recommendation, bonusAmount: review.bonusAmount, payrollProcessed: review.payrollProcessed }
      : null
    );

    if (!review) return null;

    const result = {
      recommendation: review.recommendation,
      bonusAmount: Number(review.bonusAmount) || 0,
      reviewId: review._id,
      cycle: review.cycle,
      finalRating: review.finalRating,
      reviewer: review.reviewer,
      payrollProcessed: false,
    };

    // For Promotions, also fetch the updated baseSalary from PayrollEmployee
    // so the frontend can display the new salary in the green banner.
    if (review.recommendation === "Promotion") {
      const payrollEmp = await PayrollEmployee.findById(employeeId).lean();
      if (payrollEmp) {
        result.updatedBaseSalary = payrollEmp.baseSalary;
        console.log("[Payroll] Promotion detected — current baseSalary:", payrollEmp.baseSalary);
      }
    }

    console.log("[Payroll] Returning recommendation payload:", result);
    return result;
  },
};
