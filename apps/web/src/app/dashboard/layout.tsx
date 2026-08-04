import { getWorkspaceGateBootstrap, getDashboardSession } from "@/lib/dashboard-session";
import { DashboardLayoutClient } from "@/components/dashboard/dashboard-layout-client";
import { isAgentsFeatureEnabled } from "@/lib/features/agents";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getDashboardSession();

  if (!session) {
    redirect("/login");
  }

  const workspace = await getWorkspaceGateBootstrap();

  return (
    <DashboardLayoutClient
      user={session.user}
      agentsEnabled={isAgentsFeatureEnabled()}
      hasActiveOrganization={workspace.hasActiveOrganization}
      hasAnyOrganization={workspace.hasAnyOrganization}
    >
      {children}
    </DashboardLayoutClient>
  );
}
