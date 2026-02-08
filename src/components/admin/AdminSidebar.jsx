import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Bike,
  RotateCcw,
  Repeat,
  BarChart3,
  LogOut,
  Menu,
  X,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { signOut } from "firebase/auth";

import { auth } from "../../config/firebase";
import { clearAuthSession } from "../../utils/authSession";

import logo from "../../assets/logo.png";

export default function AdminSidebar() {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("evegah.admin.sidebarCollapsed.v1");
      if (raw === "1") setCollapsed(true);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("evegah.admin.sidebarCollapsed.v1", collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty(
      "--admin-sidebar-width",
      collapsed ? "5rem" : "16rem"
    );
    return () => {
      document.documentElement.style.removeProperty("--admin-sidebar-width");
    };
  }, [collapsed]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width: 640px)");
    const sync = () => setOpen(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  const handleLogout = async () => {
    try {
      clearAuthSession();
      await signOut(auth);
    } catch {
      // ignore
    } finally {
      setOpen(false);
      navigate("/", { replace: true });
    }
  };

  const linkClass = ({ isActive }) =>
    `group relative flex items-center ${collapsed ? "justify-center" : "gap-3"} ${collapsed ? "px-3" : "px-4"} py-3 rounded-xl text-sm font-semibold transition-all duration-300 overflow-visible ${isActive
      ? "active bg-evegah-primary text-white shadow-lg border border-white/30"
      : "text-slate-600 hover:bg-gradient-to-r hover:from-brand-light/60 hover:to-white hover:text-slate-800 hover:shadow-md hover:border hover:border-evegah-border"
    }`;

  return (
    <>
      {/* Mobile toggle (shows only when sidebar is closed) */}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="sm:hidden fixed top-6 right-6 z-30 w-14 h-14 rounded-3xl bg-evegah-primary backdrop-blur-xl border border-white/30 shadow-2xl grid place-items-center text-white hover:scale-110 transition-all duration-300"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      ) : null}

      {/* Backdrop for mobile */}
      {open ? (
        <button
          type="button"
          className="sm:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          aria-label="Close menu backdrop"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed top-0 left-0 z-40 ${collapsed ? "w-20" : "w-64"} shrink-0 bg-white border-r border-slate-200 min-h-screen h-screen ${collapsed ? "px-3" : "px-5"} pt-6 flex flex-col overflow-hidden transform transition-all duration-500 shadow-xl ${open ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
          }`}
        style={{ minHeight: "100%", height: "100%" }}
      >

        <div className="relative z-10 mb-6">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <img
                  src={logo}
                  alt="eVEGAH"
                  className="h-18 w-auto object-contain"
                />
              </div>

              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="hidden sm:grid w-10 h-10 rounded-xl bg-white grid place-items-center text-slate-700 hover:bg-slate-50 transition-all duration-300 border border-slate-200 shrink-0"
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="sm:hidden w-10 h-10 rounded-xl bg-white/50 backdrop-blur-sm grid place-items-center text-slate-700 hover:bg-white/80 transition-all duration-300 border border-white/30 shrink-0"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <img
                src={logo}
                alt="eVEGAH"
                className="h-10 w-auto object-contain"
              />

              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="hidden sm:grid w-10 h-10 rounded-xl bg-white grid place-items-center text-slate-700 hover:bg-slate-50 transition-all duration-300 border border-slate-200 shrink-0"
                aria-label="Expand sidebar"
                title="Expand sidebar"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        <nav className="relative z-10 space-y-1 flex-1 min-h-0 overflow-x-hidden overflow-y-auto pr-1 bg-white">
          <div className="mb-4">
            {!collapsed ? (
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 mb-2">Dashboard</h3>
            ) : null}
            <NavLink
              to="/admin/dashboard"
              className={linkClass}
              onClick={() => setOpen(false)}
              title={collapsed ? "Dashboard" : undefined}
            >
              <div className="w-9 h-9 shrink-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-lg flex items-center justify-center border border-blue-400/30 group-hover:from-blue-500/30 group-hover:to-indigo-500/30 group-hover:border-blue-400/50 transition-all duration-300 group-[.active]:from-white/25 group-[.active]:to-white/25 group-[.active]:border-white/40">
                <LayoutDashboard size={18} className="size-[18px] text-blue-600 group-hover:text-blue-700 group-[.active]:!text-white transition-colors duration-300" />
              </div>
              {!collapsed ? (
                <div className="flex-1 min-w-0">
                  <span className="block font-semibold">Dashboard</span>
                  <span className="block text-xs opacity-75">Overview & KPIs</span>
                </div>
              ) : null}
            </NavLink>
          </div>

          <div className="mb-4">
            {!collapsed ? (
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 mb-2">Management</h3>
            ) : null}
            <div className="space-y-1">
              <NavLink
                to="/admin/users"
                className={linkClass}
                onClick={() => setOpen(false)}
                title={collapsed ? "Employee" : undefined}
              >
                <div className="w-9 h-9 shrink-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg flex items-center justify-center border border-emerald-400/30 group-hover:from-emerald-500/30 group-hover:to-teal-500/30 group-hover:border-emerald-400/50 transition-all duration-300 group-[.active]:from-white/25 group-[.active]:to-white/25 group-[.active]:border-white/40">
                  <UserCog size={18} className="text-emerald-600 group-hover:text-emerald-700 group-[.active]:!text-white transition-colors duration-300" />
                </div>
                {!collapsed ? (
                  <div className="flex-1 min-w-0">
                    <span className="block font-semibold">Employee</span>
                    <span className="block text-xs opacity-75">Management</span>
                  </div>
                ) : null}
              </NavLink>

              <NavLink
                to="/admin/riders"
                className={linkClass}
                onClick={() => setOpen(false)}
                title={collapsed ? "Riders" : undefined}
              >
                <div className="w-9 h-9 shrink-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg flex items-center justify-center border border-orange-400/30 group-hover:from-orange-500/30 group-hover:to-red-500/30 group-hover:border-orange-400/50 transition-all duration-300 group-[.active]:from-white/25 group-[.active]:to-white/25 group-[.active]:border-white/40">
                  <Users size={18} className="text-orange-600 group-hover:text-orange-700 group-[.active]:!text-white transition-colors duration-300" />
                </div>
                {!collapsed ? (
                  <div className="flex-1 min-w-0">
                    <span className="block font-semibold">Riders</span>
                    <span className="block text-xs opacity-75">Rider Profile  </span>
                  </div>
                ) : null}
              </NavLink>

              <NavLink
                to="/admin/rentals"
                className={linkClass}
                onClick={() => setOpen(false)}
                title={collapsed ? "Rentals" : undefined}
              >
                <div className="w-9 h-9 shrink-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-cyan-400/30 group-hover:from-cyan-500/30 group-hover:to-blue-500/30 group-hover:border-cyan-400/50 transition-all duration-300 group-[.active]:from-white/25 group-[.active]:to-white/25 group-[.active]:border-white/40">
                  <Bike size={18} className="text-cyan-600 group-hover:text-cyan-700 group-[.active]:!text-white transition-colors duration-300" />
                </div>
                {!collapsed ? (
                  <div className="flex-1 min-w-0">
                    <span className="block font-semibold">Rentals</span>
                    <span className="block text-xs opacity-75">Active Rentals</span>
                  </div>
                ) : null}
              </NavLink>

              <NavLink
                to="/admin/returns"
                className={linkClass}
                onClick={() => setOpen(false)}
                title={collapsed ? "Returns" : undefined}
              >
                <div className="w-9 h-9 shrink-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-violet-400/30 group-hover:from-violet-500/30 group-hover:to-purple-500/30 group-hover:border-violet-400/50 transition-all duration-300 group-[.active]:from-white/25 group-[.active]:to-white/25 group-[.active]:border-white/40">
                  <RotateCcw size={18} className="text-violet-600 group-hover:text-violet-700 group-[.active]:!text-white transition-colors duration-300" />
                </div>
                {!collapsed ? (
                  <div className="flex-1 min-w-0">
                    <span className="block font-semibold">Returns</span>
                    <span className="block text-xs opacity-75">Vehicle Returns</span>
                  </div>
                ) : null}
              </NavLink>

              <NavLink
                to="/admin/battery-swaps"
                className={linkClass}
                onClick={() => setOpen(false)}
                title={collapsed ? "Battery Swaps" : undefined}
              >
                <div className="w-9 h-9 shrink-0 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-lg flex items-center justify-center border border-pink-400/30 group-hover:from-pink-500/30 group-hover:to-rose-500/30 group-hover:border-pink-400/50 transition-all duration-300 group-[.active]:from-white/25 group-[.active]:to-white/25 group-[.active]:border-white/40">
                  <Repeat size={18} className="text-pink-600 group-hover:text-pink-700 group-[.active]:!text-white transition-colors duration-300" />
                </div>
                {!collapsed ? (
                  <div className="flex-1 min-w-0">
                    <span className="block font-semibold">Battery Swaps</span>
                    <span className="block text-xs opacity-75">Battery Management</span>
                  </div>
                ) : null}
              </NavLink>
            </div>
          </div>

          <div className="mb-4">
            {!collapsed ? (
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 mb-2">Analytics</h3>
            ) : null}
            <NavLink
              to="/admin/analytics"
              className={linkClass}
              onClick={() => setOpen(false)}
              title={collapsed ? "Analytics" : undefined}
            >
              <div className="w-9 h-9 shrink-0 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-lg flex items-center justify-center border border-amber-400/30 group-hover:from-amber-500/30 group-hover:to-yellow-500/30 group-hover:border-amber-400/50 transition-all duration-300 group-[.active]:from-white/25 group-[.active]:to-white/25 group-[.active]:border-white/40">
                <BarChart3 size={18} className="text-amber-600 group-hover:text-amber-700 group-[.active]:!text-white transition-colors duration-300" />
              </div>
              {!collapsed ? (
                <div className="flex-1 min-w-0">
                  <span className="block font-semibold">Analytics</span>
                  <span className="block text-xs opacity-75">Reports & Insights</span>
                </div>
              ) : null}
            </NavLink>
          </div>
        </nav>

        <div className="relative z-10 pt-3 pb-4 shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-500/5 hover:text-red-500 hover:backdrop-blur-sm transition-all duration-300 font-semibold border border-red-500/20 hover:border-red-400/40 group"
            title={collapsed ? "Logout" : undefined}
          >
            <div className="w-9 h-9 shrink-0 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-lg flex items-center justify-center border border-red-400/30 group-hover:shadow-lg transition-all duration-300">
              <LogOut size={18} className="text-red-500" />
            </div>
            {!collapsed ? (
              <div className="flex-1 text-left">
                <span className="block font-semibold">Logout</span>
                <span className="block text-xs opacity-75">Sign out of portal</span>
              </div>
            ) : null}
          </button>
        </div>
      </aside>
    </>
  );
}
