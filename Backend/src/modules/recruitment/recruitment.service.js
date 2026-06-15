import { connectMongoose } from "../../lib/mongoose.js";
import {
  RecruitmentApplicant,
  RecruitmentInterviewSchedule,
  RecruitmentJob,
} from "./recruitment.models.js";

const toPublicJob = (record) => {
  const { attachmentData, ...rest } = record;
  return rest;
};

const toPublicApplicant = (record) => {
  const { cvData, ...rest } = record;
  return rest;
};

const generateUniqueCode = async () => {
  let code = "";
  let exists = true;

  while (exists) {
    code = `JV-${Math.floor(100000 + Math.random() * 900000)}`;
    const existing = await RecruitmentJob.findOne({ uniqueCode: code }).lean();
    exists = !!existing;
  }

  return code;
};

export const recruitmentService = {
  async getAllJobs(search = "") {
    await connectMongoose();
    const term = String(search || "").trim().toLowerCase();
    const jobs = await RecruitmentJob.find().sort({ createdAt: -1 }).lean();
    const safeJobs = jobs.map(toPublicJob);
    if (!term) return safeJobs;
    return safeJobs.filter((job) => job.uniqueCode.toLowerCase().includes(term));
  },

  async getJobById(id) {
    await connectMongoose();
    const job = await RecruitmentJob.findById(id).lean();
    if (!job) throw new Error("Job posting not found");
    return toPublicJob(job);
  },

  async createJob(payload, file) {
    if (!file) throw new Error("Attachment PDF is required");
    await connectMongoose();

    const created = await RecruitmentJob.create({
      uniqueCode: await generateUniqueCode(),
      jobTitle: String(payload.jobTitle || "").trim(),
      department: String(payload.department || "").trim(),
      jobType: String(payload.jobType || "").trim(),
      workMode: String(payload.workMode || "").trim(),
      closingDate: new Date(payload.closingDate),
      attachmentFile: file.originalname || "attachment.pdf",
      attachmentMime: file.mimetype || "application/pdf",
      attachmentData: file.buffer,
      isActive: true,
    });

    return toPublicJob(created.toObject());
  },

  async updateJob(id, payload, file) {
    await connectMongoose();
    const existing = await RecruitmentJob.findById(id);
    if (!existing) throw new Error("Job posting not found");

    const updated = await RecruitmentJob.findByIdAndUpdate(
      id,
      {
        jobTitle: String(payload.jobTitle ?? existing.jobTitle).trim(),
        department: String(payload.department ?? existing.department).trim(),
        jobType: String(payload.jobType ?? existing.jobType).trim(),
        workMode: String(payload.workMode ?? existing.workMode).trim(),
        closingDate: payload.closingDate ? new Date(payload.closingDate) : existing.closingDate,
        ...(file
          ? {
              attachmentFile: file.originalname || existing.attachmentFile,
              attachmentMime: file.mimetype || "application/pdf",
              attachmentData: file.buffer,
            }
          : {}),
      },
      { new: true }
    );

    if (!updated) {
      throw new Error("Job posting not found");
    }

    return toPublicJob(updated.toObject());
  },

  async deleteJob(id) {
    await connectMongoose();
    const existing = await RecruitmentJob.findById(id).lean();
    if (!existing) throw new Error("Job posting not found");

    const relatedApplicants = await RecruitmentApplicant.find({ jobPostingId: id }).select("_id").lean();
    const relatedIds = relatedApplicants.map((item) => String(item._id));

    await Promise.all([
      RecruitmentInterviewSchedule.deleteMany({ applicantId: { $in: relatedIds } }),
      RecruitmentApplicant.deleteMany({ jobPostingId: id }),
      RecruitmentJob.findByIdAndDelete(id),
    ]);

    return { success: true };
  },

  async applyForJob(jobPostingId, payload, file) {
    if (!file) throw new Error("CV PDF is required");
    await connectMongoose();

    const job = await RecruitmentJob.findById(jobPostingId).lean();
    if (!job) throw new Error("Job posting not found");

    const created = await RecruitmentApplicant.create({
      jobCode: job.uniqueCode,
      jobPostingId: String(job._id),
      applicantName: String(payload.applicantName || "").trim(),
      email: String(payload.email || "").trim(),
      cvFile: file.originalname || "cv.pdf",
      cvMime: file.mimetype || "application/pdf",
      cvData: file.buffer,
      status: "pending",
      submittedBy: payload.employeeId || null,
    });

    return toPublicApplicant(created.toObject());
  },

  async getApplicants() {
    await connectMongoose();
    const applicants = await RecruitmentApplicant.find({ status: { $ne: "cancelled" } })
      .sort({ createdAt: -1 })
      .lean();
    return applicants.map(toPublicApplicant);
  },

  async cancelApplicant(id) {
    await connectMongoose();
    const applicant = await RecruitmentApplicant.findById(id).lean();
    if (!applicant) throw new Error("Applicant not found");

    await Promise.all([
      RecruitmentApplicant.findByIdAndUpdate(id, { status: "cancelled" }, { new: true }),
      RecruitmentInterviewSchedule.deleteMany({ applicantId: id }),
    ]);

    return { success: true };
  },

  async scheduleInterview(applicantId, payload) {
    await connectMongoose();
    const applicant = await RecruitmentApplicant.findById(applicantId).lean();
    if (!applicant) throw new Error("Applicant not found");

    const schedule = await RecruitmentInterviewSchedule.create({
      applicantId,
      jobCode: applicant.jobCode,
      jobPostingId: applicant.jobPostingId,
      applicantName: applicant.applicantName,
      applicantEmail: applicant.email,
      employeeId: payload.employeeId || applicant.submittedBy || "EMP004",
      interviewDate: new Date(payload.interviewDate),
      interviewTime: String(payload.interviewTime || "").trim(),
      meetingLink: String(payload.meetingLink || "").trim(),
      duration: String(payload.duration || "").trim(),
    });

    await RecruitmentApplicant.findByIdAndUpdate(applicantId, { status: "scheduled" });
    return schedule.toObject();
  },

  async getEmployeeSchedules(employeeId, search = "") {
    await connectMongoose();
    const term = String(search || "").trim().toLowerCase();
    const schedules = await RecruitmentInterviewSchedule.find({ employeeId })
      .sort({ interviewDate: 1 })
      .lean();

    if (!term) return schedules;
    return schedules.filter((schedule) => schedule.jobCode.toLowerCase().includes(term));
  },

  async getJobAttachment(id) {
    await connectMongoose();
    const job = await RecruitmentJob.findById(id)
      .select("+attachmentData attachmentMime attachmentFile");

    if (!job?.attachmentData) {
      throw new Error("Attachment not found");
    }

    return {
      data: job.attachmentData,
      mime: job.attachmentMime,
      name: job.attachmentFile,
    };
  },

  async getApplicantCv(id) {
    await connectMongoose();
    const applicant = await RecruitmentApplicant.findById(id)
      .select("+cvData cvMime cvFile");

    if (!applicant?.cvData) {
      throw new Error("CV not found");
    }

    return {
      data: applicant.cvData,
      mime: applicant.cvMime,
      name: applicant.cvFile,
    };
  },
};
