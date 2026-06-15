import Announcement from "../../../models/Announcement.js";

const withId = (doc) => {
  if (!doc) return doc;
  const obj = doc._id ? { ...doc, id: doc._id } : doc;
  return obj;
};

export const announcementService = {
  async getAnnouncements(role) {
    const filter = { isActive: true };

    const docs = await Announcement.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Filter by target role
    const filtered = docs.filter((doc) => {
      if (doc.targetRoles.includes("all")) return true;
      if (role && doc.targetRoles.includes(role)) return true;
      return false;
    });

    return filtered.map(withId);
  },

  async createAnnouncement(data) {
    const doc = await Announcement.create({
      title: data.title,
      message: data.message,
      type: data.type || "info",
      createdBy: data.createdBy,
      createdByName: data.createdByName || "",
      targetRoles: data.targetRoles || ["all"],
      isActive: true,
    });
    return withId(doc.toObject());
  },

  async updateAnnouncement(id, data) {
    const update = {};
    if (data.title !== undefined) update.title = data.title;
    if (data.message !== undefined) update.message = data.message;
    if (data.type !== undefined) update.type = data.type;
    if (data.targetRoles !== undefined) update.targetRoles = data.targetRoles;
    if (data.isActive !== undefined) update.isActive = data.isActive;

    const updated = await Announcement.findByIdAndUpdate(id, update, {
      new: true,
    }).lean();
    return updated ? withId(updated) : null;
  },

  async deleteAnnouncement(id) {
    const deleted = await Announcement.findByIdAndDelete(id).lean();
    return deleted ? withId(deleted) : null;
  },
};
