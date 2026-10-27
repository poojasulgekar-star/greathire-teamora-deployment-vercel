import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Settings, HelpCircle, LogOut, X } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { getNavItemsForRole } from "@/data/navConfig";
import { attendanceApi } from "@/lib/api/attendance";
import { employeeDashboardApi } from "@/lib/api/employeeDashboard";
import { Button } from "@/components/ui/button";
import NavItem from "./NavItem";

// Check-In is disabled while already Working/On Break — mirrors the same
// status-driven gating added to EmployeeDashboardPage.jsx's QuickActions.
const CHECKED_IN_STATES = ["Working", "On Break"];

function SidebarContent({ pathname, closeMobile, items, isAdmin, handleClockIn, handleLogout, isCheckedIn, currentStatus, user }) {
  return (
<aside className="flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden bg-slate-900 px-6 py-3"> 
         <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dark text-primary-foreground ring-2 ring-white ring-offset-2 ring-offset-black dark:bg-slate-900/10 text-white">
            <span className="text-sm font-extrabold">≫</span>
          </div>
          <div>
            <p className="text-lg font-bold leading-tight text-white">TEAMORA</p>
          </div>
        </div>
        <button type="button" className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden" onClick={closeMobile} aria-label="Close sidebar">
          <X className="h-5 w-5" />
        </button>
      </div>
<nav className="mt-3 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain pl-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">    
          {items.map((item) => (
          <NavItem key={item.label} {...item} active={pathname.startsWith(item.href)} />
        ))}
      </nav>
<div className="mt-auto shrink-0 border-t border-white/10 pl-4 pt-1 pb-2">
  <NavItem
    icon={Settings}
    label="Settings"
    href="/profile"
    active={pathname === "/profile"}
  />
{!isAdmin && (
    <>
      <div className="-ml-4">
        <Button
          className="w-full bg-blue-600 hover:bg-blue-600/90 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleClockIn}
          disabled={isCheckedIn}
          title={isCheckedIn ? `Already ${currentStatus}` : undefined}
        >
          {isCheckedIn ? currentStatus : "Clock In Now"}
        </Button>
      </div>
  <NavItem
        icon={HelpCircle}
        label="Help Center"
        href="/support"
        active={pathname === "/support"}
      />
    </>
  )}
<button
    type="button"
    onClick={handleLogout}
className="flex min-h-[44px] w-full shrink-0 items-center gap-3 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-[#1E293B] hover:text-white"  >
    <LogOut className="h-[18px] w-[18px] shrink-0" />
    <span>Logout</span>
  </button>
</div>
</aside>
  );
}

export default function MasterSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === "admin";
  const items = getNavItemsForRole(user?.role);

  const [currentStatus, setCurrentStatus] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  function refreshStatus() {
    if (isAdmin) return;
    employeeDashboardApi.getStatus().then((data) => setCurrentStatus(data?.state)).catch(() => {});
  }

  useEffect(() => {
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isAdmin]);

  useEffect(() => {
    function handleToggle() {
      setMobileOpen((value) => !value);
    }

    function handleOpen() {
      setMobileOpen(true);
    }

    function handleClose() {
      setMobileOpen(false);
    }

    window.addEventListener("teamora:toggle-sidebar", handleToggle);
    window.addEventListener("teamora:open-sidebar", handleOpen);
    window.addEventListener("teamora:close-sidebar", handleClose);

    return () => {
      window.removeEventListener("teamora:toggle-sidebar", handleToggle);
      window.removeEventListener("teamora:open-sidebar", handleOpen);
      window.removeEventListener("teamora:close-sidebar", handleClose);
    };
  }, []);

  const isCheckedIn = CHECKED_IN_STATES.includes(currentStatus);

  async function handleClockIn() {
    if (isCheckedIn) return;
    if (user?.employeeId) {
      await attendanceApi.checkIn(user.employeeId).catch(() => {});
    }
    refreshStatus();
    navigate("/employee-dashboard");
  }

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <>
<div className="hidden lg:flex h-dvh w-[280px] shrink-0">
            <SidebarContent
          pathname={pathname}
          closeMobile={() => setMobileOpen(false)}
          items={items}
          isAdmin={isAdmin}
          handleClockIn={handleClockIn}
          handleLogout={handleLogout}
          isCheckedIn={isCheckedIn}
          currentStatus={currentStatus}
          user={user}
        />
      </div>


<aside
  className={`fixed inset-y-0 left-0 z-50 flex h-dvh max-h-dvh w-[280px] min-h-0 shrink-0 transform overflow-hidden bg-slate-900 transition-transform duration-300 ease-in-out lg:hidden ${
    mobileOpen ? "translate-x-0" : "-translate-x-full"
  }`}
>
        <SidebarContent
          pathname={pathname}
          closeMobile={() => setMobileOpen(false)}
          items={items}
          isAdmin={isAdmin}
          handleClockIn={handleClockIn}
          handleLogout={handleLogout}
          isCheckedIn={isCheckedIn}
          currentStatus={currentStatus}
          user={user}
        />
      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
          aria-label="Close sidebar overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
