import {
  countPendingApprovalPosts,
  countScheduledPosts,
  getContentIdea,
  getPostDetail,
  listConnectedAccounts,
  listPostsForOrganization,
} from "@socialbd/db";

import { ComposerForm } from "@/components/composer/composer-form";
import { PostListLive } from "@/components/composer/post-list-live";
import { withoutLinkedInAccounts } from "@/lib/features/linkedin";
import { requireActiveOrganization } from "@/lib/dashboard-session";
import { serializeIdea } from "@/lib/ideas-api";
import { resolveCanPublishDirectly } from "@/lib/organization-roles";
import { toEditPostFormData } from "@/lib/post-detail";

type ComposerPageProps = {
  searchParams: Promise<{ ideaId?: string; postId?: string }>;
};

export default async function ComposerPage({ searchParams }: ComposerPageProps) {
  const { organizationId, userId } = await requireActiveOrganization();
  const { ideaId, postId } = await searchParams;
  const canPublish = await resolveCanPublishDirectly(userId, organizationId);

  const promoteIdea =
    ideaId && ideaId.trim() ? await getContentIdea(ideaId.trim(), organizationId) : null;

  let editPost = null;
  let editError: string | null = null;
  if (postId?.trim()) {
    const detail = await getPostDetail(postId.trim(), organizationId);
    if (!detail) {
      editError = "not_found";
    } else if (!detail.canEdit) {
      editError = "not_editable";
    } else {
      editPost = toEditPostFormData(detail);
    }
  }

  const [channels, posts, scheduledCount, pendingApprovalCount] = await Promise.all([
    listConnectedAccounts(organizationId),
    listPostsForOrganization(organizationId, 8),
    countScheduledPosts(organizationId),
    countPendingApprovalPosts(organizationId),
  ]);

  return (
    <div className="space-y-6">
      <ComposerForm
        channels={withoutLinkedInAccounts(channels)}
        canPublishDirectly={canPublish}
        promoteIdea={promoteIdea && !editPost ? serializeIdea(promoteIdea) : null}
        editPost={editPost}
        editError={editError}
      />
      <PostListLive initial={{ posts, scheduledCount, pendingApprovalCount }} />
    </div>
  );
}
