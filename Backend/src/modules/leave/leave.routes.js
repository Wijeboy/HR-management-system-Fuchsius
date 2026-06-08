import fs from "fs";
import multer from "multer";
import path from "path";
import { Router } from "express";
import { leaveController } from "./leave.controller.js";

fs.mkdirSync("uploads", { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, "uploads/"),
  filename: (_req, file, callback) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];

const upload = multer({
  storage,
  fileFilter: (_req, file, callback) => {
    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(new Error("Only images and PDFs are allowed"));
  },
  limits: { fileSize: 2 * 1024 * 1024 },
});

const leaveRouter = Router();

leaveRouter.post("/submit", upload.single("supportingDocument"), leaveController.submitLeave);
leaveRouter.put("/:id", upload.single("supportingDocument"), leaveController.updateLeave);
leaveRouter.delete("/:id", leaveController.deleteLeave);
leaveRouter.get("/balance/:employeeId", leaveController.getBalance);
leaveRouter.get("/history/:employeeId", leaveController.getHistory);
leaveRouter.get("/pending", leaveController.getPending);
leaveRouter.get("/approved", leaveController.getApproved);
leaveRouter.get("/rejected", leaveController.getRejected);
leaveRouter.post("/:id/approve", leaveController.approveLeave);
leaveRouter.post("/:id/reject", leaveController.rejectLeave);
leaveRouter.get("/:id", leaveController.getSingleRequest);

export { leaveRouter };
