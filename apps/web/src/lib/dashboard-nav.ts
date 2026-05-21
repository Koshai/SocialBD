export type DashboardNavItem = {
  href: string;
  label: string;
  description: string;
};

export const dashboardNav: DashboardNavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    description: "Workspace summary and quick actions",
  },
  {
    href: "/dashboard/composer",
    label: "Composer",
    description: "Draft and schedule posts",
  },
  {
    href: "/dashboard/calendar",
    label: "Calendar",
    description: "Publishing queue and schedule",
  },
  {
    href: "/dashboard/accounts",
    label: "Accounts",
    description: "Connected social channels",
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    description: "Performance insights",
  },
  {
    href: "/dashboard/approvals",
    label: "Approvals",
    description: "Review posts before publishing",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    description: "Profile and workspace preferences",
  },
];

export function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
