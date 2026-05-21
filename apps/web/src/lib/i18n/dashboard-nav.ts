export type DashboardNavRoute = {
  href: string;
  labelKey: string;
  descriptionKey: string;
};

export const dashboardNavRoutes: DashboardNavRoute[] = [
  { href: "/dashboard", labelKey: "nav.overview", descriptionKey: "nav.overviewDesc" },
  { href: "/dashboard/composer", labelKey: "nav.composer", descriptionKey: "nav.composerDesc" },
  { href: "/dashboard/posts", labelKey: "nav.posts", descriptionKey: "nav.postsDesc" },
  { href: "/dashboard/calendar", labelKey: "nav.calendar", descriptionKey: "nav.calendarDesc" },
  { href: "/dashboard/accounts", labelKey: "nav.accounts", descriptionKey: "nav.accountsDesc" },
  { href: "/dashboard/analytics", labelKey: "nav.analytics", descriptionKey: "nav.analyticsDesc" },
  { href: "/dashboard/approvals", labelKey: "nav.approvals", descriptionKey: "nav.approvalsDesc" },
  { href: "/dashboard/settings", labelKey: "nav.settings", descriptionKey: "nav.settingsDesc" },
];

export function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
