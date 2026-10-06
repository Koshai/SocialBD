"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { usePreferences } from "@/components/preferences/preferences-provider";
import {
  getDashboardNavRoutes,
  getMobilePrimaryRoutes,
  getMobileSecondaryRoutes,
  isNavActive,
} from "@/lib/i18n/dashboard-nav";

type MobileNavProps = {
  agentsEnabled?: boolean;
};

export function MobileNav({ agentsEnabled = false }: MobileNavProps) {
  const pathname = usePathname();
  const { t } = usePreferences();
  const [moreOpen, setMoreOpen] = useState(false);
  const panelId = useId();
  const primary = getMobilePrimaryRoutes(agentsEnabled);
  const secondary = getMobileSecondaryRoutes(agentsEnabled);
  const secondaryActive = secondary.some((item) => isNavActive(pathname, item.href));

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [moreOpen]);

  // Fallback: if primary helper missing, show all (shouldn't happen)
  const routes = primary.length ? primary : getDashboardNavRoutes(agentsEnabled);

  return (
    <>
      {moreOpen ? (
        <div className="fixed inset-0 z-40 md:hidden" role="presentation">
          <button
            type="button"
            aria-label={t("nav.closeMenu")}
            className="absolute inset-0 bg-black/40"
            onClick={() => setMoreOpen(false)}
          />
          <div
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.more")}
            className="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-2xl border border-border bg-surface p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] shadow-xl"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{t("nav.moreTitle")}</p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-background hover:text-foreground"
              >
                {t("nav.closeMenu")}
              </button>
            </div>
            <ul className="space-y-1">
              {secondary.map((item) => {
                const active = isNavActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "block rounded-xl px-3 py-3 transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-background",
                      ].join(" ")}
                    >
                      <span className="block text-sm font-medium">{t(item.labelKey)}</span>
                      <span className="mt-0.5 block text-xs text-muted">{t(item.descriptionKey)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}

      <nav
        aria-label={t("nav.mobileNav")}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden"
      >
        <ul className="grid grid-cols-5 gap-0.5 px-1 pt-1">
          {routes.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex min-h-12 flex-col items-center justify-center rounded-lg px-1 py-1.5 text-center text-[11px] font-medium leading-tight",
                    active ? "bg-primary/10 text-primary" : "text-muted",
                  ].join(" ")}
                >
                  <span className="line-clamp-2">{t(item.shortLabelKey ?? item.labelKey)}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-controls={panelId}
              onClick={() => setMoreOpen((value) => !value)}
              className={[
                "flex min-h-12 w-full flex-col items-center justify-center rounded-lg px-1 py-1.5 text-center text-[11px] font-medium leading-tight",
                moreOpen || secondaryActive ? "bg-primary/10 text-primary" : "text-muted",
              ].join(" ")}
            >
              {t("nav.more")}
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
