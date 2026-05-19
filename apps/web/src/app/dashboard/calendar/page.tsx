import { PlaceholderPanel } from "@/components/dashboard/placeholder-panel";

export default function CalendarPage() {
  return (
    <PlaceholderPanel
      title="Calendar coming soon"
      description="View scheduled posts in a week or month view and drag to reschedule. Wired to the BullMQ publish worker when scheduling is ready."
      ctaLabel="Back to overview"
      ctaHref="/dashboard"
    />
  );
}
