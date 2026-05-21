"use client";

import { useState } from "react";
import { Button, Card, CardDescription, CardTitle } from "@socialbd/ui";

import { authClient } from "@/lib/auth-client";
import { buildInvitationAcceptUrl } from "@/lib/invitation-email";

type WorkspaceTeamInviteProps = {
  organizationId: string;
  canInvite: boolean;
};

export function WorkspaceTeamInvite({ organizationId, canInvite }: WorkspaceTeamInviteProps) {
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

    const { data, error: inviteError } = await authClient.organization.inviteMember({
      email: email.trim(),
      role: "member",
      organizationId,
    });

    setPending(false);

    if (inviteError) {
      setError(inviteError.message ?? "Could not send invitation.");
      return;
    }

    const invitationId =
      data && typeof data === "object" && "id" in data ? String((data as { id: string }).id) : null;

    const link = invitationId ? buildInvitationAcceptUrl(invitationId) : null;
    setInviteLink(link);
    setSuccess(
      link
        ? `Invitation created for ${email.trim()}. Share the link below (also printed in your dev server terminal if email is not configured).`
        : `Invitation sent to ${email.trim()}.`,
    );
    setEmail("");
  }

  return (
    <Card>
      <CardTitle>Invite teammate</CardTitle>
      <CardDescription>
        Members can draft and submit posts for approval. They only get access to this workspace.
        Invites are emailed via Resend (set RESEND_API_KEY and EMAIL_FROM). Invitees must verify
        their email before they can accept.
      </CardDescription>
      <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={(e) => void invite(e)}>
        <label className="min-w-[220px] flex-1 space-y-1 text-sm">
          <span className="font-medium">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@example.com"
            className="h-10 w-full rounded-lg border border-border bg-background px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send invite"}
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
          <p className="font-medium text-foreground">Accept link (dev / copy to teammate)</p>
          <p className="mt-1 break-all font-mono text-muted">{inviteLink}</p>
        </div>
      ) : null}
    </Card>
  );
}
