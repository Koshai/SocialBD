"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardNav, isNavActive } from "@/lib/dashboard-nav";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Dashboard mobile"
      className="flex gap-2 overflow-x-auto border-b border-border bg-surface px-4 py-3 md:hidden"
    >
      {dashboardNav.map((item) => {
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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
