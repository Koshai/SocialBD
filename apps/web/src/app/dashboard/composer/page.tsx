import { countScheduledPosts, listConnectedAccounts, listPostsForOrganization } from "@socialbd/db";

import { ComposerForm } from "@/components/composer/composer-form";
import { PostListLive } from "@/components/composer/post-list-live";
import { requireActiveOrganization } from "@/lib/dashboard-session";

export default async function ComposerPage() {
  const { organizationId } = await requireActiveOrganization();
  const [channels, posts, scheduledCount] = await Promise.all([
    listConnectedAccounts(organizationId),
    listPostsForOrganization(organizationId),
    countScheduledPosts(organizationId),
  ]);

  return (
    <div className="space-y-6">
      <ComposerForm channels={channels} />
      <PostListLive initial={{ posts, scheduledCount }} />
    </div>
  );
}

