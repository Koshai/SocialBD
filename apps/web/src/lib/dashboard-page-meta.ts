import type { DashboardNavItem } from "./dashboard-nav";
import { dashboardNav } from "./dashboard-nav";

export function getDashboardPageMeta(pathname: string): {
  title: string;
  description?: string;
} {
  const item = dashboardNav.find(
    (nav) => nav.href === pathname || pathname.startsWith(`${nav.href}/`),
  );

  if (pathname === "/dashboard/workspaces/new") {
    return {
      title: "New workspace",
      description: "Create a workspace for a client, brand, or your own team.",
    };
  }

  if (!item) {
    return {
      title: "Dashboard",
      description: "Manage your social channels from one place.",
    };
  }

  return {
    title: item.label,
    description: item.description,
  };
}

export type { DashboardNavItem };
