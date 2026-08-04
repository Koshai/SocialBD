import type { Metadata } from "next";
import Link from "next/link";

import { LegalPageShell } from "@/components/marketing/legal-page-shell";
import {
  getLegalEntityName,
  getPrivacyContactEmail,
  getPublicSiteUrl,
} from "@/lib/legal/site-legal";

export const metadata: Metadata = {
  title: "Terms of Service — QueueOra",
  description: "Terms that govern use of the QueueOra social media management platform.",
};

const EFFECTIVE_DATE = "3 August 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default function TermsOfServicePage() {
  const entity = getLegalEntityName();
  const contactEmail = getPrivacyContactEmail();
  const siteUrl = getPublicSiteUrl();

  return (
    <LegalPageShell title="Terms of Service">
      <p className="text-sm text-muted">
        <strong className="text-foreground">Effective date:</strong> {EFFECTIVE_DATE}
      </p>

      <Section title="1. Agreement">
        <p>
          These Terms of Service (“Terms”) are a contract between you and{" "}
          {entity} (“<strong className="text-foreground">QueueOra</strong>”, “we”, “us”) for
          access to and use of the website and services available at{" "}
          <a href={siteUrl} className="text-primary underline-offset-2 hover:underline">
            {siteUrl}
          </a>{" "}
          (the “Service”). By creating an account or using the Service, you agree to these Terms and
          our{" "}
          <Link href="/privacy" className="text-primary underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <p>
          If you use the Service on behalf of a company or other organization, you represent that you
          have authority to bind that organization, and “you” includes that organization.
        </p>
      </Section>

      <Section title="2. The Service">
        <p>
          QueueOra is a social media management product that helps teams plan, compose, schedule,
          approve, and publish content, connect Facebook Pages, Instagram professional accounts,
          and LinkedIn company pages, view limited analytics, run optional AI-assisted caption
          tools, and (where enabled) configure automated reply agents for messages and comments.
        </p>
        <p>
          Features available to you depend on your workspace configuration, third-party platform
          availability, app permissions, and Meta, LinkedIn, or other product reviews and platform
          policies. We may add, change, or remove features with reasonable notice when practical.
        </p>
      </Section>

      <Section title="3. Accounts and eligibility">
        <p>
          You must provide accurate registration information and keep your credentials secure. You are
          responsible for activity under your account. You must be old enough to form a binding
          contract in your jurisdiction (and at least 13, or the higher age required where you live).
        </p>
        <p>
          Workspace owners and admins control invitations, roles, and connected channels. You are
          responsible for authorized access you grant to team members.
        </p>
      </Section>

      <Section title="4. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Use the Service for spam, illegal content, harassment, fraud, or phishing;</li>
          <li>
            Post or schedule content that violates Meta, LinkedIn, or other platform terms,
            advertising policies, or intellectual property rights of others;
          </li>
          <li>
            Use AI agents or messaging features to mislead users about being human where disclosure
            is required, or to send unsolicited bulk messages;
          </li>
          <li>Attempt to probe, disrupt, reverse engineer, or overload the Service;</li>
          <li>Resell the Service without our permission or scrape our product beyond normal use;</li>
          <li>
            Use connected APIs in ways Meta or LinkedIn prohibit (including undeclared use of data
            outside the Service).
          </li>
        </ul>
        <p>
          We may suspend or terminate accounts that violate these Terms or create risk for the
          Service or other users.
        </p>
      </Section>

      <Section title="5. Your content and social platforms">
        <p>
          You retain ownership of content you submit to QueueOra (“User Content”). You grant us a
          limited license to host, process, transmit, and display User Content only as needed to
          operate the Service (including publishing to platforms you connect when you take or
          schedule that action).
        </p>
        <p>
          You are solely responsible for User Content and for complying with third-party platform
          rules. QueueOra does not guarantee that a platform will accept, rank, or retain your
          posts. Platform errors, API changes, account restrictions, and App Review outcomes are
          outside our full control.
        </p>
        <p>
          Disconnecting a channel stops future API actions from QueueOra; it does not remove content
          already published on third-party sites.
        </p>
      </Section>

      <Section title="6. Connected accounts and permissions">
        <p>
          When you connect Meta or LinkedIn (or similar) accounts, you authorize us to act using the
          permissions you grant (for example, listing pages, publishing, reading engagement where
          allowed, and sending message replies when agent features are enabled). You may disconnect
          channels in the dashboard at any time.
        </p>
        <p>
          You represent that you have the right to administer the pages, Instagram professional
          accounts, and LinkedIn organizations you connect.
        </p>
      </Section>

      <Section title="7. AI features">
        <p>
          Optional AI features (such as caption suggestions or automated reply drafts) send inputs
          you provide to third-party AI providers under our Privacy Policy. Outputs may be
          inaccurate or inappropriate; you must review before publishing or sending. AI output is
          not legal, medical, or professional advice.
        </p>
      </Section>

      <Section title="8. Intellectual property">
        <p>
          The Service, including software, branding, templates, and design (excluding User Content),
          is owned by {entity} or its licensors. You may not copy, modify, or create derivative works
          of the Service except as allowed by law or our written permission.
        </p>
      </Section>

      <Section title="9. Fees">
        <p>
          Some features may be free during early access; paid plans, if introduced, will be described
          in the product or separate order terms. If we charge fees, you authorize the stated charges
          for the billing period you select. Taxes may apply where required.
        </p>
      </Section>

      <Section title="10. Disclaimers">
        <p>
          THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM EXTENT PERMITTED BY LAW,
          WE DISCLAIM WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
          NON-INFRINGEMENT. We do not warrant uninterrupted or error-free operation, or that
          third-party platforms will remain compatible.
        </p>
      </Section>

      <Section title="11. Limitation of liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, {entity.toUpperCase()} AND ITS SUPPLIERS WILL NOT BE
          LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOST
          PROFITS, REVENUE, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE.
        </p>
        <p>
          Our total liability for claims relating to the Service will not exceed the greater of (a)
          amounts you paid us for the Service in the twelve (12) months before the claim, or (b) one
          hundred U.S. dollars (US$100) if you have not paid fees.
        </p>
        <p>
          Some jurisdictions do not allow certain limitations; in those places our liability is
          limited to the fullest extent allowed.
        </p>
      </Section>

      <Section title="12. Indemnity">
        <p>
          You will defend and indemnify {entity} against claims arising from your User Content, your
          use of connected platform accounts, or your violation of these Terms or applicable law,
          including platform terms.
        </p>
      </Section>

      <Section title="13. Termination">
        <p>
          You may stop using the Service at any time. We may suspend or terminate access if you
          breach these Terms, if required by law or platform partners, or if we discontinue the
          Service. Provisions that by nature should survive (including intellectual property,
          disclaimers, liability limits, and indemnity) survive termination.
        </p>
      </Section>

      <Section title="14. Changes">
        <p>
          We may update these Terms by posting a revised version on this page and updating the
          effective date. Material changes will take effect after a reasonable period or upon your
          continued use after notice. If you disagree, stop using the Service.
        </p>
      </Section>

      <Section title="15. Governing law">
        <p>
          These Terms are governed by the laws of the United States and the State of Delaware
          (excluding conflict-of-law rules), unless mandatory consumer protections in your country
          require otherwise. Courts in that jurisdiction will have exclusive venue for disputes that
          cannot be resolved informally, subject to applicable consumer rights.
        </p>
      </Section>

      <Section title="16. Contact">
        <p>
          Questions about these Terms:{" "}
          <a
            href={`mailto:${contactEmail}`}
            className="text-primary underline-offset-2 hover:underline"
          >
            {contactEmail}
          </a>
          <br />
          {entity}
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
