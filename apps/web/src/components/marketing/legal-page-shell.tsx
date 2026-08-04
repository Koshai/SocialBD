import Link from "next/link";
import type { ReactNode } from "react";

import { QueueOraLogo } from "@socialbd/ui";

type LegalPageShellProps = {
  title: string;
  children: ReactNode;
};

export function LegalPageShell({ title, children }: LegalPageShellProps) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-6 py-4">
          <Link href="/" className="rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <QueueOraLogo showTagline={false} />
          </Link>
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <article className="prose-legal space-y-8">
          <header className="space-y-2 border-b border-border pb-8">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          </header>
          {children}
        </article>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted">
        <p>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy Policy
          </Link>
          {" · "}
          <Link href="/terms" className="hover:text-foreground">
            Terms of Service
          </Link>
          {" · "}
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
        </p>
        <p className="mt-2">© {new Date().getFullYear()} QueueOra</p>
      </footer>
    </div>
  );
}
