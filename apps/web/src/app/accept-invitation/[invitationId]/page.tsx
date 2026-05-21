import { getInvitationPreview } from "@socialbd/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardDescription, CardTitle } from "@socialbd/ui";

import { AcceptInvitationClient } from "@/components/invitation/accept-invitation-client";

type PageProps = {
  params: Promise<{ invitationId: string }>;
};

export default async function AcceptInvitationPage({ params }: PageProps) {
  const { invitationId } = await params;
  const invite = await getInvitationPreview(invitationId);

  if (!invite) {
    notFound();
  }

  if (invite.status !== "pending") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
        <Card>
          <CardTitle>Invitation unavailable</CardTitle>
          <CardDescription className="mt-2">
            This invitation is no longer active ({invite.status}). Ask your workspace admin to
            send a new invite.
          </CardDescription>
          <p className="mt-4">
            <Link href="/login" className="text-sm font-medium text-primary hover:underline">
              Sign in
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
          You are joining <span className="font-medium text-foreground">{invite.organizationName}</span>
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
