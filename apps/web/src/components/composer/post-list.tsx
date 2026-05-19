import { Card, CardDescription, CardTitle } from "@socialbd/ui";
import type { PostWithChannel } from "@socialbd/db";

import { getPlatformLabel } from "@/lib/platform-labels";

function formatWhen(date: Date | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

type PostListProps = {
  posts: PostWithChannel[];
};

export function PostList({ posts }: PostListProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardTitle>Recent posts</CardTitle>
      <CardDescription>Drafts and scheduled posts for this workspace.</CardDescription>
      <ul className="mt-4 space-y-3">
        {posts.map((item) => (
          <li key={item.id} className="rounded-lg border border-border px-3 py-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium capitalize">{item.status}</span>
              <span className="text-muted">
                {item.channelName} · {getPlatformLabel(item.platform)}
              </span>
            </div>
            <p className="mt-2 line-clamp-3 whitespace-pre-wrap">{item.body}</p>
            {item.scheduledAt ? (
              <p className="mt-1 text-xs text-muted">Scheduled {formatWhen(item.scheduledAt)}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
