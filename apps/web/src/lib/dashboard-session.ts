import { userBelongsToOrganization, userHasAnyOrganization } from "@socialbd/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";

/** Request-scoped session (deduped across layout + pages). */
export const getDashboardSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});

export async function requireDashboardSession() {
  const session = await getDashboardSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireActiveOrganization() {
  const session = await requireDashboardSession();
  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    redirect("/dashboard");
  }

  const isMember = await userBelongsToOrganization(session.user.id, organizationId);
  if (!isMember) {
    redirect("/dashboard");
  }

  return { session, organizationId, userId: session.user.id };
}

/** Props for WorkspaceGate so we can paint server HTML without waiting on client org hooks. */
export async function getWorkspaceGateBootstrap() {
  const session = await requireDashboardSession();
  const hasActiveOrganization = Boolean(session.session.activeOrganizationId);
  const hasAnyOrganization =
    hasActiveOrganization || (await userHasAnyOrganization(session.user.id));
  return {
    hasActiveOrganization,
    hasAnyOrganization,
  };
}
