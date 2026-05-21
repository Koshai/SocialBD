import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_BYTES = 8 * 1024 * 1024;

export function isAllowedImageMimeType(mimeType: string) {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export function getMediaMaxBytes() {
  return MAX_BYTES;
}

function getMonorepoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
}

export function getMediaStorageRoot() {
  const configured = process.env.MEDIA_STORAGE_PATH?.trim();
  if (configured) {
    return path.isAbsolute(configured) ? configured : path.resolve(getMonorepoRoot(), configured);
  }
  return path.join(getMonorepoRoot(), "storage", "uploads");
}

function extensionForMime(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

/** Relative path stored on post rows: `{organizationId}/{fileId}.ext` */
export async function saveOrganizationMedia(input: {
  organizationId: string;
  buffer: Buffer;
  mimeType: string;
}) {
  if (!isAllowedImageMimeType(input.mimeType)) {
    throw new Error("Only JPEG, PNG, GIF, and WebP images are supported.");
  }
  if (input.buffer.byteLength > MAX_BYTES) {
    throw new Error("Image must be 8 MB or smaller.");
  }

  const fileId = crypto.randomUUID();
  const ext = extensionForMime(input.mimeType);
  const relativePath = `${input.organizationId}/${fileId}.${ext}`;
  const absolutePath = path.join(getMediaStorageRoot(), relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, input.buffer);

  return { relativePath, mimeType: input.mimeType };
}

export function resolveMediaAbsolutePath(relativePath: string) {
  const root = getMediaStorageRoot();
  const absolute = path.resolve(root, relativePath);
  if (!absolute.startsWith(root)) {
    throw new Error("Invalid media path.");
  }
  return absolute;
}

export async function readOrganizationMedia(relativePath: string) {
  const absolutePath = resolveMediaAbsolutePath(relativePath);
  return readFile(absolutePath);
}

export function assertMediaBelongsToOrganization(relativePath: string, organizationId: string) {
  const normalized = relativePath.replace(/\\/g, "/");
  if (!normalized.startsWith(`${organizationId}/`)) {
    throw new Error("Media does not belong to this workspace.");
  }
}
