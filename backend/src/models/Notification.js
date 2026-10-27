import {
  notifications,
  getPreferencesFor,
  persistNewNotification,
  persistNotificationUpdate,
  persistNotificationDelete,
  persistPreferencesUpdate,
} from "../data/notificationsStore.js";
import { NotificationModel } from "../db/schemas.js";
import { generateId } from "../utils/id.js";
import { CURRENT_EMPLOYEE_ID } from "../data/employees.js";
import { paginate } from "../utils/paginate.js";

function timeAgo(iso) {
  let diffMs = Date.now() - new Date(iso).getTime();
  let minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  let hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  let days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function badgeForPriority(priority) {
  if (priority === "high") return { label: "High", tone: "bg-red-50 text-red-600" };
  if (priority === "medium") return { label: "Medium", tone: "bg-amber-50 text-amber-600" };
  return { label: "Low", tone: "bg-slate-100 text-slate-500" };
}

function toDto(n) {
  return {
    id: n.id,
    title: n.title,
    description: n.description,
    category: n.category,
    priority: n.priority,
    time: timeAgo(n.createdAt),
    createdAt: n.createdAt,
    avatar: n.avatar,
    isSystem: n.isSystem,
    unread: !n.read,
    badge: badgeForPriority(n.priority),
  };
}

export let Notification = {
  /** filter: "all" | "unread" | "attendance" | "leave" | "system"; search matches title/description. */
  async list(employeeId = CURRENT_EMPLOYEE_ID, { filter = "all", search = "", page = 1, pageSize = 100 } = {}, isAdmin = false) {
    // Keep in sync with MongoDB so serverless instances always see latest notifications
    try {
      let docs = await NotificationModel.find().lean();
      if (docs.length > 0) {
        notifications.length = 0;
        notifications.push(...docs.map(({ _id, ...rest }) => rest));
      }
    } catch {
      // Fallback to in-memory notifications if DB query fails
    }

    let rows = notifications.filter((n) => {
      if (isAdmin) {
        return (
          n.recipientEmployeeId === employeeId ||
          n.recipientEmployeeId === "emp_admin" ||
          !n.recipientEmployeeId
        );
      }
      return n.recipientEmployeeId === employeeId;
    });

    if (filter === "unread") rows = rows.filter((n) => !n.read);
    else if (filter !== "all") rows = rows.filter((n) => n.category === filter);

    if (search) {
      let q = search.toLowerCase();
      rows = rows.filter(
        (n) => n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q)
      );
    }

    let sorted = rows.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    let { data, ...meta } = paginate(sorted, { page, pageSize });
    return { data: data.map(toDto), ...meta };
  },

  async getSummary(employeeId = CURRENT_EMPLOYEE_ID, isAdmin = false) {
    let rows = notifications.filter((n) => {
      if (isAdmin) {
        return (
          n.recipientEmployeeId === employeeId ||
          n.recipientEmployeeId === "emp_admin" ||
          !n.recipientEmployeeId
        );
      }
      return n.recipientEmployeeId === employeeId;
    });
    let unread = rows.filter((n) => !n.read).length;
    let highPriority = rows.filter((n) => n.priority === "high" && !n.read).length;
    return [
      { label: "Unread", value: String(unread), tone: "text-blue-600" },
      { label: "High Priority", value: String(highPriority), tone: "text-red-500" },
    ];
  },

  getPreferences(employeeId = CURRENT_EMPLOYEE_ID) {
    return getPreferencesFor(employeeId);
  },

  async updatePreferences(employeeId = CURRENT_EMPLOYEE_ID, updates = {}) {
    let prefs = getPreferencesFor(employeeId);
    Object.assign(prefs, updates);
    await persistPreferencesUpdate(employeeId, prefs);
    return prefs;
  },

  async create({
    title,
    description,
    category = "system",
    priority = "low",
    recipientEmployeeId = CURRENT_EMPLOYEE_ID,
    isSystem = false,
    relatedEmployeeId = null,
    avatar = null,
  }) {
    let notif = {
      id: generateId("notif"),
      type: category,
      category,
      title,
      description,
      priority,
      read: false,
      isSystem,
      relatedEmployeeId,
      avatar,
      createdAt: new Date().toISOString(),
      recipientEmployeeId,
    };
    await persistNewNotification(notif);
    return toDto(notif);
  },

  async markAsRead(id, employeeId = CURRENT_EMPLOYEE_ID, isAdmin = false) {
    let doc = await NotificationModel.findOne({ id }).lean();
    if (!doc) {
      doc = notifications.find((n) => n.id === id);
    }
    if (!doc) return null;

    let canMark =
      isAdmin ||
      doc.recipientEmployeeId === employeeId ||
      doc.recipientEmployeeId === "emp_admin" ||
      !doc.recipientEmployeeId;

    if (!canMark) return null;

    doc.read = true;
    await persistNotificationUpdate(doc);

    let memNotif = notifications.find((n) => n.id === id);
    if (memNotif) memNotif.read = true;

    return toDto(doc);
  },

  async markAllAsRead(employeeId = CURRENT_EMPLOYEE_ID, isAdmin = false) {
    let query = isAdmin
      ? {
          $or: [
            { recipientEmployeeId: employeeId },
            { recipientEmployeeId: "emp_admin" },
            { recipientEmployeeId: null },
          ],
        }
      : { recipientEmployeeId: employeeId };

    await NotificationModel.updateMany(query, { $set: { read: true } });
    let count = 0;
    for (let n of notifications) {
      if (isAdmin || n.recipientEmployeeId === employeeId) {
        n.read = true;
        count++;
      }
    }
    return count;
  },

  async deleteById(id, employeeId = CURRENT_EMPLOYEE_ID, isAdmin = false) {
    // 1. Try finding in MongoDB first to guarantee cross-instance consistency
    let doc = await NotificationModel.findOne({ id }).lean();
    if (!doc) {
      doc = notifications.find((n) => n.id === id);
    }
    if (!doc) return false;

    // Admin can delete any notification; otherwise must match recipient
    let canDelete =
      isAdmin ||
      doc.recipientEmployeeId === employeeId ||
      doc.recipientEmployeeId === "emp_admin" ||
      !doc.recipientEmployeeId;

    if (!canDelete) return false;

    return await persistNotificationDelete(id);
  },
};
