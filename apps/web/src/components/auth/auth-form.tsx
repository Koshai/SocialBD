"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Card, CardDescription, CardTitle, SocialBDLogo } from "@socialbd/ui";

import { authClient } from "@/lib/auth-client";

type AuthMode = "login" | "signup";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isSignup = mode === "signup";
  const nextPath = searchParams.get("next");
  const redirectTo =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "");

    try {
      if (isSignup) {
        const result = await authClient.signUp.email({
          email,
          password,
          name,
          callbackURL: redirectTo,
        });

        if (result.error) {
          setError(result.error.message ?? "Could not create account.");
          return;
        }

        setNotice(
          `We sent a verification link to ${email}. Open it, then sign in${nextPath ? " to continue to your invitation" : ""}.`,
        );
        return;
      }

      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: redirectTo,
      });

      if (result.error) {
        const message = result.error.message ?? "Invalid email or password.";
        if (message.toLowerCase().includes("verif")) {
          setError(`${message} Check your inbox for the verification link, then try again.`);
        } else {
          setError(message);
        }
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12">
      <Card className="w-full space-y-6">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <SocialBDLogo showTagline={false} />
          </div>
          <div>
            <CardTitle className="text-2xl">
              {isSignup ? "Create your account" : "Welcome back"}
            </CardTitle>
            <CardDescription>
              {isSignup
                ? "We will email you a verification link before you can sign in or accept invites."
                : "Sign in to manage your SocialBD workspaces."}
            </CardDescription>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          {isSignup ? (
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Name</span>
              <input
                name="name"
                type="text"
                autoComplete="name"
                required
                disabled={pending}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
              />
            </label>
          ) : null}

          <label className="block space-y-1 text-sm">
            <span className="font-medium">Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={pending}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium">Password</span>
            <input
              name="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={8}
              disabled={pending}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
            />
          </label>

          {notice ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {notice}
            </p>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            variant={isSignup ? "secondary" : "default"}
            disabled={pending}
          >
            {pending ? "Please wait..." : isSignup ? "Create account" : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted">
          {isSignup ? "Already have an account?" : "New to SocialBD?"}{" "}
          <Link
            href={
              isSignup
                ? nextPath
                  ? `/login?next=${encodeURIComponent(nextPath)}`
                  : "/login"
                : nextPath
                  ? `/signup?next=${encodeURIComponent(nextPath)}`
                  : "/signup"
            }
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            {isSignup ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </Card>
    </main>
  );
}
