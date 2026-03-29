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
  ChevronRight,
} from "lucide-react";

import { signOut } from "firebase/auth";

import { auth } from "../../config/firebase";
import { clearAuthSession } from "../../utils/authSession";

import logo from "../../assets/logo.png";

/* ── Brand colors ── */
const BRAND_PURPLE = "#2A195C";
const BRAND_PURPLE_LIGHT = "#E7E0FF";
const BRAND_PURPLE_SOFT = "#D4C6FF";

export default function AdminSidebar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty(
      "--admin-sidebar-width",
      "15rem"
    );
    return () => {
      document.documentElement.style.removeProperty("--admin-sidebar-width");
    };
  }, []);

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

  /* ── Menu items ── */
  const dashboardItems = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/riders", icon: Users, label: "Riders" },
    { to: "/admin/rentals", icon: Bike, label: "Rentals" },
    { to: "/admin/users", icon: UserCog, label: "Employee" },
    { to: "/admin/returns", icon: RotateCcw, label: "Returns" },
  ];

  const managementItems = [
    { to: "/admin/battery-swaps", icon: Repeat, label: "Battery Swaps" },
    { to: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  ];

  /* ── Render a nav link ── */
  const renderLink = ({ to, icon: Icon, label }) => (
    <NavLink
      key={to}
      to={to}
      onClick={() => setOpen(false)}
      style={{ textDecoration: "none" }}
    >
      {({ isActive }) => (
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.85rem 1rem",
            borderRadius: "0.75rem",
            fontSize: "0.875rem",
            fontWeight: isActive ? 600 : 500,
            color: isActive ? BRAND_PURPLE : "#6b7280",
            background: isActive ? BRAND_PURPLE_LIGHT + "40" : "transparent",
            borderLeft: isActive ? `4px solid ${BRAND_PURPLE}` : "4px solid transparent",
            cursor: "pointer",
            transition: "all 0.2s ease",
            marginBottom: "4px",
          }}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.color = "#374151";
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#6b7280";
            }
          }}
        >

          {/* Icon container */}
          <div
            style={{
              width: "2.25rem",
              height: "2.25rem",
              flexShrink: 0,
              borderRadius: "0.625rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: isActive ? BRAND_PURPLE_LIGHT : "#f3f4f6",
              transition: "all 0.2s ease",
            }}
          >
            <Icon
              size={18}
              style={{
                color: isActive ? BRAND_PURPLE : "#9ca3af",
                transition: "color 0.2s ease",
              }}
            />
          </div>

          <span style={{ flex: 1 }}>{label}</span>

          {/* Chevron on active */}
          {isActive && (
            <ChevronRight
              size={16}
              style={{ color: BRAND_PURPLE, opacity: 0.6 }}
            />
          )}
        </div>
      )}
    </NavLink>
  );

  return (
    <>
      {/* Mobile toggle */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="sm:hidden"
          style={{
            position: "fixed",
            top: "1rem",
            right: "1rem",
            zIndex: 30,
            width: "2.75rem",
            height: "2.75rem",
            borderRadius: "0.75rem",
            background: BRAND_PURPLE,
            border: "none",
            boxShadow: "0 4px 16px rgba(42,25,92,0.35)",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            cursor: "pointer",
          }}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Backdrop for mobile */}
      {open && (
        <button
          type="button"
          className="sm:hidden"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 30,
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(4px)",
            border: "none",
            cursor: "pointer",
          }}
          aria-label="Close menu backdrop"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`admin-sidebar ${open ? "" : "sidebar-closed"}`}
        style={{
          position: "fixed",
          top: "3.75rem",
          left: 0,
          zIndex: 40,
          width: "15rem",
          flexShrink: 0,
          background: "#ffffff",
          minHeight: "calc(100vh - 3.75rem)",
          height: "calc(100vh - 3.75rem)",
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: "2px 0 20px rgba(0,0,0,0.06)",
          borderRight: "1px solid #f0f0f0",
          overflow: "hidden",
        }}
      >

        {/* ── Navigation ── */}
        <nav
          className="admin-sidebar-nav"
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "1rem 1rem 0.5rem",
          }}
        >
          {/* Dashboard section */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h3
              style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                padding: "0 1rem",
                marginBottom: "0.75rem",
              }}
            >
              Dashboard
            </h3>
            {dashboardItems.map(renderLink)}
          </div>

          {/* Management section */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h3
              style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                padding: "0 1rem",
                marginBottom: "0.75rem",
              }}
            >
              Management
            </h3>
            {managementItems.map(renderLink)}
          </div>
        </nav>

        {/* ── Logout ── */}
        <div
          style={{
            padding: "0.5rem 1rem 1.25rem",
            borderTop: "1px solid #f3f4f6",
          }}
        >
          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#ef4444",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fef2f2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <div
              style={{
                width: "2.25rem",
                height: "2.25rem",
                flexShrink: 0,
                borderRadius: "0.625rem",
                background: "#fef2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LogOut size={18} style={{ color: "#ef4444" }} />
            </div>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Sidebar CSS ── */}
      <style>{`
        @media (min-width: 640px) {
          .admin-sidebar.sidebar-closed {
            transform: translateX(0) !important;
          }
        }

        .admin-sidebar-nav::-webkit-scrollbar {
          width: 4px;
        }
        .admin-sidebar-nav::-webkit-scrollbar-track {
          background: transparent;
        }
        .admin-sidebar-nav::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 4px;
        }
        .admin-sidebar-nav::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </>
  );
}
