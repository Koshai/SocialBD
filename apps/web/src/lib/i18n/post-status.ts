import type { TranslateFn } from "./translate";

const STATUS_KEYS: Record<string, string> = {
  draft: "posts.status.draft",
  scheduled: "posts.status.scheduled",
  published: "posts.status.published",
  failed: "posts.status.failed",
  pending_approval: "posts.status.pendingApproval",
  rejected: "posts.status.rejected",
};

export function getPostStatusLabel(status: string, t: TranslateFn) {
  const key = STATUS_KEYS[status];
  if (!key) return status.replace(/_/g, " ");
  const label = t(key);
  return label === key ? status.replace(/_/g, " ") : label;
}
