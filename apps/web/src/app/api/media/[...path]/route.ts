import {
  assertMediaBelongsToOrganization,
  isAllowedImageMimeType,
  readOrganizationMedia,
} from "@socialbd/db";
import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/dashboard-session";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { organizationId } = await requireActiveOrganization();
  const { path: segments } = await context.params;
  const relativePath = segments.map(decodeURIComponent).join("/");

  try {
    assertMediaBelongsToOrganization(relativePath, organizationId);
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const buffer = await readOrganizationMedia(relativePath);
    const ext = relativePath.split(".").pop()?.toLowerCase();
    const mimeType =
      ext === "png"
        ? "image/png"
        : ext === "gif"
          ? "image/gif"
          : ext === "webp"
            ? "image/webp"
            : "image/jpeg";

    if (!isAllowedImageMimeType(mimeType)) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
