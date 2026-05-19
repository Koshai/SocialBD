import { userBelongsToOrganization } from "@socialbd/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export async function getDashboardSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

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
