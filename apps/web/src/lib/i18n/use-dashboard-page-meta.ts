"use client";

import { usePathname } from "next/navigation";

import { dashboardNavRoutes, isNavActive } from "./dashboard-nav";
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

  // Match longest route first so /dashboard does not steal every nested page.
  const item = [...dashboardNavRoutes]
    .sort((a, b) => b.href.length - a.href.length)
    .find((nav) => isNavActive(pathname, nav.href));

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
