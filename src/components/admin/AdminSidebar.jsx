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
} from "lucide-react";

import { signOut } from "firebase/auth";

import { auth } from "../../config/firebase";
import { clearAuthSession } from "../../utils/authSession";

import logo from "../../assets/logo.png";

export default function AdminSidebar() {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

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
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
      isActive
        ? "bg-blue-50 text-blue-700"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  return (
    <>
      {/* Mobile toggle (shows only when sidebar is closed) */}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="sm:hidden fixed top-4 right-4 z-30 w-11 h-11 rounded-2xl border border-evegah-border bg-white grid place-items-center text-gray-700"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
      ) : null}

      {/* Backdrop for mobile */}
      {open ? (
        <button
          type="button"
          className="sm:hidden fixed inset-0 z-30 bg-black/40"
          aria-label="Close menu backdrop"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed sm:sticky top-0 left-0 z-40 w-72 shrink-0 bg-white border-r border-evegah-border h-screen px-5 py-6 flex flex-col overflow-hidden transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        }`}
      >
        <div className="mb-6 flex items-center gap-3">
          <img src={logo} alt="Evegah" className="h-14 w-auto" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-evegah-text">EV Admin</div>
            <div className="text-xs text-evegah-muted">Management</div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="sm:hidden w-10 h-10 rounded-xl grid place-items-center text-gray-700 hover:bg-gray-100"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto pr-1">
          <NavLink to="/admin/dashboard" className={linkClass} onClick={() => setOpen(false)}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>

          <NavLink to="/admin/users" className={linkClass} onClick={() => setOpen(false)}>
            <UserCog size={18} /> Users
          </NavLink>

          <NavLink to="/admin/riders" className={linkClass} onClick={() => setOpen(false)}>
            <Users size={18} /> Riders
          </NavLink>

          <NavLink to="/admin/rentals" className={linkClass} onClick={() => setOpen(false)}>
            <Bike size={18} /> Rentals
          </NavLink>

          <NavLink to="/admin/returns" className={linkClass} onClick={() => setOpen(false)}>
            <RotateCcw size={18} /> Returns
          </NavLink>

          <NavLink to="/admin/battery-swaps" className={linkClass} onClick={() => setOpen(false)}>
            <Repeat size={18} /> Battery Swaps
          </NavLink>

          <NavLink to="/admin/analytics" className={linkClass} onClick={() => setOpen(false)}>
            <BarChart3 size={18} /> Analytics
          </NavLink>
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>
    </>
  );
}
