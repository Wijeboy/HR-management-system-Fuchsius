import { searchService } from "./search.service.js";

export const searchController = {
  async search(req, res, next) {
    try {
      const q = String(req.query.q || "").trim();

      if (!q) {
        return res.json({ employees: [], leaveRequests: [], departments: [] });
      }

      const results = await searchService.search(q, req.authUser);
      return res.json(results);
    } catch (error) {
      next(error);
    }
  },
};
