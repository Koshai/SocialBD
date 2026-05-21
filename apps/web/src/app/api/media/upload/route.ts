import {
  getMediaMaxBytes,
  isAllowedImageMimeType,
  saveOrganizationMedia,
} from "@socialbd/db";
import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/dashboard-session";

export async function POST(request: Request) {
  const { organizationId } = await requireActiveOrganization();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
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

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const saved = await saveOrganizationMedia({
      organizationId,
      buffer,
      mimeType,
    });

    return NextResponse.json({
      mediaPath: saved.relativePath,
      mediaMimeType: saved.mimeType,
      previewUrl: `/api/media/${encodeURIComponent(saved.relativePath)}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
