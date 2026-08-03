"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { usePreferences } from "@/components/preferences/preferences-provider";
import { getDashboardNavRoutes, isNavActive } from "@/lib/i18n/dashboard-nav";

type MobileNavProps = {
  agentsEnabled?: boolean;
};

export function MobileNav({ agentsEnabled = false }: MobileNavProps) {
  const pathname = usePathname();
  const { t } = usePreferences();
  const routes = getDashboardNavRoutes(agentsEnabled);

  return (
    <nav
      aria-label="Dashboard mobile"
      className="flex gap-2 overflow-x-auto border-b border-border bg-surface px-4 py-3 md:hidden"
    >
      {routes.map((item) => {
        const active = isNavActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap",
              active ? "bg-primary text-white" : "bg-background text-muted",
            ].join(" ")}
          >
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
