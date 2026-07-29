import {
  getPostApprovalNotificationContext,
  listOrganizationApproverEmails,
} from "@socialbd/db";

import {
  notifyApproversOfPendingPost,
  sendApprovalApprovedEmail,
  sendApprovalRejectedEmail,
} from "@/lib/approval-email";

function displayName(name: string | null, email: string) {
  return name?.trim() || email;
}

export async function notifyPostSubmittedForApproval(input: {
  postId: string;
  organizationId: string;
  submitterUserId: string;
}) {
  const context = await getPostApprovalNotificationContext(input.postId, input.organizationId);
  if (!context) return;

  const recipients = await listOrganizationApproverEmails(
    input.organizationId,
    input.submitterUserId,
  );

  if (recipients.length === 0) return;

  await notifyApproversOfPendingPost({
    organizationId: input.organizationId,
    organizationName: context.organizationName,
    submitterUserId: input.submitterUserId,
    submitterName: displayName(context.creatorName, context.creatorEmail),
    post: {
      body: context.body,
      hasMedia: context.hasMedia,
      channelName: context.channelName,
      scheduledAt: context.scheduledAt,
    },
    recipients,
  });
}

export async function notifyPostApproved(input: {
  postId: string;
  organizationId: string;
  publishNow: boolean;
  scheduledAt: Date | null;
}) {
  const context = await getPostApprovalNotificationContext(input.postId, input.organizationId);
  if (!context?.creatorEmail) return;

  await sendApprovalApprovedEmail({
    organizationName: context.organizationName,
    recipientEmail: context.creatorEmail,
    recipientName: context.creatorName,
    post: {
      body: context.body,
      hasMedia: context.hasMedia,
      channelName: context.channelName,
      scheduledAt: context.scheduledAt,
    },
    publishNow: input.publishNow,
  });
}

export async function notifyPostRejected(input: { postId: string; organizationId: string }) {
  const context = await getPostApprovalNotificationContext(input.postId, input.organizationId);
  if (!context?.creatorEmail) return;

  await sendApprovalRejectedEmail({
    organizationName: context.organizationName,
    recipientEmail: context.creatorEmail,
    recipientName: context.creatorName,
    post: {
      body: context.body,
      hasMedia: context.hasMedia,
      channelName: context.channelName,
      scheduledAt: context.scheduledAt,
    },
  });
}
