"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, CardDescription, CardTitle } from "@socialbd/ui";

import { usePreferences } from "@/components/preferences/preferences-provider";
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
  const { t } = usePreferences();
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
        t("invite.wrongEmail", {
          signedIn: session.user.email ?? "",
          invited: invitedEmail,
        }),
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
        const message = acceptError.message ?? t("invite.couldNotAccept");
        if (message.toLowerCase().includes("verif")) {
          setError(`${message}${t("invite.verifyAccept")}`);
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
    t,
  ]);

  if (sessionPending || status === "accepting") {
    return (
      <Card>
        <CardTitle>{t("invite.joiningTitle")}</CardTitle>
        <CardDescription>{t("invite.joiningDesc")}</CardDescription>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/80">
        <CardTitle>{t("invite.errorTitle")}</CardTitle>
        <CardDescription className="mt-2 whitespace-pre-wrap text-sm">{error}</CardDescription>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`/login?next=${encodeURIComponent(`/accept-invitation/${invitationId}`)}`}>
            <Button type="button" size="sm">
              {t("invite.signInInvited")}
            </Button>
          </Link>
          <Link
            href={`/signup?next=${encodeURIComponent(`/accept-invitation/${invitationId}`)}`}
          >
            <Button type="button" variant="outline" size="sm">
              {t("invite.createAccount")}
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>{t("invite.almostThere")}</CardTitle>
      <CardDescription>{t("invite.redirecting")}</CardDescription>
    </Card>
  );
}
