import mongoose from "mongoose";

const schema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  department: { type: String, required: true },
  baseSalary: { type: Number, required: true },
  fixedAllowance: { type: Number, default: 0 },
  paymentMethod: { type: String, default: "Bank Transfer" },
  bankName: { type: String, default: "" },
  accountNo: { type: String, default: "" },
});

export default mongoose.model("PayrollEmployee", schema);
