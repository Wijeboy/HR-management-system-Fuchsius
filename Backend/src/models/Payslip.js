import mongoose from "mongoose";

const lineItemSchema = new mongoose.Schema(
  { label: String, amount: Number },
  { _id: false }
);

const schema = new mongoose.Schema({
  _id: { type: String, required: true },
  payrollId: { type: String, required: true },
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  department: { type: String, required: true },
  period: { type: String, required: true },
  periodLabel: { type: String, default: "" },
  paymentDate: { type: String, default: "" },
  paymentMethod: { type: String, default: "" },
  bankName: { type: String, default: "" },
  accountNo: { type: String, default: "" },
  earnings: [lineItemSchema],
  deductions: [lineItemSchema],
  gross: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  net: { type: Number, default: 0 },
  attendanceDays: { type: Number, default: 0 },
  leaveDays: { type: Number, default: 0 },
});

schema.index({ employeeId: 1, period: 1 });

export default mongoose.model("Payslip", schema);
