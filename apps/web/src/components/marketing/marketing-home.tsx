"use client";

import Link from "next/link";
import { Card, CardDescription, CardTitle, SocialBDLogo } from "@socialbd/ui";

import { AppearanceControls } from "@/components/preferences/appearance-controls";
import { usePreferences } from "@/components/preferences/preferences-provider";

export function MarketingHome() {
  const { t } = usePreferences();

  const features = [
    { title: t("home.scheduleTitle"), body: t("home.scheduleBody") },
    { title: t("home.teamsTitle"), body: t("home.teamsBody") },
    { title: t("home.pricingTitle"), body: t("home.pricingBody") },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <SocialBDLogo showTagline={false} />
          <div className="flex flex-wrap items-center gap-3">
            <AppearanceControls />
            <nav aria-label="Primary" className="flex gap-3">
              <Link
                href="#features"
                className="rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t("home.seeFeatures")}
              </Link>
              <Link
                href="/login"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t("auth.signIn")}
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto flex max-w-6xl flex-1 flex-col justify-center gap-8 px-6 py-20"
      >
        <div className="max-w-2xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t("home.heroTitle")}</h1>
          <p className="text-lg text-muted">{t("home.heroBody")}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/25 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {t("home.startFree")}
            </Link>
            <Link
              href="#features"
              className="rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {t("home.seeFeatures")}
            </Link>
          </div>
        </div>

        <section id="features" aria-labelledby="features-heading" className="grid gap-4 sm:grid-cols-3">
          <h2 id="features-heading" className="sr-only">
            {t("home.featuresHeading")}
          </h2>
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.body}</CardDescription>
            </Card>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted">
        <p>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy Policy
          </Link>
        </p>
        <p className="mt-2">© {new Date().getFullYear()} SocialBD</p>
      </footer>
    </div>
  );
}
