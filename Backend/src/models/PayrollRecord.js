import mongoose from "mongoose";

const schema = new mongoose.Schema({
  _id: { type: String, required: true },
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, required: true },
  department: { type: String, required: true },
  period: { type: String, required: true, index: true },
  attendanceDays: { type: Number, default: 0 },
  leaveDays: { type: Number, default: 0 },
  gross: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  net: { type: Number, default: 0 },
  status: { type: String, default: "Pending", index: true },
  paymentDate: { type: String, default: "" },
});

export default mongoose.model("PayrollRecord", schema);
