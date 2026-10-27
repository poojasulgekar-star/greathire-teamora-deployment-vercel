import { Notification } from "../models/Notification.js";
import { CURRENT_EMPLOYEE_ID } from "../data/employees.js";
import { ApiError } from "../middleware/errorHandler.js";

// Uses the authenticated user's linked employee if a token was sent, otherwise
// falls back to the seeded CURRENT_EMPLOYEE_ID so the endpoints work standalone.
function resolveEmployeeId(req) {
  return req.user?.employeeId || CURRENT_EMPLOYEE_ID;
}

function isAdmin(req) {
  return req.user?.role === "admin";
}

export let notificationController = {
  list: async (req, res) => {
    let { filter, search, page, pageSize } = req.query;
    let result = await Notification.list(
      resolveEmployeeId(req),
      { filter, search, page, pageSize },
      isAdmin(req)
    );
    res.json({ success: true, ...result });
  },

  getSummary: async (req, res) => {
    res.json({
      success: true,
      data: await Notification.getSummary(resolveEmployeeId(req), isAdmin(req)),
    });
  },

  getPreferences: (req, res) => {
    res.json({ success: true, data: Notification.getPreferences(resolveEmployeeId(req)) });
  },

  updatePreferences: async (req, res) => {
    let data = await Notification.updatePreferences(resolveEmployeeId(req), req.body);
    res.json({ success: true, data });
  },

  create: async (req, res) => {
    let {
      title,
      description,
      category,
      priority,
      recipientEmployeeId,
    } = req.body;

    let data = await Notification.create({
      title,
      description,
      category,
      priority,
      recipientEmployeeId: recipientEmployeeId || resolveEmployeeId(req),
      isSystem: category === "system",
    });

    res.status(201).json({ success: true, data });
  },

  markAsRead: async (req, res) => {
    let data = await Notification.markAsRead(req.params.id, resolveEmployeeId(req), isAdmin(req));
    if (!data) throw new ApiError(404, "Notification not found");
    res.json({ success: true, data });
  },

  markAllAsRead: async (req, res) => {
    let count = await Notification.markAllAsRead(resolveEmployeeId(req), isAdmin(req));
    res.json({ success: true, data: { updated: count } });
  },

  delete: async (req, res) => {
    const deleted = await Notification.deleteById(
      req.params.id,
      resolveEmployeeId(req),
      isAdmin(req)
    );

    if (!deleted) {
      throw new ApiError(404, "Notification not found");
    }

    res.json({
      success: true,
      data: { deleted: true },
    });
  },
};
