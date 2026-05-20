"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { logoutThunk } from "@/store/slices/authSlice";
import { LogoutModal } from "@/components/common/LogoutModal";

const NAV = [
  {
    label: "Overview",
    items: [
      {
        href: "/",
        label: "Dashboard",
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        ),
        exact: true,
      },
      {
        href: "/analyze",
        label: "Analyze PR",
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z" clipRule="evenodd" />
          </svg>
        ),
      },
      {
        href: "/pr-analyses",
        label: "PR Analyses",
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        ),
      },
      {
        href: "/profile",
        label: "My Profile",
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Admin",
    adminOnly: true,
    items: [
      {
        href: "/users",
        label: "Users",
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        ),
      },
      {
        href: "/activity-log",
        label: "Activity Logs",
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        ),
      },
      {
        href: "/context",
        label: "Repository Context",
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        ),
      },
    ],
  },
];

export default function Sidebar({ 
  role, 
  name, 
  email, 
  isCollapsed, 
  onToggle 
}: { 
  role: string; 
  name: string; 
  email: string;
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await dispatch(logoutThunk());
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const formatRole = (role: string) => {
    if (role === "ADMIN") return "Admin";
    if (role === "USER") return "User";
    return role;
  };

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (email?.[0] || "U").toUpperCase();

  return (
    <>
      <aside className={`app-sidebar ${isCollapsed ? "collapsed" : ""}`}>
        <Link href="/" className="sidebar-brand">
          <div className="sidebar-brand-icon">S</div>
          <span className="sidebar-brand-name">Sentra</span>
        </Link>

        <button 
          className="sidebar-toggle"
          onClick={onToggle}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            {isCollapsed ? (
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            )}
          </svg>
        </button>

        <nav className="sidebar-nav">
          {NAV.map((section) => {
            if (section.adminOnly && role !== "ADMIN") return null;
            return (
              <div key={section.label}>
                {!isCollapsed && <div className="nav-section-label">{section.label}</div>}
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link ${isActive(item.href, item.exact) ? "active" : ""}`}
                    title={isCollapsed ? item.label : ""}
                  >
                    {item.icon}
                    <span className="nav-link-text">{item.label}</span>
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            {!isCollapsed && (
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{name || email}</div>
                <div className="sidebar-user-role">{formatRole(role)}</div>
              </div>
            )}
          </div>
          <button 
            className="logout-btn" 
            onClick={() => setShowLogoutModal(true)}
            title={isCollapsed ? "Sign out" : ""}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            <span className="logout-btn-text">Sign out</span>
          </button>
        </div>
      </aside>
      
      {/* Logout Confirmation Modal */}
      <LogoutModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        loading={loggingOut}
      />
      
      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div 
          className="sidebar-overlay"
          onClick={onToggle}
        />
      )}
    </>
  );
}
