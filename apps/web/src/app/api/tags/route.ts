import { findOrCreateContentTags, listContentTags } from "@socialbd/db";
import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/dashboard-session";

export async function GET() {
  const { organizationId } = await requireActiveOrganization();
  const tags = await listContentTags(organizationId);
  return NextResponse.json({ tags });
}

export async function POST(request: Request) {
  const { organizationId } = await requireActiveOrganization();

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const names =
    typeof json === "object" && json !== null && "names" in json
      ? (json as { names: unknown }).names
      : typeof json === "object" && json !== null && "name" in json
        ? [(json as { name: unknown }).name]
        : [];

  const tagNames = (Array.isArray(names) ? names : [names]).map(String);
  const tags = await findOrCreateContentTags(organizationId, tagNames);
  return NextResponse.json({ tags });
}
