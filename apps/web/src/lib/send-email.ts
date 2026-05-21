export type AppEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Label for dev console logs (e.g. invitation, verification). */
  kind: "invitation" | "verification";
};

export function isEmailSendingConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

/**
 * Sends app email via Resend when RESEND_API_KEY + EMAIL_FROM are set.
 * In development without Resend, logs the message to the terminal (links still work for testing).
 */
export async function sendAppEmail(input: AppEmailInput) {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const emailFrom = process.env.EMAIL_FROM?.trim();

  if (resendKey && emailFrom) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Email (${input.kind}) failed (${response.status}): ${body}`);
    }

    if (process.env.NODE_ENV === "development") {
      console.info(`[SocialBD email:${input.kind}] Sent to ${input.to}`);
    }
    return;
  }

  if (process.env.NODE_ENV === "development") {
    const plain =
      input.text ??
      input.html
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    console.info(
      [
        "",
        `[SocialBD email:${input.kind}] Resend not configured — set RESEND_API_KEY and EMAIL_FROM`,
        `  To: ${input.to}`,
        `  Subject: ${input.subject}`,
        `  Body: ${plain}`,
        "",
      ].join("\n"),
    );
    return;
  }

  throw new Error(
    `Email (${input.kind}) is not configured. Set RESEND_API_KEY and EMAIL_FROM in your environment.`,
  );
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
