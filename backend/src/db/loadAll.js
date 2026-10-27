import { loadEmployees } from "../data/employees.js";
import { loadAttendance } from "../data/attendanceStore.js";
import { loadActivity } from "../data/activityStore.js";
import { loadLeaveRequests } from "../data/leaveStore.js";
import { loadNotifications, loadNotificationPreferences } from "../data/notificationsStore.js";
import { loadMessaging } from "../data/messagesStore.js";
import { loadGeneratedReports } from "../data/reportsStore.js";
import { loadHolidays } from "../data/holidaysStore.js";
import { loadAnnouncements } from "../data/announcementsStore.js";
import { loadProjects } from "../data/projectsStore.js";
import { loadScheduleItems } from "../data/scheduleStore.js";
import { logger } from "../config/logger.js";

/** Hydrates every module-level cache from MongoDB in parallel.
 * Call once at boot, after seeding. */
export async function loadAllData() {
  await Promise.all([
    loadEmployees(),
    loadAttendance(),
    loadActivity(),
    loadLeaveRequests(),
    loadNotifications(),
    loadNotificationPreferences(),
    loadMessaging(),
    loadGeneratedReports(),
    loadHolidays(),
    loadAnnouncements(),
    loadProjects(),
    loadScheduleItems(),
  ]);
  logger.info("[db] all collections loaded into memory cache");
}
