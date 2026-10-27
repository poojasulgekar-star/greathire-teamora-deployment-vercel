import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  HelpCircle,
  Menu,
  Bell,
  Search,
  CheckCheck,
  Download,
  LogIn as LogInIcon,
  CalendarClock,
  Cog,
  Trash2,
  X,
} from "lucide-react";
import { notificationsApi } from "@/lib/api/notifications";
import { Checkbox } from "@/components/ui/checkbox";
import MasterSidebar from "@/components/layout/MasterSidebar";
import ProfileAvatarButton from "@/components/layout/ProfileAvatarButton";

const filters = ["All", "Unread", "Attendance", "Leave", "System"];

const CATEGORY_ICON = {
  attendance: LogInIcon,
  leave: CalendarClock,
  system: Cog,
};

function filterToApiValue(filter) {
  if (filter === "All") return "all";
  if (filter === "Unread") return "unread";
  return filter.toLowerCase();
}

function TopBar({ search, onSearchChange }) {
  const navigate = useNavigate();
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkUnreadNotifications() {
      try {
        const response = await notificationsApi.list({
          filter: "all",
          search: "",
        });
        const items = Array.isArray(response)
          ? response
          : response?.data?.notifications ??
            response?.notifications ??
            response?.data ??
            [];

        if (active && Array.isArray(items)) {
          setHasUnreadNotifications(
            items.some(
              (item) =>
                item.unread === true ||
                item.isRead === false ||
                item.read === false
            )
          );
        }
      } catch (error) {
        console.error("Failed to check unread notifications:", error);
      }
    }

    checkUnreadNotifications();
    const intervalId = window.setInterval(checkUnreadNotifications, 5000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  function openSidebar() {
    window.dispatchEvent(new CustomEvent("teamora:open-sidebar"));
  }

  return (
    <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
      <div className="flex flex-1 min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={openSidebar}
          aria-label="Open navigation"
          className="lg:hidden shrink-0 rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex min-w-0 w-full max-w-md items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">
          <Search className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search Notifications..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full min-w-0 bg-transparent text-sm text-slate-600 outline-none placeholder-slate-400 dark:text-slate-300 dark:placeholder-slate-500"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => navigate("/notifications")}
          aria-label="Notifications"
          className="relative text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <Bell className="h-5 w-5" />
          {hasUnreadNotifications && (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
          )}
        </button>

        <button
          type="button"
          onClick={() => navigate("/profile")}
          aria-label="Profile settings"
          className="hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 sm:block"
        >
          <Settings className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => navigate("/support")}
          aria-label="Help"
          className="hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 sm:block"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        <span className="hidden h-5 w-px bg-slate-200 sm:block dark:bg-slate-700" />

        <button
          type="button"
          onClick={() => navigate("/support")}
          className="hidden text-sm font-medium text-blue-600 hover:text-blue-700 sm:block"
        >
          Support
        </button>

        <ProfileAvatarButton />
      </div>
    </header>
  );
}

function PageHeader({ activeFilter, setActiveFilter, onMarkAllRead }) {
  return (
    <>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Notifications
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Stay updated with workforce activities and important alerts.
        </p>
      </div>

      <div className="flex flex-col gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 mb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="grid grid-cols-3 gap-1 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
          {filters.map((filter) => (
            <button
              type="button"
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`relative whitespace-nowrap rounded-full px-2 py-1.5 text-center text-xs font-medium transition-colors sm:px-3.5 sm:text-sm ${
                activeFilter === filter
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onMarkAllRead}
          className="flex items-center gap-1.5 self-start whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-700 sm:self-auto"
        >
          <CheckCheck className="w-4 h-4" />
          Mark All as Read
        </button>
      </div>
    </>
  );
}
function NotificationRow({ item, onClick, onDelete, deleting = false }) {

  const Icon = CATEGORY_ICON[item.category] || Cog;

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-4 px-4 sm:px-6 py-5 border-b border-slate-100 dark:border-slate-800 last:border-b-0 ${
        item.unread
          ? "bg-blue-50/40 dark:bg-blue-950/20"
          : "bg-white dark:bg-slate-900"
      }`}
    >
      {item.unread ? (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
      ) : (
        <span className="w-1 flex-shrink-0" />
      )}

      {item.isSystem || !item.avatar ? (
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </div>
      ) : (
        <img
          src={item.avatar}
          alt={item.title}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900 dark:text-white break-words min-w-0">
            {item.title}
          </p>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
              {item.time}
            </span>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(item);
              }}
              aria-label={`Delete notification: ${item.title}`}
              title="Delete notification"
              className="shrink-0 rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 break-words">
          {item.description}
        </p>

        {item.badge && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md mt-2 ${item.badge.tone || ""}`}
          >
            {item.badge.label || item.category}
          </span>
        )}
    </div>
    </div>
  );
}

function SummaryCard({ summary }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        Summary
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {summary.map(({ label, value, tone }) => (
          <div
            key={label}
            className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3"
          >
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">
              {label}
            </p>
            <p className={`text-xl font-bold ${tone || ""}`}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const PREFERENCE_LABELS = [
  { key: "email", label: "Email alerts" },
  { key: "push", label: "Push alerts" },
  { key: "attendanceAlerts", label: "Attendance alerts" },
  { key: "leaveAlerts", label: "Leave alerts" },
  { key: "systemAlerts", label: "System alerts" },
];

function QuickActionsCard({
  open,
  onToggle,
  preferences,
  onTogglePreference,
  onExport,
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Quick Actions
        </h3>

        {open && (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Close notification settings"
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-950"
        >
          <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          Notification Settings
        </button>

        {open && (
          <div className="flex flex-col gap-3 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-3 -mt-1">
            {PREFERENCE_LABELS.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                {label}
                <Checkbox
                  checked={!!preferences?.[key]}
                  onCheckedChange={(checked) =>
                    onTogglePreference(key, checked)
                  }
                />
              </label>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-950"
        >
          <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          Export Logs
        </button>
      </div>
    </div>
  );
}

export default function NotificationsCenterPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const refresh = useCallback(async () => {
    const [list, summaryData] = await Promise.all([
      notificationsApi.list({
        filter: filterToApiValue(activeFilter),
        search,
      }),
      notificationsApi.getSummary(),
    ]);

    setNotifications(Array.isArray(list) ? list : list?.data || []);
    setSummary(Array.isArray(summaryData) ? summaryData : []);
  }, [activeFilter, search]);

  useEffect(() => {
    refresh().catch((err) => console.error("Failed to load notifications:", err));
  }, [refresh]);

  useEffect(() => {
    notificationsApi
      .getPreferences()
      .then(setPreferences)
      .catch((err) => console.error("Failed to load preferences:", err));
  }, []);

  async function handleRowClick(item) {
    if (!item.unread) return;

    try {
      await notificationsApi.markAsRead(item.id);
      await refresh();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }
async function handleDeleteNotification(item) {
  const confirmed = window.confirm(
    `Delete "${item.title}" notification?`
  );

  if (!confirmed) return;

  setDeletingId(item.id);

  // Optimistically remove from UI immediately
  const previousList = [...notifications];
  setNotifications((prev) => prev.filter((n) => n.id !== item.id));

  try {
    await notificationsApi.delete(item.id);
    await refresh();
  } catch (err) {
    console.error("Failed to delete notification:", err);
    // If the error status is 404, it was already deleted in the database — no need to restore
    if (err.status !== 404 && !String(err.message).includes("404")) {
      setNotifications(previousList);
      window.alert(err.message || "Could not delete notification. Please try again.");
    }
  } finally {
    setDeletingId(null);
  }
}

  async function handleMarkAllRead() {
    try {
      await notificationsApi.markAllAsRead();
      await refresh();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      window.alert("Could not mark notifications as read. Please try again.");
    }
  }

  async function handleTogglePreference(key, checked) {
    const previous = preferences;
    const next = { ...preferences, [key]: checked };

    setPreferences(next);

    try {
      const saved = await notificationsApi.updatePreferences({
        [key]: checked,
      });

      if (saved && typeof saved === "object") {
        setPreferences((current) => ({ ...current, ...saved }));
      }
    } catch (err) {
      setPreferences(previous);
      console.error("Failed to save notification preference:", err);
      window.alert("Could not save notification settings. Please try again.");
    }
  }

  // async function handleDeleteNotification(item) {
  //   const confirmed = window.confirm(
  //     `Delete "${item.title}" notification?`
  //   );

  //   if (!confirmed) return;

  //   setDeletingId(item.id);

  //   try {
  //     await notificationsApi.delete(item.id);
  //     await refresh();
  //   } catch (err) {
  //     console.error("Failed to delete notification:", err);
  //     window.alert("Could not delete notification. Please try again.");
  //   } finally {
  //     setDeletingId(null);
  //   }
  // }

  function handleExportLogs() {
    if (!notifications.length) {
      window.alert("There are no notifications to export.");
      return;
    }

    const columns = [
      ["Title", "title"],
      ["Description", "description"],
      ["Category", "category"],
      ["Priority", "priority"],
      ["Created At", "createdAt"],
      ["Time", "time"],
      ["Unread", "unread"],
      ["System Notification", "isSystem"],
    ];

    const escapeCsv = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      columns.map(([label]) => escapeCsv(label)).join(","),
      ...notifications.map((notification) =>
        columns.map(([, key]) => escapeCsv(notification[key])).join(",")
      ),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `notifications-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="w-screen h-screen overflow-hidden flex bg-background dark:bg-slate-950">
      <MasterSidebar />

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <TopBar search={search} onSearchChange={setSearch} />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 min-w-0">
              <PageHeader
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                onMarkAllRead={handleMarkAllRead}
              />

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {notifications.length === 0 ? (
                  <p className="px-6 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                    No notifications here.
                  </p>
                ) : (
                  notifications.map((item) => (
                    <NotificationRow
                      key={item.id}
                      item={item}
                      onClick={() => handleRowClick(item)}
                      onDelete={handleDeleteNotification}
                      deleting={deletingId === item.id}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <SummaryCard summary={summary} />

              <QuickActionsCard
                open={preferencesOpen}
                onToggle={() => setPreferencesOpen((value) => !value)}
                preferences={preferences}
                onTogglePreference={handleTogglePreference}
                onExport={handleExportLogs}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}