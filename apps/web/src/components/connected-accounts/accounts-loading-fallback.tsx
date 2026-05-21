"use client";

import { usePreferences } from "@/components/preferences/preferences-provider";

export function AccountsLoadingFallback() {
  const { t } = usePreferences();
  return <p className="text-sm text-muted">{t("common.loadingAccounts")}</p>;
}
