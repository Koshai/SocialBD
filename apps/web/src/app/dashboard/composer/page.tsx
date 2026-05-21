import {
  countPendingApprovalPosts,
  countScheduledPosts,
  listConnectedAccounts,
  listPostsForOrganization,
} from "@socialbd/db";

import { ComposerForm } from "@/components/composer/composer-form";
import { PostListLive } from "@/components/composer/post-list-live";
import { requireActiveOrganization } from "@/lib/dashboard-session";
import { canPublishDirectly, getMemberRoleForUser } from "@/lib/organization-roles";

export default async function ComposerPage() {
  const { organizationId, userId } = await requireActiveOrganization();
  const role = await getMemberRoleForUser(userId, organizationId);
  const [channels, posts, scheduledCount, pendingApprovalCount] = await Promise.all([
    listConnectedAccounts(organizationId),
    listPostsForOrganization(organizationId),
    countScheduledPosts(organizationId),
    countPendingApprovalPosts(organizationId),
  ]);

  return (
    <div className="space-y-6">
      <ComposerForm channels={channels} canPublishDirectly={canPublishDirectly(role)} />
      <PostListLive initial={{ posts, scheduledCount, pendingApprovalCount }} />
    </div>
  );
}
