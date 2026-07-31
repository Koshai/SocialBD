import type { Metadata } from "next";

import { LegalPageShell } from "@/components/marketing/legal-page-shell";
import {
  getLegalEntityName,
  getPrivacyContactEmail,
  getPublicSiteUrl,
} from "@/lib/legal/site-legal";

export const metadata: Metadata = {
  title: "Privacy Policy — QueueOra",
  description: "How QueueOra collects, uses, and protects your data.",
};

const EFFECTIVE_DATE = "29 May 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  const entity = getLegalEntityName();
  const contactEmail = getPrivacyContactEmail();
  const siteUrl = getPublicSiteUrl();

  return (
    <LegalPageShell title="Privacy Policy">
      <p className="text-sm text-muted">
        <strong className="text-foreground">Effective date:</strong> {EFFECTIVE_DATE}
      </p>

      <Section title="1. Who we are">
        <p>
          {entity} (“<strong className="text-foreground">QueueOra</strong>”, “we”, “us”) operates a
          social media management platform at{" "}
          <a href={siteUrl} className="text-primary underline-offset-2 hover:underline">
            {siteUrl}
          </a>
          . This Privacy Policy explains how we collect, use, store, and share information when you
          use our website and services.
        </p>
        <p>
          For privacy questions or requests, contact us at{" "}
          <a
            href={`mailto:${contactEmail}`}
            className="text-primary underline-offset-2 hover:underline"
          >
            {contactEmail}
          </a>
          .
        </p>
      </Section>

      <Section title="2. Information we collect">
        <p>
          <strong className="text-foreground">Account information.</strong> When you register, we
          collect your name, email address, and authentication credentials (stored in hashed form). We
          may send verification and invitation emails to your address.
        </p>
        <p>
          <strong className="text-foreground">Workspace and team data.</strong> If you create or join
          an organization, we store workspace name, membership, roles, and team invitations.
        </p>
        <p>
          <strong className="text-foreground">Content you provide.</strong> This includes post drafts
          and published content (captions, scheduled times), content ideas, campaigns, tags, and
          images you upload to our gallery or composer.
        </p>
        <p>
          <strong className="text-foreground">Connected social accounts.</strong> When you connect
          Facebook Pages, Instagram accounts, or LinkedIn Company Pages, we receive OAuth tokens and
          related account metadata (such as page or organization IDs, display names, usernames, and
          profile pictures) needed to publish and display connected channels in the app.
        </p>
        <p>
          <strong className="text-foreground">Usage and technical data.</strong> We process session
          cookies and similar technologies to keep you signed in, remember preferences (such as
          language and theme), and operate the service. Server logs may include IP address, browser
          type, and request timestamps for security and troubleshooting.
        </p>
        <p>
          <strong className="text-foreground">AI-assisted features.</strong> If you use caption
          suggestions, the text you submit may be sent to our AI provider to generate suggestions.
        </p>
      </Section>

      <Section title="3. How we use information">
        <p>We use the information above to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide, maintain, and improve QueueOra;</li>
          <li>Authenticate users and manage workspaces and team permissions;</li>
          <li>Schedule and publish content to connected social platforms on your instructions;</li>
          <li>Send transactional emails (verification, invitations, and service notices);</li>
          <li>Display analytics and post history where those features are enabled;</li>
          <li>Protect against abuse, fraud, and security incidents; and</li>
          <li>Comply with legal obligations.</li>
        </ul>
        <p>
          We do not sell your personal information. We do not use connected social account data for
          advertising unrelated to operating the service you requested.
        </p>
      </Section>

      <Section title="4. Third-party services">
        <p>
          QueueOra integrates with third parties only as needed to provide the service. Depending on
          features you use, data may be processed by:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-foreground">Meta (Facebook / Instagram)</strong> — account
            connection, publishing, and related APIs, subject to Meta’s terms and policies;
          </li>
          <li>
            <strong className="text-foreground">LinkedIn</strong> — Company Page connection and
            publishing, subject to LinkedIn’s terms and API policies;
          </li>
          <li>
            <strong className="text-foreground">Email delivery</strong> (e.g. Resend) — to send
            verification and invitation messages;
          </li>
          <li>
            <strong className="text-foreground">AI providers</strong> (e.g. OpenAI) — when you use
            optional caption assistance; and
          </li>
          <li>
            <strong className="text-foreground">Infrastructure providers</strong> — hosting,
            database, and queue services that store and process data on our behalf.
          </li>
        </ul>
        <p>
          When you connect a social account, that platform’s privacy policy and terms also apply to
          data processed on their systems.
        </p>
      </Section>

      <Section title="5. LinkedIn and Meta data">
        <p>
          If you authorize QueueOra to access LinkedIn or Meta accounts, we access only the scopes
          you approve (for example, permissions needed to list administered pages or organizations
          and to publish content you create in QueueOra). We store access tokens securely to perform
          publishing until you disconnect the account or we no longer need the token to provide the
          service.
        </p>
        <p>
          We use LinkedIn and Meta data solely to provide QueueOra features you request — such as
          displaying connected accounts, composing posts, and publishing on your behalf — and not
          for unrelated profiling or resale.
        </p>
      </Section>

      <Section title="6. Storage, retention, and security">
        <p>
          Data is stored in our application database and, for media you upload, in configured file
          storage associated with your workspace. We retain information while your account is active
          and as needed to provide the service, resolve disputes, and meet legal requirements. You
          may request deletion of your account or workspace data by contacting us.
        </p>
        <p>
          We use industry-standard measures such as encrypted transport (HTTPS), hashed passwords,
          access controls, and limited token storage. No method of transmission or storage is 100%
          secure.
        </p>
      </Section>

      <Section title="7. Cookies">
        <p>
          We use essential cookies and similar technologies for authentication, session management,
          and preference storage (including locale and appearance). These are required for core
          functionality. You can control non-essential cookies through your browser settings where
          applicable.
        </p>
      </Section>

      <Section title="8. Your rights">
        <p>
          Depending on your location, you may have rights to access, correct, delete, or restrict
          processing of your personal data, or to object to certain processing. To exercise these
          rights, email{" "}
          <a
            href={`mailto:${contactEmail}`}
            className="text-primary underline-offset-2 hover:underline"
          >
            {contactEmail}
          </a>
          . We will respond within a reasonable time.
        </p>
        <p>
          You can disconnect social accounts at any time from the Accounts section of the dashboard.
          Disconnecting stops future API access from QueueOra but may not delete content already
          published on third-party platforms.
        </p>
      </Section>

      <Section title="9. International transfers">
        <p>
          Our service may process data in countries other than your own, including where our
          infrastructure or third-party providers operate. We take steps to protect data transferred
          internationally in line with applicable law.
        </p>
      </Section>

      <Section title="10. Children">
        <p>
          QueueOra is not directed at children under 13 (or the minimum age required in your
          jurisdiction). We do not knowingly collect personal information from children. Contact us if
          you believe a child has provided us data.
        </p>
      </Section>

      <Section title="11. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. We will post the revised version on
          this page and update the effective date. Continued use of QueueOra after changes means you
          accept the updated policy.
        </p>
      </Section>

      <Section title="12. Contact">
        <p>
          {entity}
          <br />
          Email:{" "}
          <a
            href={`mailto:${contactEmail}`}
            className="text-primary underline-offset-2 hover:underline"
          >
            {contactEmail}
          </a>
          <br />
          Website:{" "}
          <a href={siteUrl} className="text-primary underline-offset-2 hover:underline">
            {siteUrl}
          </a>
        </p>
      </Section>
    </LegalPageShell>
  );
}
