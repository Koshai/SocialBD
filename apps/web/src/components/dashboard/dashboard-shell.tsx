"use client";

import { WorkspaceGate } from "@/components/organization/workspace-gate";

import { DashboardHeader } from "./dashboard-header";
import { MobileNav } from "./mobile-nav";
import { SidebarNav } from "./sidebar-nav";

type DashboardShellProps = {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  title: string;
  description?: string;
  agentsEnabled?: boolean;
  hasActiveOrganization?: boolean;
  hasAnyOrganization?: boolean;
  children: React.ReactNode;
};

export function DashboardShell({
  user,
  title,
  description,
  agentsEnabled = false,
  hasActiveOrganization = false,
  hasAnyOrganization = false,
  children,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:flex md:shrink-0">
        <SidebarNav agentsEnabled={agentsEnabled} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
        <DashboardHeader user={user} title={title} description={description} />
        <main id="dashboard-main" className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
          <WorkspaceGate
            hasActiveOrganization={hasActiveOrganization}
            hasAnyOrganization={hasAnyOrganization}
          >
            {children}
          </WorkspaceGate>
        </main>
        <MobileNav agentsEnabled={agentsEnabled} />
      </div>
    </div>
  );
}
