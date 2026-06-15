import { Router } from "express";
import { payrollController } from "./payroll.controller.js";

const payrollRouter = Router();

payrollRouter.get("/employees", payrollController.listEmployees);
payrollRouter.post("/employees", payrollController.createEmployee);
payrollRouter.put("/employees/:id", payrollController.updateEmployee);
payrollRouter.get("/records", payrollController.listRecords);
payrollRouter.delete("/records/:id", payrollController.deleteRecord);
payrollRouter.patch("/records/:id/status", payrollController.updateRecordStatus);
payrollRouter.get("/payslips", payrollController.listPayslips);
payrollRouter.get("/payslips/:id", payrollController.getPayslipById);
payrollRouter.post("/calculate", payrollController.calculate);

export { payrollRouter };
