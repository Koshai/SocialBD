import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <Suspense fallback={<p className="p-12 text-center text-sm text-muted">Loading…</p>}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
