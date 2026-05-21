import {
  countIdeasByStatus,
  listCampaigns,
  listContentIdeas,
  listContentTags,
} from "@socialbd/db";

import { IdeasWorkspace } from "@/components/ideas/ideas-workspace";
import { requireActiveOrganization } from "@/lib/dashboard-session";
import { serializeIdea, serializeIdeaCounts } from "@/lib/ideas-api";

export default async function IdeasPage() {
  const { organizationId } = await requireActiveOrganization();

  const [ideas, counts, campaigns, tags] = await Promise.all([
    listContentIdeas({ organizationId, status: "brainstorm" }),
    countIdeasByStatus(organizationId),
    listCampaigns(organizationId),
    listContentTags(organizationId),
  ]);

  return (
    <IdeasWorkspace
      initialIdeas={ideas.map(serializeIdea)}
      initialCounts={serializeIdeaCounts(counts)}
      initialCampaigns={campaigns}
      initialTags={tags}
    />
  );
}
