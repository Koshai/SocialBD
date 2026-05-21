import { escapeHtml, sendAppEmail } from "@/lib/send-email";

export async function sendEmailVerificationMessage(input: { email: string; url: string }) {
  const subject = "Verify your SocialBD email";
  const html = `
    <p>Confirm your email address to use SocialBD, including accepting workspace invitations.</p>
    <p><a href="${input.url}">Verify email</a></p>
    <p style="color:#666;font-size:12px">If the link does not work, copy this URL:<br>${escapeHtml(input.url)}</p>
  `.trim();

  await sendAppEmail({
    kind: "verification",
    to: input.email,
    subject,
    html,
    text: `Verify your SocialBD email: ${input.url}`,
  });
}
