import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/dashboard-session";
import { importGalleryImageForOrganization } from "@/lib/gallery-import";
import { normalizeGalleryImageId } from "@/lib/idea-gallery";

export async function POST(request: Request) {
  const { organizationId } = await requireActiveOrganization();

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const galleryImageIdRaw =
    typeof json === "object" && json !== null && "galleryImageId" in json
      ? String((json as { galleryImageId: unknown }).galleryImageId)
      : "";

  try {
    const galleryImageId = normalizeGalleryImageId(galleryImageIdRaw);
    if (!galleryImageId) {
      return NextResponse.json({ error: "Choose a gallery image." }, { status: 400 });
    }

    const saved = await importGalleryImageForOrganization(organizationId, galleryImageId);

    return NextResponse.json({
      mediaPath: saved.relativePath,
      mediaMimeType: saved.mimeType,
      previewUrl: `/api/media/${encodeURIComponent(saved.relativePath)}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not import gallery image.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
