import { getAppBaseUrl } from "@/lib/app-url";
import { escapeHtml, sendAppEmail } from "@/lib/send-email";

export function buildInvitationAcceptUrl(invitationId: string) {
  return `${getAppBaseUrl()}/accept-invitation/${invitationId}`;
}

type InvitationEmailInput = {
  email: string;
  inviteLink: string;
  organizationName: string;
  inviterName: string;
};

export async function sendOrganizationInvitationEmail(input: InvitationEmailInput) {
  const subject = `Join ${input.organizationName} on SocialBD`;
  const html = `
    <p>${escapeHtml(input.inviterName)} invited you to join <strong>${escapeHtml(input.organizationName)}</strong> on SocialBD.</p>
    <p><a href="${input.inviteLink}">Accept invitation</a></p>
    <p style="color:#666;font-size:12px">If the link does not work, copy this URL:<br>${input.inviteLink}</p>
  `.trim();

  await sendAppEmail({
    kind: "invitation",
    to: input.email,
    subject,
    html,
    text: `${input.inviterName} invited you to ${input.organizationName} on SocialBD. Accept: ${input.inviteLink}`,
  });
}
