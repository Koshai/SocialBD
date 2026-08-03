"use client";

import { useDashboardPageMeta } from "@/lib/i18n/use-dashboard-page-meta";
import { DashboardShell } from "./dashboard-shell";

type DashboardLayoutClientProps = {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  agentsEnabled?: boolean;
  children: React.ReactNode;
};

export function DashboardLayoutClient({
  user,
  agentsEnabled = false,
  children,
}: DashboardLayoutClientProps) {
  const { title, description } = useDashboardPageMeta();

  return (
    <DashboardShell
      user={user}
      title={title}
      description={description}
      agentsEnabled={agentsEnabled}
    >
      {children}
    </DashboardShell>
  );
}
