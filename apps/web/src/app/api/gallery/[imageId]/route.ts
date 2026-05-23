import { deleteWorkspaceGalleryImage, getWorkspaceGalleryImage } from "@socialbd/db";
import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/dashboard-session";
import { getMemberRoleForUser } from "@/lib/organization-roles";

type RouteContext = { params: Promise<{ imageId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const { organizationId, userId } = await requireActiveOrganization();
  const { imageId } = await context.params;

  const image = await getWorkspaceGalleryImage(imageId, organizationId);
  if (!image) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  const role = await getMemberRoleForUser(userId, organizationId);
  const canDelete =
    role === "owner" || role === "admin" || image.uploadedByUserId === userId;

  if (!canDelete) {
    return NextResponse.json({ error: "You cannot delete this image." }, { status: 403 });
  }

  await deleteWorkspaceGalleryImage(imageId, organizationId);
  return NextResponse.json({ ok: true });
}
