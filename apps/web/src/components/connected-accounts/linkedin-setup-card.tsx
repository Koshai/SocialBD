"use client";

import { Card, CardDescription, CardTitle } from "@socialbd/ui";

import { usePreferences } from "@/components/preferences/preferences-provider";

export function LinkedInSetupCard() {
  const { t } = usePreferences();

  return (
    <Card className="border-sky-200 bg-sky-50/80">
      <CardTitle>{t("accounts.linkedinSetupTitle")}</CardTitle>
      <CardDescription className="space-y-2">
        <p>{t("accounts.linkedinSetupEnv")}</p>
        <p>
          <a
            href="https://www.linkedin.com/developers/apps"
            className="font-medium text-primary underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            {t("accounts.linkedinSetupLink")}
          </a>
          {" — "}
          {t("accounts.linkedinSetupSteps")}
        </p>
      </CardDescription>
    </Card>
  );
}
