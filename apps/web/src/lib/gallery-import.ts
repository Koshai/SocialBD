import { readFile } from "node:fs/promises";
import path from "node:path";

import { saveOrganizationMedia } from "@socialbd/db";
import sharp from "sharp";

import { getGalleryImageById } from "@/lib/idea-gallery";

export async function importGalleryImageForOrganization(
  organizationId: string,
  galleryImageId: string,
) {
  const image = getGalleryImageById(galleryImageId);
  if (!image) {
    throw new Error("Gallery image not found.");
  }

  const absolutePath = path.join(process.cwd(), "public", image.src.replace(/^\//, ""));
  const source = await readFile(absolutePath);
  const png = await sharp(source).resize(1080, 1080, { fit: "cover" }).png().toBuffer();

  return saveOrganizationMedia({
    organizationId,
    buffer: png,
    mimeType: "image/png",
  });
}
