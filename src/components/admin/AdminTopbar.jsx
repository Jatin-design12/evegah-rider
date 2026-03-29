import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  MessageSquare,
  Moon,
  Maximize2,
  Settings,
  Menu,
  LogOut,
  User,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";
import { clearAuthSession } from "../../utils/authSession";
import logo from "../../assets/logo.png";

const BRAND_PURPLE = "#2A195C";

export default function AdminTopbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  /* Close profile dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const handleLogout = async () => {
    try {
      clearAuthSession();
      await signOut(auth);
    } catch {
      // ignore
    } finally {
      navigate("/", { replace: true });
    }
  };

  const iconBtnStyle = {
    width: "2.25rem",
    height: "2.25rem",
    borderRadius: "0.5rem",
    border: "none",
    background: "transparent",
    display: "grid",
    placeItems: "center",
    color: "#64748b",
    cursor: "pointer",
    transition: "all 0.15s ease",
    position: "relative",
  };

  const iconBtnHover = (e) => {
    e.currentTarget.style.background = "#f1f5f9";
    e.currentTarget.style.color = BRAND_PURPLE;
  };
  const iconBtnLeave = (e) => {
    e.currentTarget.style.background = "transparent";
    e.currentTarget.style.color = "#64748b";
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        width: "100%",
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid #e5e7eb",
        padding: "0 1.5rem",
        height: "3.75rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      {/* Hamburger for mobile / sidebar toggle */}
      <button
        type="button"
        onClick={onToggleSidebar}
        style={{
          ...iconBtnStyle,
          marginRight: "0.25rem",
        }}
        className="sm:hidden"
        onMouseEnter={iconBtnHover}
        onMouseLeave={iconBtnLeave}
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      {/* ── Logo Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginRight: "1rem" }} className="hidden sm:flex">
        <img
          src={logo}
          alt="eVEGAH"
          style={{
            height: "2.2rem",
            width: "auto",
            objectFit: "contain",
          }}
        />
        <span
          style={{
            fontSize: "1.25rem",
            fontWeight: 800,
            color: BRAND_PURPLE,
            letterSpacing: "-0.02em",
          }}
        >
          Admin
        </span>
      </div>


      {/* Search Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "0.625rem",
          padding: "0 0.75rem",
          height: "2.25rem",
          width: "100%",
          maxWidth: "22rem",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#a78bfa";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(167,139,250,0.15)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#e2e8f0";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <Search size={16} style={{ color: "#94a3b8", flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: "0.825rem",
            color: "#334155",
            width: "100%",
            height: "100%",
          }}
        />
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right-side icon buttons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
        }}
      >
        {/* Dark mode toggle (placeholder) */}
        <button
          type="button"
          style={iconBtnStyle}
          onMouseEnter={iconBtnHover}
          onMouseLeave={iconBtnLeave}
          title="Toggle dark mode"
          aria-label="Toggle dark mode"
        >
          <Moon size={18} />
        </button>

        {/* Notifications */}
        <button
          type="button"
          style={iconBtnStyle}
          onMouseEnter={iconBtnHover}
          onMouseLeave={iconBtnLeave}
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {/* Badge dot */}
          <span
            style={{
              position: "absolute",
              top: "0.3rem",
              right: "0.3rem",
              width: "0.45rem",
              height: "0.45rem",
              borderRadius: "50%",
              background: "#ef4444",
              border: "2px solid #fff",
            }}
          />
        </button>

        {/* Messages */}
        <button
          type="button"
          style={iconBtnStyle}
          onMouseEnter={iconBtnHover}
          onMouseLeave={iconBtnLeave}
          title="Messages"
          aria-label="Messages"
        >
          <MessageSquare size={18} />
        </button>

        {/* Fullscreen */}
        <button
          type="button"
          style={iconBtnStyle}
          onMouseEnter={iconBtnHover}
          onMouseLeave={iconBtnLeave}
          onClick={handleFullscreen}
          title="Fullscreen"
          aria-label="Fullscreen"
        >
          <Maximize2 size={18} />
        </button>

        {/* Settings */}
        <button
          type="button"
          style={iconBtnStyle}
          onMouseEnter={iconBtnHover}
          onMouseLeave={iconBtnLeave}
          title="Settings"
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>

        {/* Divider */}
        <div
          style={{
            width: "1px",
            height: "1.5rem",
            background: "#e5e7eb",
            margin: "0 0.4rem",
          }}
        />

        {/* Profile Avatar */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setShowProfileMenu((p) => !p)}
            style={{
              width: "2.25rem",
              height: "2.25rem",
              borderRadius: "50%",
              border: "2px solid #e5e7eb",
              background: `linear-gradient(135deg, ${BRAND_PURPLE} 0%, #6c3fad 100%)`,
              display: "grid",
              placeItems: "center",
              color: "#fff",
              cursor: "pointer",
              transition: "border-color 0.15s ease",
              padding: 0,
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = BRAND_PURPLE;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
            title="Profile"
            aria-label="Profile menu"
          >
            <User size={16} />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 0.5rem)",
                right: 0,
                width: "12rem",
                background: "#fff",
                borderRadius: "0.75rem",
                boxShadow:
                  "0 10px 40px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)",
                border: "1px solid #f1f5f9",
                padding: "0.375rem",
                zIndex: 50,
                animation: "topbarDropIn 0.15s ease",
              }}
            >
              <button
                type="button"
                onClick={() => setShowProfileMenu(false)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  background: "transparent",
                  fontSize: "0.825rem",
                  color: "#334155",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <User size={16} style={{ color: "#64748b" }} />
                Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  handleLogout();
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  background: "transparent",
                  fontSize: "0.825rem",
                  color: "#ef4444",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fef2f2";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <LogOut size={16} style={{ color: "#ef4444" }} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes topbarDropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
}
