import { payrollService } from "./payroll.service.js";

export const payrollController = {
  async listEmployees(_req, res, next) {
    try {
      res.json({ data: await payrollService.getEmployees() });
    } catch (error) {
      next(error);
    }
  },

  async createEmployee(req, res, next) {
    const required = ["id", "name", "department", "baseSalary"];
    const missing = required.find((key) => req.body?.[key] === undefined || req.body?.[key] === "");

    if (missing) {
      res.status(400).json({ message: `${missing} is required` });
      return;
    }

    try {
      const created = await payrollService.createEmployee(req.body);
      if (!created) {
        res.status(409).json({ message: "Employee ID already exists" });
        return;
      }

      res.status(201).json({ data: created });
    } catch (error) {
      next(error);
    }
  },

  async listRecords(req, res, next) {
    try {
      const result = await payrollService.getRecords(req.query);
      res.json({ data: result.records, summary: result.summary });
    } catch (error) {
      next(error);
    }
  },

  async listPayslips(req, res, next) {
    try {
      const data = await payrollService.getPayslips(req.query);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  },

  async getPayslipById(req, res, next) {
    try {
      const data = await payrollService.getPayslipById(req.params.id);
      if (!data) {
        res.status(404).json({ message: "Payslip not found" });
        return;
      }
      res.json({ data });
    } catch (error) {
      next(error);
    }
  },

  async calculate(req, res, next) {
    if (!req.body?.employeeId) {
      res.status(400).json({ message: "employeeId is required" });
      return;
    }

    try {
      const result = await payrollService.calculatePayroll(req.body);
      if (!result) {
        res.status(404).json({ message: "Employee not found" });
        return;
      }

      res.status(201).json({ data: result });
    } catch (error) {
      next(error);
    }
  },

  async getRecommendation(req, res, next) {
    try {
      const employeeId = req.params.employeeId;
      console.log("[Payroll Controller] GET /recommendation called with:", employeeId);
      const data = await payrollService.getRecommendation(employeeId);
      console.log("[Payroll Controller] Returning recommendation:", data);
      res.json({ data });
    } catch (error) {
      console.error("[Payroll Controller] getRecommendation error:", error.message);
      next(error);
    }
  },
};
