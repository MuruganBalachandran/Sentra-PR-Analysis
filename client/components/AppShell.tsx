"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchProfile } from "@/store/slices/authSlice";

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];
const NO_SIDEBAR_ROUTES = ["/404", "/not-found"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isAuth = AUTH_ROUTES.includes(pathname);
  const noSidebar = NO_SIDEBAR_ROUTES.includes(pathname);

  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!isAuth && !noSidebar && !user && !hasFetched) {
      setHasFetched(true);
      dispatch(fetchProfile());
    }
  }, [isAuth, noSidebar]);

  if (isAuth || noSidebar) {
    return <>{children}</>;
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar
        role={user?.Role || "USER"}
        name={(user as any)?.Name || ""}
        email={user?.Email || ""}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="app-content">
        <div className="page-body">{children}</div>
      </div>
    </div>
  );
}
