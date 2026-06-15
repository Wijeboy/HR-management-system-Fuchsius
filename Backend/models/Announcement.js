import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["info", "success", "warning", "urgent"],
      default: "info",
    },
    createdBy: { type: String, required: true },
    createdByName: { type: String, default: "" },
    targetRoles: {
      type: [String],
      default: ["all"],
      validate: {
        validator: (v) => v.length > 0,
        message: "At least one target role is required",
      },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

schema.index({ isActive: 1, createdAt: -1 });

export default mongoose.model("Announcement", schema);
