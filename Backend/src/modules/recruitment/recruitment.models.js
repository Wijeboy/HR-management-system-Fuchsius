import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const recruitmentJobSchema = new Schema(
  {
    uniqueCode: { type: String, unique: true, required: true },
    jobTitle: { type: String, required: true },
    department: { type: String, required: true },
    jobType: {
      type: String,
      enum: ["full-time", "part-time", "intern"],
      required: true,
    },
    workMode: {
      type: String,
      enum: ["on-site", "remote", "hybrid"],
      required: true,
    },
    closingDate: { type: Date, required: true },
    attachmentFile: { type: String, required: true },
    attachmentMime: { type: String, default: "application/pdf" },
    attachmentData: { type: Buffer, required: true, select: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const recruitmentApplicantSchema = new Schema(
  {
    jobCode: { type: String, required: true },
    jobPostingId: { type: String, required: true },
    applicantName: { type: String, required: true },
    email: { type: String, required: true },
    cvFile: { type: String, required: true },
    cvMime: { type: String, default: "application/pdf" },
    cvData: { type: Buffer, required: true, select: false },
    status: {
      type: String,
      enum: ["pending", "scheduled", "cancelled"],
      default: "pending",
    },
    submittedBy: { type: String, default: null },
  },
  { timestamps: true }
);

const recruitmentInterviewScheduleSchema = new Schema(
  {
    applicantId: { type: String, required: true },
    jobCode: { type: String, required: true },
    jobPostingId: { type: String, required: true },
    applicantName: { type: String, required: true },
    applicantEmail: { type: String, required: true },
    employeeId: { type: String, required: true },
    interviewDate: { type: Date, required: true },
    interviewTime: { type: String, required: true },
    meetingLink: { type: String, required: true },
    duration: {
      type: String,
      enum: ["20 min", "30 min", "60 min"],
      required: true,
    },
  },
  { timestamps: true }
);

recruitmentJobSchema.index({ createdAt: -1 });
recruitmentApplicantSchema.index({ jobPostingId: 1 });
recruitmentApplicantSchema.index({ status: 1 });
recruitmentInterviewScheduleSchema.index({ employeeId: 1, interviewDate: 1 });

export const RecruitmentJob = models.RecruitmentJob || model("RecruitmentJob", recruitmentJobSchema);
export const RecruitmentApplicant = models.RecruitmentApplicant || model("RecruitmentApplicant", recruitmentApplicantSchema);
export const RecruitmentInterviewSchedule =
  models.RecruitmentInterviewSchedule || model("RecruitmentInterviewSchedule", recruitmentInterviewScheduleSchema);
