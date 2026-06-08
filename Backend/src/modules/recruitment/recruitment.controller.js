import { recruitmentService } from "./recruitment.service.js";

const hasRequiredJobFields = (body) =>
  body?.jobTitle && body?.department && body?.jobType && body?.workMode && body?.closingDate;

export const recruitmentController = {
  async getAllJobs(req, res) {
    try {
      const jobs = await recruitmentService.getAllJobs(req.query.search || "");
      res.json({ jobs });
    } catch (error) {
      res.status(500).json({ message: error.message || "Failed to fetch jobs" });
    }
  },

  async getJobById(req, res) {
    try {
      const job = await recruitmentService.getJobById(req.params.id);
      res.json({ job });
    } catch (error) {
      res.status(404).json({ message: error.message || "Job not found" });
    }
  },

  async downloadJobAttachment(req, res) {
    try {
      const file = await recruitmentService.getJobAttachment(req.params.id);
      res.setHeader("Content-Type", file.mime || "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${file.name || "job-details.pdf"}"`);
      res.send(file.data);
    } catch (error) {
      res.status(404).json({ message: error.message || "Attachment not found" });
    }
  },

  async createJob(req, res) {
    try {
      if (!hasRequiredJobFields(req.body)) {
        res.status(400).json({ message: "All job fields are required" });
        return;
      }

      const job = await recruitmentService.createJob(req.body, req.file || null);
      res.status(201).json({ success: true, job });
    } catch (error) {
      res.status(400).json({ message: error.message || "Failed to create job" });
    }
  },

  async updateJob(req, res) {
    try {
      const job = await recruitmentService.updateJob(req.params.id, req.body, req.file || null);
      res.json({ success: true, job });
    } catch (error) {
      res.status(400).json({ message: error.message || "Failed to update job" });
    }
  },

  async deleteJob(req, res) {
    try {
      await recruitmentService.deleteJob(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: error.message || "Failed to delete job" });
    }
  },

  async applyForJob(req, res) {
    try {
      if (!req.body?.applicantName || !req.body?.email) {
        res.status(400).json({ message: "Name and email are required" });
        return;
      }

      const applicant = await recruitmentService.applyForJob(req.params.jobPostingId, req.body, req.file || null);
      res.status(201).json({ success: true, applicant });
    } catch (error) {
      res.status(400).json({ message: error.message || "Failed to submit application" });
    }
  },

  async getApplicants(_req, res) {
    try {
      const applicants = await recruitmentService.getApplicants();
      res.json({ applicants });
    } catch (error) {
      res.status(500).json({ message: error.message || "Failed to fetch applicants" });
    }
  },

  async downloadApplicantCv(req, res) {
    try {
      const file = await recruitmentService.getApplicantCv(req.params.id);
      res.setHeader("Content-Type", file.mime || "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${file.name || "cv.pdf"}"`);
      res.send(file.data);
    } catch (error) {
      res.status(404).json({ message: error.message || "CV not found" });
    }
  },

  async cancelApplicant(req, res) {
    try {
      await recruitmentService.cancelApplicant(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: error.message || "Failed to cancel applicant" });
    }
  },

  async scheduleInterview(req, res) {
    try {
      if (!req.body?.interviewDate || !req.body?.interviewTime || !req.body?.meetingLink || !req.body?.duration) {
        res.status(400).json({ message: "All schedule fields are required" });
        return;
      }

      const schedule = await recruitmentService.scheduleInterview(req.params.applicantId, req.body);
      res.status(201).json({ success: true, schedule });
    } catch (error) {
      res.status(400).json({ message: error.message || "Failed to schedule interview" });
    }
  },

  async getEmployeeSchedules(req, res) {
    try {
      const schedules = await recruitmentService.getEmployeeSchedules(req.params.employeeId, req.query.search || "");
      res.json({ schedules });
    } catch (error) {
      res.status(500).json({ message: error.message || "Failed to fetch schedules" });
    }
  },
};
