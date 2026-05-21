import {
  countPendingApprovalPosts,
  countScheduledPosts,
  getContentIdea,
  listConnectedAccounts,
  listPostsForOrganization,
} from "@socialbd/db";

import { ComposerForm } from "@/components/composer/composer-form";
import { PostListLive } from "@/components/composer/post-list-live";
import { requireActiveOrganization } from "@/lib/dashboard-session";
import { serializeIdea } from "@/lib/ideas-api";
import { canPublishDirectly, getMemberRoleForUser } from "@/lib/organization-roles";

type ComposerPageProps = {
  searchParams: Promise<{ ideaId?: string }>;
};

export default async function ComposerPage({ searchParams }: ComposerPageProps) {
  const { organizationId, userId } = await requireActiveOrganization();
  const { ideaId } = await searchParams;
  const role = await getMemberRoleForUser(userId, organizationId);

  const promoteIdea =
    ideaId && ideaId.trim() ? await getContentIdea(ideaId.trim(), organizationId) : null;

  const [channels, posts, scheduledCount, pendingApprovalCount] = await Promise.all([
    listConnectedAccounts(organizationId),
    listPostsForOrganization(organizationId, 8),
    countScheduledPosts(organizationId),
    countPendingApprovalPosts(organizationId),
  ]);

  return (
    <div className="space-y-6">
      <ComposerForm
        channels={channels}
        canPublishDirectly={canPublishDirectly(role)}
        promoteIdea={promoteIdea ? serializeIdea(promoteIdea) : null}
      />
      <PostListLive initial={{ posts, scheduledCount, pendingApprovalCount }} />
    </div>
  );
}
