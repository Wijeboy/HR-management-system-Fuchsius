import { announcementService } from "./announcement.service.js";

export const announcementController = {
  async list(req, res, next) {
    try {
      const role = req.query.role || "all";
      const data = await announcementService.getAnnouncements(role);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    const { title, message } = req.body || {};
    if (!title || !message) {
      res.status(400).json({ message: "title and message are required" });
      return;
    }

    try {
      const created = await announcementService.createAnnouncement(req.body);
      res.status(201).json({ data: created });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const updated = await announcementService.updateAnnouncement(
        req.params.id,
        req.body
      );
      if (!updated) {
        res.status(404).json({ message: "Announcement not found" });
        return;
      }
      res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const deleted = await announcementService.deleteAnnouncement(
        req.params.id
      );
      if (!deleted) {
        res.status(404).json({ message: "Announcement not found" });
        return;
      }
      res.json({ message: "Announcement deleted", data: deleted });
    } catch (error) {
      next(error);
    }
  },
};
