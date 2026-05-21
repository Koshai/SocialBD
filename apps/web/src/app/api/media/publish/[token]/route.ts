import { isAllowedImageMimeType, readOrganizationMedia, verifySignedMediaToken } from "@socialbd/db";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ token: string }>;
};

/** Public, short-lived URL for Meta to fetch images (Instagram publishing). */
export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;

  try {
    const relativePath = verifySignedMediaToken(token);
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
      return new NextResponse("Not found", { status: 404 });
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
