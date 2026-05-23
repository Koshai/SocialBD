import {
  createWorkspaceGalleryImage,
  getMediaMaxBytes,
  isAllowedImageMimeType,
  listWorkspaceGalleryImages,
  saveOrganizationMedia,
} from "@socialbd/db";
import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/dashboard-session";
import { isGalleryCategory } from "@/lib/idea-gallery";
import { serializeWorkspaceGalleryImage } from "@/lib/workspace-gallery-api";

export async function GET(request: Request) {
  const { organizationId } = await requireActiveOrganization();
  const { searchParams } = new URL(request.url);
  const categoryRaw = searchParams.get("category") ?? "all";
  const category = categoryRaw === "all" || isGalleryCategory(categoryRaw) ? categoryRaw : "all";
  const search = searchParams.get("q")?.trim() || undefined;

  const images = await listWorkspaceGalleryImages({
    organizationId,
    category,
    search,
  });

  return NextResponse.json({
    images: images.map(serializeWorkspaceGalleryImage),
  });
}

export async function POST(request: Request) {
  const { organizationId, userId } = await requireActiveOrganization();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = formData.get("file");
  const categoryRaw = String(formData.get("category") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
  }
  if (!isGalleryCategory(categoryRaw)) {
    return NextResponse.json({ error: "Choose a valid category." }, { status: 400 });
  }

  const mimeType = file.type || "application/octet-stream";
  if (!isAllowedImageMimeType(mimeType)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, GIF, and WebP images are supported." },
      { status: 400 },
    );
  }
  if (file.size > getMediaMaxBytes()) {
    return NextResponse.json({ error: "Image must be 8 MB or smaller." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveOrganizationMedia({ organizationId, buffer, mimeType });
    const image = await createWorkspaceGalleryImage({
      organizationId,
      uploadedByUserId: userId,
      name: name || file.name.replace(/\.[^.]+$/, "") || "Uploaded image",
      category: categoryRaw,
      mediaPath: saved.relativePath,
      mediaMimeType: saved.mimeType,
    });

    return NextResponse.json({ image: serializeWorkspaceGalleryImage(image) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
