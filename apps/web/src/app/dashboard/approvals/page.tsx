import { listPendingApprovalPosts } from "@socialbd/db";

import { ApprovalsPanel } from "@/components/approvals/approvals-panel";
import { requireActiveOrganization } from "@/lib/dashboard-session";
import { resolveCanPublishDirectly } from "@/lib/organization-roles";

export default async function ApprovalsPage() {
  const { organizationId, userId } = await requireActiveOrganization();
  const canReview = await resolveCanPublishDirectly(userId, organizationId);
  const posts = await listPendingApprovalPosts(organizationId);

  return <ApprovalsPanel posts={posts} canReview={canReview} />;
}
