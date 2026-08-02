import type { PostDetail } from "@socialbd/db";

import { toDateInputValue } from "@/lib/calendar";

export type EditPostFormData = {
  id: string;
  body: string;
  connectedAccountId: string;
  mediaPath: string | null;
  mediaMimeType: string | null;
  previewUrl: string | null;
  scheduledAtLocal: string;
};

export function toEditPostFormData(detail: PostDetail): EditPostFormData {
  return {
    id: detail.id,
    body: detail.body,
    connectedAccountId: detail.connectedAccountId,
    mediaPath: detail.mediaPath,
    mediaMimeType: detail.mediaMimeType,
    previewUrl: detail.mediaPath
      ? `/api/media/${encodeURIComponent(detail.mediaPath)}`
      : null,
    scheduledAtLocal: detail.scheduledAt ? toDateInputValue(detail.scheduledAt) : "",
  };
}
