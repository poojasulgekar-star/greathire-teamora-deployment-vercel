
import { Employee } from "./Employee.js";
import { Attendance } from "./Attendance.js";
import { LeaveRequest } from "./LeaveRequest.js";
import { activityLog, getDotClass } from "../data/activityStore.js";
import { todayISO, addDays, toISODate, formatPrettyDate, timeAgo } from "../utils/dates.js";

// Cycled deterministically by employee id so the same person always gets the same color,
// mirroring the hand-picked avatarClass values in the frontend's static dashboardData.js.
let AVATAR_PALETTE = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-emerald-100 text-emerald-700",
  "bg-indigo-100 text-indigo-700",
];

function avatarClassFor(employeeId) {
  let hash = 0;
  for (let i = 0; i < employeeId.length; i += 1) hash = (hash * 31 + employeeId.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function initialsFor(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Employee ids on approved leave that covers the given date. */

/** Unique employee ids on approved leave that covers the given date. */
function onLeaveIdsFor(dateISO) {
  const requests = LeaveRequest.getAll({ status: "Approved" });

  return [
    ...new Set(
      requests
        .filter(
          (request) =>
            request.startDate <= dateISO &&
            request.endDate >= dateISO
        )
        .map((request) => request.employeeId)
        .filter(Boolean)
    ),
  ];
}


export let Dashboard = {
  /** Maps to DashboardOverviewCard: greeting + OVERVIEW_STATS (Total Employees / Live Online / Attendance). */
getOverview(adminName = "Swaraj Kadam") {
let today = todayISO();
let rows = Attendance.getByDate(today);
let workingDayRows = rows.filter((r) => r.status !== "Weekend");
let totalEmployees = Employee.getAll().length;
let onLeaveIdSet = new Set(onLeaveIdsFor(today));
let liveOnline = rows.filter(
  (r) => r.liveStatus && !onLeaveIdSet.has(r.employeeId)
).length;
let present = workingDayRows.filter((r) => r.status === "Present" || r.status === "Late").length;
let attendancePct = workingDayRows.length
      ? Math.round((present / workingDayRows.length) * 1000) / 10
      : 0;

    return {
      adminName,
      dateLabel: formatPrettyDate(today),
      stats: [
        { label: "TOTAL EMPLOYEES", value: String(totalEmployees), tone: "neutral" },
        { label: "LIVE ONLINE", value: String(liveOnline), tone: "blue", withDot: true },
        { label: "ATTENDANCE", value: `${attendancePct}%`, tone: "green" },
      ],
    };
  },

  /** Maps to WorkforceSnapshot: SNAPSHOT_STATS (Total / Working / Break / Leave, each with a percent bar). */
getSnapshot() {
let today = todayISO();
let rows = Attendance.getByDate(today);
let total = Employee.getAll().length;

let onLeaveIds = onLeaveIdsFor(today);
let onLeaveIdSet = new Set(onLeaveIds);

let working = rows.filter(
  (r) => r.liveStatus === "Working" && !onLeaveIdSet.has(r.employeeId)
).length;

let onBreak = rows.filter(
  (r) => r.liveStatus === "On Break" && !onLeaveIdSet.has(r.employeeId)
).length;

let onLeave = onLeaveIds.length;

    let pct = (n) => (total ? Math.round((n / total) * 100) : 0);

    return [
      { label: "Total Engineers", value: total, percent: 100, color: "bg-slate-300" },
      { label: "Working", value: working, percent: pct(working), color: "bg-primary" },
      { label: "Break", value: onBreak, percent: pct(onBreak), color: "bg-amber-400" },
      { label: "Leave", value: onLeave, percent: pct(onLeave), color: "bg-rose-400" },
    ];
  },

  /** Maps to MetricRow's 4 cards: Total Employees / Currently Working / On Break / Avg Working Hrs (+ trend). */
  getMetrics() {
    let today = todayISO();
    let yesterday = toISODate(addDays(new Date(), -1));

    let todayRows = Attendance.getByDate(today);
    let yesterdayRows = Attendance.getByDate(yesterday);

    let avgHours = (rows) => {
      let worked = rows.filter((r) => r.hoursWorked > 0).map((r) => r.hoursWorked);
      return worked.length ? worked.reduce((a, b) => a + b, 0) / worked.length : 0;
    };

    let todayAvg = avgHours(todayRows);
    let yesterdayAvg = avgHours(yesterdayRows);
    let trendPct = yesterdayAvg ? Math.round(((todayAvg - yesterdayAvg) / yesterdayAvg) * 1000) / 10 : 0;

   let onLeaveIdSet = new Set(onLeaveIdsFor(today));

return {
  totalEmployees: Employee.getAll().length,
  currentlyWorking: todayRows.filter(
    (r) => r.liveStatus === "Working" && !onLeaveIdSet.has(r.employeeId)
  ).length,
  onBreak: todayRows.filter(
    (r) => r.liveStatus === "On Break" && !onLeaveIdSet.has(r.employeeId)
  ).length,
  avgWorkingHours: Math.round(todayAvg * 10) / 10,
  avgWorkingHoursTrendPct: trendPct,
};
  },

  /** Maps to LiveWorkforceTable: currently working/break employees, plus those on leave today. */
   getLiveWorkforce(limit = 10) {
    let today = todayISO();
    let rows = Attendance.getByDate(today);

    let onLeaveIds = onLeaveIdsFor(today);
    let onLeaveIdSet = new Set(onLeaveIds);

    let active = rows
      .filter(
        (r) => r.liveStatus && !onLeaveIdSet.has(r.employeeId)
      )
      .map((r) => ({
        id: r.employeeId,
        initials: initialsFor(r.employee.name),
        name: r.employee.name,
        avatar: r.employee.avatar || "",
        role: r.employee.role,
        status: r.liveStatus === "Working" ? "working" : "break",
        checkIn: r.checkIn || "--",
        avatarClass: avatarClassFor(r.employeeId),
      }));

    let onLeave = onLeaveIds
      .map((id) => Employee.getById(id))
      .filter(Boolean)
      .map((employee) => ({
        id: employee.id,
        initials: initialsFor(employee.name),
        name: employee.name,
        avatar: employee.avatar || "",
        role: employee.role,
        status: "leave",
        checkIn: "--",
        avatarClass: avatarClassFor(employee.id),
      }));

    return [...active, ...onLeave].slice(0, limit);
  },

  /** Maps to RecentActivity: latest events, newest first, with relative timestamps. */
  getRecentActivity(limit = 10) {
    return activityLog.slice(0, limit).map((entry) => ({
      id: entry.id,
      text: entry.text,
      time: timeAgo(entry.timestamp),
      dotClass: getDotClass(entry.type),
    }));
  },
};
