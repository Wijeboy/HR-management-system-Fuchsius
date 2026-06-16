import mongoose from "mongoose";

const schema = new mongoose.Schema({
  _id: { type: String, required: true },
  employeeName: { type: String, required: true },
  employeeId: { type: String, required: true, index: true },
  department: { type: String, required: true },
  reviewer: { type: String, default: "" },
  cycle: { type: String, required: true, index: true },
  goalsScore: { type: Number, default: 0 },
  competencyScore: { type: Number, default: 0 },
  behaviorScore: { type: Number, default: 0 },
  finalRating: { type: Number, default: 0 },
  recommendation: { type: String, default: "No Change" },
  status: { type: String, default: "In Progress", index: true },
  bonusAmount: { type: Number, default: 0 },
  salaryBumpApplied: { type: Boolean, default: false },
  payrollProcessed: { type: Boolean, default: false },
});

export default mongoose.model("PerformanceReview", schema);
