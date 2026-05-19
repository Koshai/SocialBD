import { NextResponse } from "next/server";

import { disconnectAccount } from "@socialbd/db";
import { requireActiveOrganization } from "@/lib/dashboard-session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { organizationId } = await requireActiveOrganization();
  const { id } = await context.params;

  const removed = await disconnectAccount({ accountId: id, organizationId });
  if (!removed) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
