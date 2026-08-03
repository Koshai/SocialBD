import { countPostsByStatus, listPostsFiltered, type PostStatus } from "@socialbd/db";

import { PostHistoryPanel } from "@/components/composer/post-history-panel";
import { requireActiveOrganization } from "@/lib/dashboard-session";
import type { PostHistoryFilter } from "@/lib/posts-api";

const VALID_STATUSES = new Set([
  "all",
  "draft",
  "pending_approval",
  "scheduled",
  "published",
  "failed",
  "rejected",
]);

type PostsHistoryPageProps = {
  searchParams: Promise<{ status?: string; platform?: string }>;
};

export default async function PostsHistoryPage({ searchParams }: PostsHistoryPageProps) {
  const { organizationId } = await requireActiveOrganization();
  const params = await searchParams;

  const statusRaw = params.status?.trim() || "published";
  const status = (VALID_STATUSES.has(statusRaw) ? statusRaw : "published") as PostHistoryFilter["status"];
  const platform = (params.platform?.trim() || "all") as PostHistoryFilter["platform"];

  const initialFilter: PostHistoryFilter = { status, platform };

  const [{ posts, nextCursor }, counts] = await Promise.all([
    listPostsFiltered({
      organizationId,
      status: status === "all" ? "all" : (status as PostStatus),
      platform,
      limit: 25,
    }),
    countPostsByStatus(organizationId),
  ]);

  return (
    <PostHistoryPanel
      initialPosts={posts}
      initialCounts={counts}
      initialNextCursor={nextCursor}
      initialFilter={initialFilter}
    />
  );
}
