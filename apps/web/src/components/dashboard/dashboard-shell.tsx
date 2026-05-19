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
  children: React.ReactNode;
};

export function DashboardShell({
  user,
  title,
  description,
  children,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:flex md:shrink-0">
        <SidebarNav />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <DashboardHeader user={user} title={title} description={description} />
        <main id="dashboard-main" className="flex-1 px-4 py-6 sm:px-6">
          <WorkspaceGate>{children}</WorkspaceGate>
        </main>
      </div>
    </div>
  );
}
