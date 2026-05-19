import { listConnectedAccounts, listPostsForOrganization } from "@socialbd/db";

import { ComposerForm } from "@/components/composer/composer-form";
import { PostList } from "@/components/composer/post-list";
import { requireActiveOrganization } from "@/lib/dashboard-session";

export default async function ComposerPage() {
  const { organizationId } = await requireActiveOrganization();
  const [channels, posts] = await Promise.all([
    listConnectedAccounts(organizationId),
    listPostsForOrganization(organizationId),
  ]);

  return (
    <div className="space-y-6">
      <ComposerForm channels={channels} />
      <PostList posts={posts} />
    </div>
  );
}
