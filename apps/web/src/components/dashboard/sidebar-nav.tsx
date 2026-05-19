"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SocialBDLogo } from "@socialbd/ui";

import { dashboardNav, isNavActive } from "@/lib/dashboard-nav";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-surface">
      <div className="border-b border-border px-5 py-5">
        <Link
          href="/dashboard"
          className="inline-flex rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <SocialBDLogo showTagline={false} />
        </Link>
      </div>

      <nav aria-label="Dashboard" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {dashboardNav.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "block rounded-xl px-3 py-2.5 transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-background hover:text-foreground",
              ].join(" ")}
            >
              <span className="block text-sm font-medium">{item.label}</span>
              <span className="mt-0.5 block text-xs opacity-80">{item.description}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-5 py-4">
        <p className="text-xs text-muted">SocialBD MVP</p>
        <p className="text-xs text-muted">Built for Bangladesh</p>
      </div>
    </aside>
  );
}
