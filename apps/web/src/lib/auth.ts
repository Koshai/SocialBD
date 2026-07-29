import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db, schema } from "@socialbd/db";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";

import { buildInvitationAcceptUrl, sendOrganizationInvitationEmail } from "@/lib/invitation-email";
import { sendEmailVerificationMessage } from "@/lib/verification-email";

const baseURL =
<<<<<<< HEAD
  process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
=======
  process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is required. See .env.example");
}

const trustedOrigins = [
  baseURL,
  process.env.NEXT_PUBLIC_APP_URL,
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
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      // Do not await before returning (timing-attack guidance); fire-and-forget with logging on failure.
      void sendEmailVerificationMessage({ email: user.email, url }).catch((error) => {
        console.error("[SocialBD email:verification] Failed to send:", error);
      });
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  trustedOrigins,
  plugins: [
    organization({
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
          console.error("[SocialBD email:invitation] Failed to send:", error);
        });
      },
    }),
    nextCookies(),
  ],
});
