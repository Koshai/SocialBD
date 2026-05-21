import { listPendingApprovalPosts } from "@socialbd/db";

import { ApprovalsPanel } from "@/components/approvals/approvals-panel";
import { requireActiveOrganization } from "@/lib/dashboard-session";
import { canPublishDirectly, getMemberRoleForUser } from "@/lib/organization-roles";

export default async function ApprovalsPage() {
  const { organizationId, userId } = await requireActiveOrganization();
  const role = await getMemberRoleForUser(userId, organizationId);
  const posts = await listPendingApprovalPosts(organizationId);

  return <ApprovalsPanel posts={posts} canReview={canPublishDirectly(role)} />;
}
