import Link from "next/link";
import { Card, CardDescription, CardTitle, SocialBDLogo } from "@socialbd/ui";

const features = [
  {
    title: "Publish & schedule",
    body: "Facebook, Instagram, LinkedIn - calendar and queue.",
  },
  {
    title: "Team workflows",
    body: "Draft, review, and approve before anything goes live.",
  },
  {
    title: "Pay in BDT",
    body: "bKash, Nagad, Rocket, and cards - no USD surprise.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <SocialBDLogo showTagline={false} />
          <nav aria-label="Primary" className="flex gap-3">
            <Link
              href="#features"
              className="rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Features
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto flex max-w-6xl flex-1 flex-col justify-center gap-8 px-6 py-20"
      >
        <div className="max-w-2xl space-y-6">
          <p className="inline-flex rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
            Design system + Better Auth foundation
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Manage every channel from <span className="text-primary">one dashboard</span>
          </h1>
          <p className="text-lg text-muted">
            SocialBD is built for Bangladesh - BDT pricing, bKash and Nagad, Bangla support,
            and templates for the moments that matter locally.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/25 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Start free
            </Link>
            <Link
              href="#features"
              className="rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              See features
            </Link>
          </div>
        </div>

        <section id="features" aria-labelledby="features-heading" className="grid gap-4 sm:grid-cols-3">
          <h2 id="features-heading" className="sr-only">
            Platform features
          </h2>
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.body}</CardDescription>
            </Card>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted">
        (c) {new Date().getFullYear()} SocialBD
      </footer>
    </div>
  );
}