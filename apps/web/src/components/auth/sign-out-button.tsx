"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@socialbd/ui";

import { usePreferences } from "@/components/preferences/preferences-provider";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const { t } = usePreferences();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    await authClient.signOut();
    router.push("/login");
    router.refresh();
    setPending(false);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleSignOut} disabled={pending}>
      {pending ? t("auth.signingOut") : t("auth.signOut")}
    </Button>
  );
}
