import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

import EmployeeTopbar from "../EmployeeTopbar";
import EmployeeSidebar from "../EmployeeSidebar";
import { auth } from "../../config/firebase";
import { clearAuthSession } from "../../utils/authSession";

export default function EmployeeLayout({ children, showSidebar = true }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    try {
      clearAuthSession();
      await signOut(auth);
    } catch {
      // ignore
    }
    setSidebarOpen(false);
    navigate("/", { replace: true });
  }, [navigate]);

  const openSidebar = () => {
    if (!showSidebar) return;
    setSidebarOpen(true);
  };

  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    if (sidebarOpen) {
      setSidebarVisible(true);
      return;
    }
    if (!sidebarVisible) return;
    const timeout = setTimeout(() => setSidebarVisible(false), 300);
    return () => clearTimeout(timeout);
  }, [sidebarOpen, sidebarVisible]);

  return (
    <div className="min-h-screen flex bg-evegah-bg">
        <div className="flex-1 flex flex-col overflow-hidden">
        <EmployeeTopbar
          onSidebarToggle={openSidebar}
          showSidebarButton={showSidebar}
          isSidebarOpen={sidebarOpen}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="space-y-6">{children}</div>
        </main>
      </div>

      {showSidebar && sidebarVisible ? (
        <div
          className={`fixed inset-0 z-50 flex lg:hidden ${
            sidebarOpen ? "" : "pointer-events-none"
          }`}
        >
          <button
            type="button"
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${
              sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-label="Close navigation"
            onClick={closeSidebar}
          />
          <div className="relative flex h-full w-full justify-end">
            <div
              className={`h-full w-72 transform transition-transform duration-300 ease-out ${
                sidebarOpen ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <EmployeeSidebar
                isMobile
                onClose={closeSidebar}
                onLogout={async () => {
                  closeSidebar();
                  await handleLogout();
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}