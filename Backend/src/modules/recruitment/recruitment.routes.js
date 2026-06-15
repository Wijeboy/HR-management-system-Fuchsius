import { Router } from "express";
import multer from "multer";
import { recruitmentController } from "./recruitment.controller.js";

const router = Router();

const pdfOnly = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
      return;
    }
    cb(new Error("Only PDF files are allowed"));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get("/jobs", recruitmentController.getAllJobs);
router.get("/jobs/:id", recruitmentController.getJobById);
router.get("/jobs/:id/attachment", recruitmentController.downloadJobAttachment);
router.post("/jobs", pdfOnly.single("attachment"), recruitmentController.createJob);
router.put("/jobs/:id", pdfOnly.single("attachment"), recruitmentController.updateJob);
router.delete("/jobs/:id", recruitmentController.deleteJob);

router.post("/apply/:jobPostingId", pdfOnly.single("cv"), recruitmentController.applyForJob);
router.get("/applicants", recruitmentController.getApplicants);
router.get("/applicants/:id/cv", recruitmentController.downloadApplicantCv);
router.delete("/applicants/:id", recruitmentController.cancelApplicant);

router.post("/schedule/:applicantId", recruitmentController.scheduleInterview);
router.get("/schedules/:employeeId", recruitmentController.getEmployeeSchedules);

export { router as recruitmentRouter };
