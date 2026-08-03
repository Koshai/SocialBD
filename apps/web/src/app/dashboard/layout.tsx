import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardLayoutClient } from "@/components/dashboard/dashboard-layout-client";
import { auth } from "@/lib/auth";
import { isAgentsFeatureEnabled } from "@/lib/features/agents";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardLayoutClient user={session.user} agentsEnabled={isAgentsFeatureEnabled()}>
      {children}
    </DashboardLayoutClient>
  );
}
