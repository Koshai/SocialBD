import { WorkspaceSettings } from "@/components/organization/workspace-settings";
import { requireActiveOrganization } from "@/lib/dashboard-session";
import { resolveCanPublishDirectly } from "@/lib/organization-roles";

export default async function SettingsPage() {
  const { organizationId, userId } = await requireActiveOrganization();
  const canInvite = await resolveCanPublishDirectly(userId, organizationId);

  return <WorkspaceSettings canInvite={canInvite} />;
}
