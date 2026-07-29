import { getAppBaseUrl } from "@/lib/app-url";
import { escapeHtml, sendAppEmail } from "@/lib/send-email";

function approvalsUrl() {
  return `${getAppBaseUrl()}/dashboard/approvals`;
}

function composerUrl() {
  return `${getAppBaseUrl()}/dashboard/composer`;
}

function formatScheduleLine(scheduledAt: Date | null) {
  if (!scheduledAt) {
    return "Publish immediately when approved.";
  }
  return `Scheduled for ${scheduledAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}.`;
}

function postSummary(input: {
  body: string;
  hasMedia: boolean;
  channelName: string;
  scheduledAt: Date | null;
}) {
  const caption = input.body.trim() || "(Image only)";
  const mediaNote = input.hasMedia ? "Includes an image." : "Text only.";
  return `${caption}\n\nChannel: ${input.channelName}\n${mediaNote}\n${formatScheduleLine(input.scheduledAt)}`;
}

export async function sendApprovalRequestEmails(input: {
  organizationName: string;
  submitterName: string;
  recipients: Array<{ email: string; name: string | null }>;
  post: {
    body: string;
    hasMedia: boolean;
    channelName: string;
    scheduledAt: Date | null;
  };
}) {
  if (input.recipients.length === 0) return;

  const subject = `Approval needed — ${input.organizationName} on SocialBD`;
  const summary = postSummary(input.post);
  const link = approvalsUrl();

  await Promise.all(
    input.recipients.map((recipient) => {
      const greeting = recipient.name?.trim() ? `Hi ${recipient.name},` : "Hi,";
      const html = `
        <p>${escapeHtml(greeting)}</p>
        <p><strong>${escapeHtml(input.submitterName)}</strong> submitted a post for approval in <strong>${escapeHtml(input.organizationName)}</strong>.</p>
        <pre style="white-space:pre-wrap;font-family:inherit;background:#f4f4f5;padding:12px;border-radius:8px">${escapeHtml(summary)}</pre>
        <p><a href="${link}">Review in Approvals</a></p>
      `.trim();

      return sendAppEmail({
        kind: "approval_request",
        to: recipient.email,
        subject,
        html,
        text: `${input.submitterName} submitted a post for approval in ${input.organizationName}. Review: ${link}\n\n${summary}`,
      });
    }),
  );
}

export async function sendApprovalApprovedEmail(input: {
  organizationName: string;
  recipientEmail: string;
  recipientName: string | null;
  post: {
    body: string;
    hasMedia: boolean;
    channelName: string;
    scheduledAt: Date | null;
  };
  publishNow: boolean;
}) {
  const subject = `Approved — your post in ${input.organizationName}`;
  const summary = postSummary(input.post);
  const link = composerUrl();
  const timing = input.publishNow
    ? "It is publishing now (or entering the queue)."
    : formatScheduleLine(input.post.scheduledAt);
  const greeting = input.recipientName?.trim() ? `Hi ${input.recipientName},` : "Hi,";

  const html = `
    <p>${escapeHtml(greeting)}</p>
    <p>Your post in <strong>${escapeHtml(input.organizationName)}</strong> was approved. ${escapeHtml(timing)}</p>
    <pre style="white-space:pre-wrap;font-family:inherit;background:#f4f4f5;padding:12px;border-radius:8px">${escapeHtml(summary)}</pre>
    <p><a href="${link}">Open Composer</a></p>
  `.trim();

  await sendAppEmail({
    kind: "approval_approved",
    to: input.recipientEmail,
    subject,
    html,
    text: `Your post was approved in ${input.organizationName}. ${timing}\n\n${summary}\n\n${link}`,
  });
}

export async function sendApprovalRejectedEmail(input: {
  organizationName: string;
  recipientEmail: string;
  recipientName: string | null;
  post: {
    body: string;
    hasMedia: boolean;
    channelName: string;
    scheduledAt: Date | null;
  };
}) {
  const subject = `Not approved — your post in ${input.organizationName}`;
  const summary = postSummary(input.post);
  const link = composerUrl();
  const greeting = input.recipientName?.trim() ? `Hi ${input.recipientName},` : "Hi,";

  const html = `
    <p>${escapeHtml(greeting)}</p>
    <p>Your post in <strong>${escapeHtml(input.organizationName)}</strong> was not approved. You can edit and submit again from Composer.</p>
    <pre style="white-space:pre-wrap;font-family:inherit;background:#f4f4f5;padding:12px;border-radius:8px">${escapeHtml(summary)}</pre>
    <p><a href="${link}">Open Composer</a></p>
  `.trim();

  await sendAppEmail({
    kind: "approval_rejected",
    to: input.recipientEmail,
    subject,
    html,
    text: `Your post was not approved in ${input.organizationName}. Edit and resubmit: ${link}\n\n${summary}`,
  });
}

export async function notifyApproversOfPendingPost(input: {
  organizationId: string;
  organizationName: string;
  submitterUserId: string;
  submitterName: string;
  post: {
    body: string;
    hasMedia: boolean;
    channelName: string;
    scheduledAt: Date | null;
  };
  recipients: Array<{ email: string; name: string | null }>;
}) {
  await sendApprovalRequestEmails({
    organizationName: input.organizationName,
    submitterName: input.submitterName,
    recipients: input.recipients,
    post: input.post,
  });
}
