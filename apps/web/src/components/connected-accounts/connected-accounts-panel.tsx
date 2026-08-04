"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, Card, CardDescription, CardTitle } from "@socialbd/ui";

import { usePreferences } from "@/components/preferences/preferences-provider";
import type { PublicConnectedAccount } from "@/lib/connected-accounts";
import { getMetaErrorMessage } from "@/lib/i18n/meta-error-message";
import { getLinkedInErrorMessage } from "@/lib/linkedin/error-message";
import type { TranslateFn } from "@/lib/i18n/translate";
import { getPlatformLabel } from "@/lib/platform-labels";

import { LinkedInSetupCard } from "./linkedin-setup-card";
import { MetaSetupCard } from "./meta-setup-card";

type ConnectedAccountsPanelProps = {
  accounts: PublicConnectedAccount[];
  metaConfigured: boolean;
  linkedInEnabled: boolean;
  linkedInConfigured: boolean;
  usesLoginConfig: boolean;
  atChannelLimit: boolean;
};

function resolveConnectError(error: string, t: TranslateFn) {
  if (error === "channel_limit") {
    return t("accounts.channelLimitError");
  }
  if (error.startsWith("linkedin_")) {
    return getLinkedInErrorMessage(error, t);
  }
  if (error.startsWith("meta_")) {
    return getMetaErrorMessage(error, t);
  }
  return getMetaErrorMessage(error, t);
}

export function ConnectedAccountsPanel({
  accounts,
  metaConfigured,
  linkedInEnabled,
  linkedInConfigured,
  usesLoginConfig: _usesLoginConfig,
  atChannelLimit,
}: ConnectedAccountsPanelProps) {
  const router = useRouter();
  const { t } = usePreferences();
  const searchParams = useSearchParams();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const banner = useMemo(() => {
    const connected = searchParams.get("connected");
    const instagram = searchParams.get("instagram");
    const linkedInConnected = searchParams.get("linkedin_connected");
    const error = searchParams.get("error");

    if (linkedInConnected && linkedInEnabled) {
      return {
        type: "success" as const,
        message: t("accounts.connectedLinkedIn", {
          count: linkedInConnected,
          plural: linkedInConnected === "1" ? "" : "s",
        }),
      };
    }

    if (connected) {
      const pagePart = t("accounts.connectedPages", {
        count: connected,
        plural: connected === "1" ? "" : "s",
      });
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
      if (!linkedInEnabled && error.startsWith("linkedin_")) {
        return null;
      }
      return {
        type: "error" as const,
        message: resolveConnectError(error, t),
      };
    }

    return null;
  }, [searchParams, t, linkedInEnabled]);

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
      {linkedInEnabled && !linkedInConfigured ? <LinkedInSetupCard /> : null}

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
          {metaConfigured && !atChannelLimit ? (
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
        {atChannelLimit ? (
          <p className="mt-3 text-sm text-amber-800">{t("accounts.channelLimitConnectBlocked")}</p>
        ) : null}
      </Card>

      {linkedInEnabled ? (
        <Card>
          <CardTitle>{t("accounts.linkedinPages")}</CardTitle>
          <CardDescription>{t("accounts.connectHintLinkedIn")}</CardDescription>
          <div className="mt-4 flex flex-wrap gap-3">
            {linkedInConfigured && !atChannelLimit ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  window.location.href = "/api/linkedin/connect";
                }}
              >
                {t("accounts.connectLinkedIn")}
              </Button>
            ) : (
              <Button variant="secondary" disabled>
                {t("accounts.connectLinkedIn")}
              </Button>
            )}
          </div>
        </Card>
      ) : null}

      {accounts.length > 0 ? (
        <ul className="space-y-3">
          {accounts.map((account) => (
            <li
              key={account.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                {account.pictureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
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
                    {account.username ? ` · @${account.username.replace(/^@/, "").split("|")[0]}` : null}
                  </p>
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
