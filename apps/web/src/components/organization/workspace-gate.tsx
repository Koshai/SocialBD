"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { CreateWorkspaceForm } from "./create-workspace-form";
import { authClient } from "@/lib/auth-client";

export function WorkspaceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: organizations, isPending } = authClient.useListOrganizations();
  const { data: activeOrganization } = authClient.useActiveOrganization();

  useEffect(() => {
    const first = organizations?.[0];
    if (!first || activeOrganization) return;

    void authClient.organization.setActive({ organizationId: first.id }).then(() => router.refresh());
  }, [organizations, activeOrganization, router]);

  if (isPending) {
    return (
      <p className="text-sm text-muted" aria-live="polite">
        Loading your workspaces...
      </p>
    );
  }

  if (!organizations?.length && !pathname.startsWith("/dashboard/workspaces")) {
    return <CreateWorkspaceForm />;
  }

  return children;
}
