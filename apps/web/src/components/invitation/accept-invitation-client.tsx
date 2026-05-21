"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, CardDescription, CardTitle } from "@socialbd/ui";

import { authClient } from "@/lib/auth-client";

type AcceptInvitationClientProps = {
  invitationId: string;
  organizationId: string;
  invitedEmail: string;
};

export function AcceptInvitationClient({
  invitationId,
  organizationId,
  invitedEmail,
}: AcceptInvitationClientProps) {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"waiting" | "accepting" | "done">("waiting");

  useEffect(() => {
    if (sessionPending) return;

    if (!session?.user) {
      const next = encodeURIComponent(`/accept-invitation/${invitationId}`);
      router.replace(`/login?next=${next}`);
      return;
    }

    const sessionEmail = session.user.email?.toLowerCase();
    if (sessionEmail && sessionEmail !== invitedEmail.toLowerCase()) {
      setError(
        `You are signed in as ${session.user.email}, but this invite was sent to ${invitedEmail}. Sign in with the invited email or create an account using that address.`,
      );
      return;
    }

    let cancelled = false;

    async function accept() {
      setStatus("accepting");
      setError(null);

      const { error: acceptError } = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (cancelled) return;

      if (acceptError) {
        const message = acceptError.message ?? "Could not accept invitation.";
        if (message.toLowerCase().includes("verif")) {
          setError(
            `${message} Open the verification link we emailed you when you signed up, then reload this page.`,
          );
        } else {
          setError(message);
        }
        setStatus("waiting");
        return;
      }

      await authClient.organization.setActive({ organizationId });
      setStatus("done");
      router.replace("/dashboard");
      router.refresh();
    }

    void accept();

    return () => {
      cancelled = true;
    };
  }, [
    invitationId,
    invitedEmail,
    organizationId,
    router,
    session?.user,
    session?.user.email,
    sessionPending,
  ]);

  if (sessionPending || status === "accepting") {
    return (
      <Card>
        <CardTitle>Joining workspace…</CardTitle>
        <CardDescription>Accepting your invitation. Please wait.</CardDescription>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/80">
        <CardTitle>Invitation could not be accepted</CardTitle>
        <CardDescription className="mt-2 whitespace-pre-wrap text-sm">{error}</CardDescription>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`/login?next=${encodeURIComponent(`/accept-invitation/${invitationId}`)}`}>
            <Button type="button" size="sm">
              Sign in with invited email
            </Button>
          </Link>
          <Link
            href={`/signup?next=${encodeURIComponent(`/accept-invitation/${invitationId}`)}`}
          >
            <Button type="button" variant="outline" size="sm">
              Create account
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>Almost there</CardTitle>
      <CardDescription>Redirecting you to the workspace…</CardDescription>
    </Card>
  );
}
