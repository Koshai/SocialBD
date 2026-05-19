import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardDescription, CardTitle, SocialBDLogo } from "@socialbd/ui";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <SocialBDLogo showTagline={false} />
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-12">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, {session.user.name}
          </h1>
          <p className="text-muted">You are signed in as {session.user.email}</p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardTitle>Composer</CardTitle>
            <CardDescription>
              Draft and schedule posts across Facebook, Instagram, and LinkedIn.
            </CardDescription>
          </Card>
          <Card>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>
              View your publishing queue and upcoming scheduled content.
            </CardDescription>
          </Card>
        </section>

        <p className="text-sm text-muted">
          <Link href="/" className="text-primary underline-offset-2 hover:underline">
            Back to homepage
          </Link>
        </p>
      </main>
    </div>
  );
}
