"use client";

import { Card, CardTitle } from "@socialbd/ui";

import { usePreferences } from "@/components/preferences/preferences-provider";

export function MetaSetupCard() {
  const { t } = usePreferences();

  return (
    <Card className="border-amber-200 bg-amber-50/80">
      <CardTitle>{t("accounts.metaSetupTitle")}</CardTitle>
      <div className="mt-2 space-y-2 text-sm text-muted">
        <p>{t("accounts.metaSetupEnv")}</p>
        <p>
          <a
            href="https://developers.facebook.com/"
            className="font-medium text-primary underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            {t("accounts.metaSetupLink")}
          </a>
          {" — "}
          {t("accounts.metaSetupSteps")}
        </p>
      </div>
    </Card>
  );
}
