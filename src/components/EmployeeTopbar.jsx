import { NavLink } from "react-router-dom";
import {
  BatteryCharging,
  Bike,
  LayoutGrid,
  LogOut,
  Menu,
  RotateCcw,
  UserPlus,
} from "lucide-react";
import logo from "../assets/logo.png";

const navItem =
  "inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-base transition whitespace-nowrap";
const active = "bg-brand-light text-brand-dark font-medium";
const inactive = "text-gray-600 hover:bg-gray-100";

export default function EmployeeTopbar({
  onSidebarToggle,
  showSidebarButton = true,
  isSidebarOpen = false,
  onLogout = () => {},
}) {

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-evegah-border">
      <div className="px-4 sm:px-8 py-3 sm:py-4 grid grid-cols-[auto,1fr,auto] items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:flex-shrink-0">
          <img src={logo} className="h-14 sm:h-24" alt="eVEGAH" />
        </div>

        {/* Desktop nav only */}
        <nav className="hidden sm:block overflow-x-auto">
          <div className="flex items-center justify-start sm:justify-center gap-2 min-w-max">
            <NavLink
              to="/employee/dashboard"
              className={({ isActive }) =>
                `${navItem} ${isActive ? active : inactive}`
              }
            >
              <LayoutGrid size={18} />
              Dashboard
            </NavLink>

            <NavLink
              to="/employee/new-rider"
              className={({ isActive }) =>
                `${navItem} ${isActive ? active : inactive}`
              }
            >
              <UserPlus size={18} />
              New Rider
            </NavLink>

            <NavLink
              to="/employee/retain-rider"
              className={({ isActive }) =>
                `${navItem} ${isActive ? active : inactive}`
              }
            >
              <RotateCcw size={18} />
              Retain Rider
            </NavLink>

            <NavLink
              to="/employee/return-vehicle"
              className={({ isActive }) =>
                `${navItem} ${isActive ? active : inactive}`
              }
            >
              <Bike size={18} />
              Return Vehicle
            </NavLink>

            <NavLink
              to="/employee/battery-swap"
              className={({ isActive }) =>
                `${navItem} ${isActive ? active : inactive}`
              }
            >
              <BatteryCharging size={18} />
              Battery Swap
            </NavLink>
          </div>
        </nav>
        <div className="flex items-center justify-end gap-2">
          {showSidebarButton ? (
            <button
              type="button"
              className={`sm:hidden h-11 w-11 rounded-2xl border border-evegah-border bg-white grid place-items-center text-gray-700 transition-all duration-200 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-brand-primary ${
                isSidebarOpen ? "shadow-lg border-brand-primary" : ""
              }`}
              aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
              aria-expanded={isSidebarOpen}
              onClick={onSidebarToggle}
            >
              <Menu size={18} className={`transition-transform duration-200 ${isSidebarOpen ? "rotate-90" : ""}`} />
            </button>
          ) : null}
          <button
            type="button"
            className="hidden sm:inline-flex items-center gap-2 rounded-2xl border border-evegah-border bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-red-500"
            onClick={onLogout}
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
