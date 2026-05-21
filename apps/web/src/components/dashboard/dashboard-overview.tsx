"use client";

import Link from "next/link";
import { Button, Card, CardDescription, CardTitle } from "@socialbd/ui";

import { usePreferences } from "@/components/preferences/preferences-provider";

export function DashboardOverview() {
  const { t } = usePreferences();

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardTitle>{t("workspace.quickStartTitle")}</CardTitle>
        <CardDescription>{t("workspace.quickStartDesc")}</CardDescription>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/dashboard/accounts">
            <Button>{t("workspace.connectAccounts")}</Button>
          </Link>
          <Link href="/dashboard/composer">
            <Button variant="outline">{t("workspace.openComposer")}</Button>
          </Link>
          <Link href="/dashboard/settings">
            <Button variant="outline">{t("workspace.manageWorkspaces")}</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
