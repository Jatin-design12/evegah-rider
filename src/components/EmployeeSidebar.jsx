import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  UserPlus,
  RotateCcw,
  Bike,
  BatteryCharging,
  LogOut,
  X,
} from "lucide-react";
import logo from "../assets/logo.png";

const navItem =
  "flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition";
const active =
  "bg-brand-light text-brand-dark font-medium";
const inactive =
  "text-gray-600 hover:bg-gray-100";

export default function EmployeeSidebar({ isMobile = false, onClose, onLogout }) {
  return (
    <aside className="relative bg-white border-evegah-border h-full flex flex-col">
      {/* LOGO */}
      <div className="flex items-center justify-between p-5">
        <img src={logo} className="h-24" alt="eVEGAH" />
        {isMobile ? (
          <button
            type="button"
            aria-label="Close menu"
            className="w-10 h-10 rounded-xl grid place-items-center text-gray-700 hover:bg-gray-100"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        ) : null}
      </div>

      {/* NAV */}
      <nav className="px-3 space-y-1 flex-1 overflow-y-auto">
        {[
          ["/employee/dashboard", "Dashboard", LayoutGrid],
          ["/employee/new-rider", "New Rider", UserPlus],
          ["/employee/retain-rider", "Retain Rider", RotateCcw],
          ["/employee/return-vehicle", "Return Vehicle", Bike],
          ["/employee/battery-swap", "Battery Swap", BatteryCharging],
        ].map(([to, label, Icon]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${navItem} ${isActive ? active : inactive}`
            }
            onClick={() => onClose?.()}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* LOGOUT */}
      <div className="p-4">
        <button
          className="flex items-center gap-2 text-red-600 text-sm"
          onClick={onLogout}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      {isMobile && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="absolute -right-3 top-1/2 flex h-20 w-4 -translate-y-1/2 items-center justify-center rounded-l-full bg-evegah-primary text-white shadow-lg focus-visible:outline focus-visible:ring"
          onClick={() => onClose?.()}
        >
          <span className="block h-12 w-px bg-white" />
        </button>
      )}
    </aside>
  );
}

