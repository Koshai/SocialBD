import { WorkspaceSettings } from "@/components/organization/workspace-settings";
import { requireActiveOrganization } from "@/lib/dashboard-session";
import { canPublishDirectly, getMemberRoleForUser } from "@/lib/organization-roles";

export default async function SettingsPage() {
  const { organizationId, userId } = await requireActiveOrganization();
  const role = await getMemberRoleForUser(userId, organizationId);

  return <WorkspaceSettings canInvite={canPublishDirectly(role)} />;
}
