import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthLoadingFallback } from "@/components/auth/auth-loading-fallback";

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
