import { getInvitationPreview } from "@socialbd/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardDescription, CardTitle } from "@socialbd/ui";

import { AcceptInvitationClient } from "@/components/invitation/accept-invitation-client";
import { getServerTranslator } from "@/lib/i18n/server";

type PageProps = {
  params: Promise<{ invitationId: string }>;
};

export default async function AcceptInvitationPage({ params }: PageProps) {
  const { invitationId } = await params;
  const t = await getServerTranslator();
  const invite = await getInvitationPreview(invitationId);

  if (!invite) {
    notFound();
  }

  if (invite.status !== "pending") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
        <Card>
          <CardTitle>{t("invite.unavailable")}</CardTitle>
          <CardDescription className="mt-2">
            {t("invite.unavailableDesc", { status: invite.status })}
          </CardDescription>
          <p className="mt-4">
            <Link href="/login" className="text-sm font-medium text-primary hover:underline">
              {t("auth.signIn")}
            </Link>
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
      <div className="w-full space-y-4">
        <p className="text-center text-sm text-muted">
          {t("invite.joining", { org: invite.organizationName })}
        </p>
        <AcceptInvitationClient
          invitationId={invitationId}
          organizationId={invite.organizationId}
          invitedEmail={invite.email}
        />
      </div>
    </main>
  );
}
