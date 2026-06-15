import { usersService } from "./users.service.js";

export const usersController = {
  async list(req, res, next) {
    try {
      const result = await usersService.list(req.query || {});
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async getByEmployeeId(req, res, next) {
    try {
      const user = await usersService.getByEmployeeId(req.params.employeeId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json({ user });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const result = await usersService.create(req.body || {});
      if (result.error) {
        res.status(result.status || 400).json({ message: result.error });
        return;
      }
      res.status(201).json({ user: result.user });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const result = await usersService.update(req.params.employeeId, req.body || {});
      if (result.error) {
        res.status(result.status || 400).json({ message: result.error });
        return;
      }
      res.json({ user: result.user });
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const result = await usersService.remove(req.params.employeeId);
      if (result.error) {
        res.status(result.status || 400).json({ message: result.error });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
};
