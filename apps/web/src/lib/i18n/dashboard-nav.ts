export type DashboardNavRoute = {
  href: string;
  labelKey: string;
  descriptionKey: string;
  /** Shorter label for bottom tab bar */
  shortLabelKey?: string;
};

export const dashboardNavRoutes: DashboardNavRoute[] = [
  {
    href: "/dashboard",
    labelKey: "nav.overview",
    descriptionKey: "nav.overviewDesc",
    shortLabelKey: "nav.overviewShort",
  },
  {
    href: "/dashboard/ideas",
    labelKey: "nav.ideas",
    descriptionKey: "nav.ideasDesc",
    shortLabelKey: "nav.ideasShort",
  },
  {
    href: "/dashboard/composer",
    labelKey: "nav.composer",
    descriptionKey: "nav.composerDesc",
    shortLabelKey: "nav.composerShort",
  },
  {
    href: "/dashboard/posts",
    labelKey: "nav.posts",
    descriptionKey: "nav.postsDesc",
    shortLabelKey: "nav.postsShort",
  },
  {
    href: "/dashboard/calendar",
    labelKey: "nav.calendar",
    descriptionKey: "nav.calendarDesc",
    shortLabelKey: "nav.calendarShort",
  },
  {
    href: "/dashboard/accounts",
    labelKey: "nav.accounts",
    descriptionKey: "nav.accountsDesc",
    shortLabelKey: "nav.accountsShort",
  },
  {
    href: "/dashboard/agents",
    labelKey: "nav.agents",
    descriptionKey: "nav.agentsDesc",
    shortLabelKey: "nav.agentsShort",
  },
  {
    href: "/dashboard/analytics",
    labelKey: "nav.analytics",
    descriptionKey: "nav.analyticsDesc",
    shortLabelKey: "nav.analyticsShort",
  },
  {
    href: "/dashboard/approvals",
    labelKey: "nav.approvals",
    descriptionKey: "nav.approvalsDesc",
    shortLabelKey: "nav.approvalsShort",
  },
  {
    href: "/dashboard/settings",
    labelKey: "nav.settings",
    descriptionKey: "nav.settingsDesc",
    shortLabelKey: "nav.settingsShort",
  },
];

/** Primary mobile bottom tabs (4 + More button). */
const MOBILE_PRIMARY_HREFS = [
  "/dashboard",
  "/dashboard/composer",
  "/dashboard/calendar",
  "/dashboard/posts",
] as const;

export function getDashboardNavRoutes(agentsEnabled: boolean) {
  if (agentsEnabled) return dashboardNavRoutes;
  return dashboardNavRoutes.filter((route) => route.href !== "/dashboard/agents");
}

export function getMobilePrimaryRoutes(agentsEnabled: boolean) {
  const routes = getDashboardNavRoutes(agentsEnabled);
  return MOBILE_PRIMARY_HREFS.map((href) => routes.find((route) => route.href === href)).filter(
    (route): route is DashboardNavRoute => Boolean(route),
  );
}

export function getMobileSecondaryRoutes(agentsEnabled: boolean) {
  const primary = new Set<string>(MOBILE_PRIMARY_HREFS);
  return getDashboardNavRoutes(agentsEnabled).filter((route) => !primary.has(route.href));
}

export function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
