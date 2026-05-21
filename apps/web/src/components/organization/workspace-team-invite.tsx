"use client";

import { useState } from "react";
import { Button, Card, CardDescription, CardTitle } from "@socialbd/ui";

import { usePreferences } from "@/components/preferences/preferences-provider";
import { authClient } from "@/lib/auth-client";
import { buildInvitationAcceptUrl } from "@/lib/invitation-email";

type WorkspaceTeamInviteProps = {
  organizationId: string;
  canInvite: boolean;
};

export function WorkspaceTeamInvite({ organizationId, canInvite }: WorkspaceTeamInviteProps) {
  const { t } = usePreferences();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!canInvite) {
    return null;
  }

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setInviteLink(null);
    setPending(true);

    const trimmedEmail = email.trim();
    const { data, error: inviteError } = await authClient.organization.inviteMember({
      email: trimmedEmail,
      role: "member",
      organizationId,
    });

    setPending(false);

    if (inviteError) {
      setError(inviteError.message ?? t("workspace.couldNotInvite"));
      return;
    }

    const invitationId =
      data && typeof data === "object" && "id" in data ? String((data as { id: string }).id) : null;

    const link = invitationId ? buildInvitationAcceptUrl(invitationId) : null;
    setInviteLink(link);
    setSuccess(
      link
        ? t("workspace.inviteSuccessLink", { email: trimmedEmail })
        : t("workspace.inviteSuccessEmail", { email: trimmedEmail }),
    );
    setEmail("");
  }

  return (
    <Card>
      <CardTitle>{t("workspace.inviteTitle")}</CardTitle>
      <CardDescription>{t("workspace.inviteDesc")}</CardDescription>
      <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={(e) => void invite(e)}>
        <label className="min-w-[220px] flex-1 space-y-1 text-sm">
          <span className="font-medium">{t("common.email")}</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("workspace.emailPlaceholder")}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? t("workspace.sending") : t("workspace.sendInvite")}
        </Button>
      </form>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      {success ? <p className="mt-3 text-sm text-emerald-700">{success}</p> : null}
      {inviteLink ? (
        <div className="mt-3 rounded-lg border border-border bg-background px-3 py-2 text-xs">
          <p className="font-medium text-foreground">{t("workspace.acceptLinkLabel")}</p>
          <p className="mt-1 break-all font-mono text-muted">{inviteLink}</p>
        </div>
      ) : null}
    </Card>
  );
}
