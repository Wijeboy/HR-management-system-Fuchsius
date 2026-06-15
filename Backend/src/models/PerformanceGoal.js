import mongoose from "mongoose";

const schema = new mongoose.Schema({
  _id: { type: String, required: true },
  employeeName: { type: String, required: true },
  employeeId: { type: String, required: true, index: true },
  goal: { type: String, required: true },
  metric: { type: String, default: "" },
  target: { type: Number, default: 0 },
  current: { type: Number, default: 0 },
  weight: { type: Number, default: 0 },
  dueDate: { type: String, default: "" },
  lowerIsBetter: { type: Boolean, default: false },
});

export default mongoose.model("PerformanceGoal", schema);
