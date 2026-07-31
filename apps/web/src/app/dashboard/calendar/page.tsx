import { countScheduledPosts, listCalendarPosts } from "@socialbd/db";

import { PublishingCalendar } from "@/components/calendar/publishing-calendar";
import { endOfWeek, startOfWeek } from "@/lib/calendar";
import { requireActiveOrganization } from "@/lib/dashboard-session";

export default async function CalendarPage() {
  const { organizationId } = await requireActiveOrganization();
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(weekStart);

  const [posts, scheduledCount] = await Promise.all([
    listCalendarPosts(organizationId, weekStart, weekEnd),
    countScheduledPosts(organizationId),
  ]);

  return (
    <PublishingCalendar
      initialWeekStart={weekStart.toISOString()}
      initialPosts={posts}
      initialScheduledCount={scheduledCount}
    />
  );
}
