"use client";

import { usePathname } from "next/navigation";

import { dashboardNavRoutes } from "./dashboard-nav";
import { usePreferences } from "@/components/preferences/preferences-provider";

export function useDashboardPageMeta() {
  const pathname = usePathname();
  const { t } = usePreferences();

  if (pathname === "/dashboard/workspaces/new") {
    return {
      title: t("nav.newWorkspace"),
      description: t("nav.newWorkspaceDesc"),
    };
  }

  const item = dashboardNavRoutes.find(
    (nav) => nav.href === pathname || pathname.startsWith(`${nav.href}/`),
  );

  if (!item) {
    return {
      title: t("nav.dashboard"),
      description: t("nav.dashboardDesc"),
    };
  }

  return {
    title: t(item.labelKey),
    description: t(item.descriptionKey),
  };
}
