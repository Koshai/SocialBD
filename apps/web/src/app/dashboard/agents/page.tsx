import { notFound } from "next/navigation";

import { AgentsWorkspace } from "@/components/agents/agents-workspace";
import { isAgentsFeatureEnabled } from "@/lib/features/agents";

export default function AgentsPage() {
  if (!isAgentsFeatureEnabled()) {
    notFound();
  }

  return <AgentsWorkspace />;
}
