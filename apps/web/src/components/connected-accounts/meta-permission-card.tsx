"use client";

import { Card, CardDescription, CardTitle } from "@socialbd/ui";

import { usePreferences } from "@/components/preferences/preferences-provider";

type MetaPermissionCardProps = {
  usesLoginConfig: boolean;
};

export function MetaPermissionCard({ usesLoginConfig }: MetaPermissionCardProps) {
  const { t } = usePreferences();

  return (
    <Card className="border-amber-200 bg-amber-50/80">
      <CardTitle className="text-base">{t("accounts.metaReconnectTitle")}</CardTitle>
      <CardDescription className="space-y-2 text-sm">
        <p>{t("accounts.metaReconnectBody")}</p>
        <p>{usesLoginConfig ? t("accounts.metaReconnectConfig") : t("accounts.metaReconnectEnv")}</p>
        <p>{t("accounts.metaReconnectAction")}</p>
      </CardDescription>
    </Card>
  );
}
