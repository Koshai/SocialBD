"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, Card, CardDescription, CardTitle } from "@socialbd/ui";

import { usePreferences } from "@/components/preferences/preferences-provider";
import type { PublicConnectedAccount } from "@/lib/connected-accounts";
import { getPlatformLabel } from "@/lib/platform-labels";

import { META_ANALYTICS_SCOPE, tokenHasScope } from "@/lib/meta/permissions";

import { getMetaErrorMessage } from "@/lib/i18n/meta-error-message";

import { MetaPermissionCard } from "./meta-permission-card";
import { MetaSetupCard } from "./meta-setup-card";

type ConnectedAccountsPanelProps = {
  accounts: PublicConnectedAccount[];
  metaConfigured: boolean;
  usesLoginConfig: boolean;
};

export function ConnectedAccountsPanel({
  accounts,
  metaConfigured,
  usesLoginConfig,
}: ConnectedAccountsPanelProps) {
  const router = useRouter();
  const { t } = usePreferences();
  const searchParams = useSearchParams();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const banner = useMemo(() => {
    const connected = searchParams.get("connected");
    const instagram = searchParams.get("instagram");
    const error = searchParams.get("error");

    if (connected) {
      const pagePart = t("accounts.connectedPages", { count: connected, plural: connected === "1" ? "" : "s" });
      const igPart =
        instagram && instagram !== "0"
          ? t("accounts.connectedIg", { count: instagram, plural: instagram === "1" ? "" : "s" })
          : "";
      return {
        type: "success" as const,
        message: `${pagePart}${igPart}`.replace(/\.\./g, "."),
      };
    }

    if (error) {
      return {
        type: "error" as const,
        message: getMetaErrorMessage(error, t),
      };
    }

    return null;
  }, [searchParams, t]);

  async function handleDisconnect(accountId: string) {
    setPendingId(accountId);
    const response = await fetch(`/api/connected-accounts/${accountId}`, { method: "DELETE" });
    setPendingId(null);

    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {!metaConfigured ? <MetaSetupCard /> : null}

      {metaConfigured &&
      accounts.some(
        (account) =>
          account.platform === "facebook_page" && !tokenHasScope(account.scopes, META_ANALYTICS_SCOPE),
      ) ? (
        <MetaPermissionCard usesLoginConfig={usesLoginConfig} />
      ) : null}

      {banner ? (
        <p
          role="alert"
          className={
            banner.type === "success"
              ? "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
              : "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          }
        >
          {banner.message}
        </p>
      ) : null}

      <Card>
        <CardTitle>{t("accounts.facebookPages")}</CardTitle>
        <CardDescription>{t("accounts.connectHint")}</CardDescription>
        <div className="mt-4 flex flex-wrap gap-3">
          {metaConfigured ? (
            <Button
              type="button"
              onClick={() => {
                window.location.href = "/api/meta/connect";
              }}
            >
              {t("accounts.connectFacebook")}
            </Button>
          ) : (
            <Button disabled>{t("accounts.connectFacebook")}</Button>
          )}
        </div>
      </Card>

      {accounts.length > 0 ? (
        <ul className="space-y-3">
          {accounts.map((account) => (
            <li
              key={account.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                {account.pictureUrl ? (
                  <img
                    src={account.pictureUrl}
                    alt=""
                    className="h-11 w-11 rounded-lg border border-border object-cover"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary"
                  >
                    {account.displayName.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div>
                  <p className="font-medium">{account.displayName}</p>
                  <p className="text-sm text-muted">
                    {getPlatformLabel(account.platform, t)}
                    {account.username ? ` · @${account.username}` : null}
                  </p>
                  {account.platform === "facebook_page" && account.scopes ? (
                    <p className="text-xs text-muted">
                      {t("common.tokenScopes")}: {account.scopes}
                      {!tokenHasScope(account.scopes, META_ANALYTICS_SCOPE)
                        ? t("common.missingEngagementScope")
                        : null}
                    </p>
                  ) : null}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pendingId === account.id}
                onClick={() => handleDisconnect(account.id)}
              >
                {pendingId === account.id ? t("accounts.disconnecting") : t("accounts.disconnect")}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">{t("accounts.noChannels")}</p>
      )}
    </div>
  );
}

