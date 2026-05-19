import Link from "next/link";
import { Button, Card, CardDescription, CardTitle } from "@socialbd/ui";

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardTitle>Channels</CardTitle>
          <CardDescription>0 connected — link Facebook, Instagram, or LinkedIn next.</CardDescription>
        </Card>
        <Card>
          <CardTitle>Scheduled</CardTitle>
          <CardDescription>No posts in your queue yet. Open Composer to draft one.</CardDescription>
        </Card>
        <Card>
          <CardTitle>Team</CardTitle>
          <CardDescription>Just you for now. Organizations and invites come next.</CardDescription>
        </Card>
      </section>

      <Card className="border-primary/20 bg-primary/5">
        <CardTitle>Quick start</CardTitle>
        <CardDescription>
          Connect a social account, compose your first post, and schedule it from the calendar.
        </CardDescription>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/dashboard/accounts">
            <Button>Connect accounts</Button>
          </Link>
          <Link href="/dashboard/composer">
            <Button variant="outline">Open composer</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
