"use client";

import { usePreferences } from "@/components/preferences/preferences-provider";

export function AuthLoadingFallback() {
  const { t } = usePreferences();
  return <p className="p-12 text-center text-sm text-muted">{t("auth.loading")}</p>;
}
