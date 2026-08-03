import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@socialbd/ui";

import { getDashboardNavRoutes } from "@/lib/i18n/dashboard-nav";
import { getServerTranslator } from "@/lib/i18n/server";
import { isAgentsFeatureEnabled } from "@/lib/features/agents";

/** Large card grid of main dashboard destinations (replaces small button strip). */
export async function DashboardNavCards() {
  const t = await getServerTranslator();
  const routes = getDashboardNavRoutes(isAgentsFeatureEnabled()).filter(
    (route) => route.href !== "/dashboard",
  );

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold">{t("dashboard.navCardsTitle")}</h2>
        <p className="mt-1 text-sm text-muted">{t("dashboard.navCardsDesc")}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className="group block rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <CardTitle className="text-base group-hover:text-primary">{t(route.labelKey)}</CardTitle>
            <CardDescription className="mt-2 line-clamp-2">{t(route.descriptionKey)}</CardDescription>
            <span className="mt-4 inline-block text-xs font-medium text-primary opacity-80 group-hover:opacity-100">
              {t("dashboard.open")} →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
