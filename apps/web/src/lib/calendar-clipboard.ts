import type { CalendarPost } from "@socialbd/db";

export type CalendarClipboardItem = {
  postId: string;
  displayAt: string;
};

export type CalendarClipboard = {
  items: CalendarClipboardItem[];
  sourceView: "week" | "month";
};

export function isWeekendDate(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function filterPostsForCopy(
  posts: CalendarPost[],
  range: { from: Date; to: Date },
  excludeWeekends: boolean,
) {
  return posts.filter((post) => {
    const at = post.displayAt;
    if (at < range.from || at > range.to) return false;
    if (excludeWeekends && isWeekendDate(at)) return false;
    return true;
  });
}

export function toClipboardItems(posts: CalendarPost[]): CalendarClipboardItem[] {
  return posts.map((post) => ({
    postId: post.id,
    displayAt: post.displayAt.toISOString(),
  }));
}
