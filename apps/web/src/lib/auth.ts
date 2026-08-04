import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db, schema } from "@socialbd/db";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";

import { buildInvitationAcceptUrl, sendOrganizationInvitationEmail } from "@/lib/invitation-email";
import { sendEmailVerificationMessage } from "@/lib/verification-email";

const baseURL = (
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3001"
).replace(/\/$/, "");

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is required. See .env.example");
}

/** Apex + www variants so login works on either host. */
function withWwwVariants(origin: string): string[] {
  try {
    const url = new URL(origin);
    const host = url.hostname;
    if (host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      return [origin];
    }
    const altHost = host.startsWith("www.") ? host.slice(4) : `www.${host}`;
    return [origin, `${url.protocol}//${altHost}`];
  } catch {
    return [origin];
  }
}

const trustedOrigins = [
  ...withWwwVariants(baseURL),
  ...(process.env.NEXT_PUBLIC_APP_URL
    ? withWwwVariants(process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, ""))
    : []),
  "http://localhost:3000",
  "http://localhost:3001",
].filter((origin, index, list): origin is string => Boolean(origin) && list.indexOf(origin) === index);

export const auth = betterAuth({
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailVerification: {
    // Better Auth swallows send errors (runInBackgroundOrAwait). We send from the
    // client via POST /api/auth/resend-verification so failures can surface.
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      await sendEmailVerificationMessage({ email: user.email, url });
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  trustedOrigins,
  plugins: [
    organization({
      creatorRole: "owner",
      requireEmailVerificationOnInvitation: true,
      async sendInvitationEmail(data) {
        const inviterName =
          data.inviter.user.name?.trim() || data.inviter.user.email || "A teammate";
        void sendOrganizationInvitationEmail({
          email: data.email,
          inviteLink: buildInvitationAcceptUrl(data.id),
          organizationName: data.organization.name,
          inviterName,
        }).catch((error) => {
          console.error("[QueueOra email:invitation] Failed to send:", error);
        });
      },
    }),
    nextCookies(),
  ],
});
