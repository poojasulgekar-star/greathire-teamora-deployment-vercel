import { NotificationModel, NotificationPreferenceModel } from "../db/schemas.js";
import { CURRENT_EMPLOYEE_ID } from "./employees.js";
import { logger } from "../config/logger.js";

export let notifications = [];

export async function loadNotifications() {
  let docs = await NotificationModel.find().lean();
  notifications.length = 0;
  notifications.push(...docs.map(({ _id, ...rest }) => rest));
  return notifications;
}

export async function persistNewNotification(notif) {
  notifications.unshift(notif);
  await NotificationModel.create(notif);
  return notif;
}

export async function persistNotificationUpdate(notif) {
  let { id, ...rest } = notif;
  await NotificationModel.updateOne({ id }, { $set: rest });
  return notif;
}

export async function persistNotificationDelete(id) {
  const result = await NotificationModel.deleteOne({ id });
  const index = notifications.findIndex((n) => n.id === id);
  if (index !== -1) {
    notifications.splice(index, 1);
  }
  return result.deletedCount > 0 || index !== -1;
}

/** Per-employee cache of notification preferences, kept in sync with MongoDB. */
let preferencesCache = {};

export async function loadNotificationPreferences() {
  let docs = await NotificationPreferenceModel.find().lean();
  preferencesCache = {};
  docs.forEach((doc) => {
    let { _id, employeeId, ...rest } = doc;
    preferencesCache[employeeId] = rest;
  });
  return preferencesCache;
}

export function getPreferencesFor(employeeId) {
  if (!preferencesCache[employeeId]) {
    preferencesCache[employeeId] = {
      email: true,
      push: true,
      attendanceAlerts: true,
      leaveAlerts: true,
      systemAlerts: false,
    };
    NotificationPreferenceModel.create({ employeeId, ...preferencesCache[employeeId] }).catch((err) =>
      logger.error({ err, employeeId }, "[notifications] failed to persist default preferences")
    );
  }
  return preferencesCache[employeeId];
}

export async function persistPreferencesUpdate(employeeId, prefs) {
  await NotificationPreferenceModel.updateOne({ employeeId }, { $set: prefs }, { upsert: true });
  return prefs;
}

export { CURRENT_EMPLOYEE_ID };
