"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, Card, CardDescription, CardTitle } from "@socialbd/ui";

import type { PublicConnectedAccount } from "@/lib/connected-accounts";
import { getPlatformLabel } from "@/lib/platform-labels";

import { META_ANALYTICS_SCOPE, tokenHasScope } from "@/lib/meta/permissions";

import { MetaPermissionCard } from "./meta-permission-card";
import { MetaSetupCard } from "./meta-setup-card";

const ERROR_MESSAGES: Record<string, string> = {
  meta_not_configured: "Meta credentials are missing on the server.",
  meta_denied: "Facebook login was cancelled or denied.",
  meta_invalid_callback: "Invalid response from Facebook. Try connecting again.",
  meta_invalid_state: "Session expired. Start the connection again.",
  meta_no_pages: "No Facebook Pages found for this account. You need admin access to at least one Page.",
  meta_sync_failed: "Could not save your Pages. Check server logs and Meta app settings.",
};

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
  const searchParams = useSearchParams();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const banner = useMemo(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected) {
      return {
        type: "success" as const,
        message: `Connected ${connected} Facebook Page${connected === "1" ? "" : "s"}.`,
      };
    }

    if (error) {
      return {
        type: "error" as const,
        message: ERROR_MESSAGES[error] ?? "Something went wrong connecting Facebook.",
      };
    }

    return null;
  }, [searchParams]);

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
        <CardTitle>Facebook Pages</CardTitle>
        <CardDescription>
          Connect Pages you manage on Facebook. Instagram and LinkedIn will follow in a later release.
        </CardDescription>
        <div className="mt-4 flex flex-wrap gap-3">
          {metaConfigured ? (
            <Button
              type="button"
              onClick={() => {
                window.location.href = "/api/meta/connect";
              }}
            >
              Connect Facebook
            </Button>
          ) : (
            <Button disabled>Connect Facebook</Button>
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
                    {getPlatformLabel(account.platform)}
                    {account.username ? ` · @${account.username}` : null}
                  </p>
                  {account.platform === "facebook_page" && account.scopes ? (
                    <p className="text-xs text-muted">
                      Token scopes: {account.scopes}
                      {!tokenHasScope(account.scopes, META_ANALYTICS_SCOPE)
                        ? " · missing pages_read_engagement"
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
                {pendingId === account.id ? "Disconnecting..." : "Disconnect"}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No channels connected yet for this workspace.</p>
      )}
    </div>
  );
}

