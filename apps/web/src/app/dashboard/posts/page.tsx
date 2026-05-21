import { countPostsByStatus, listPostsFiltered } from "@socialbd/db";

import { PostHistoryPanel } from "@/components/composer/post-history-panel";
import { requireActiveOrganization } from "@/lib/dashboard-session";
import type { PostHistoryFilter } from "@/lib/posts-api";

const DEFAULT_FILTER: PostHistoryFilter = {
  status: "published",
  platform: "all",
};

export default async function PostsHistoryPage() {
  const { organizationId } = await requireActiveOrganization();

  const [{ posts, nextCursor }, counts] = await Promise.all([
    listPostsFiltered({
      organizationId,
      status: DEFAULT_FILTER.status,
      platform: DEFAULT_FILTER.platform,
      limit: 25,
    }),
    countPostsByStatus(organizationId),
  ]);

  return (
    <PostHistoryPanel
      initialPosts={posts}
      initialCounts={counts}
      initialNextCursor={nextCursor}
      initialFilter={DEFAULT_FILTER}
    />
  );
}
