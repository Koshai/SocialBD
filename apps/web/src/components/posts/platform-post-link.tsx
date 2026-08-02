"use client";

import { useState } from "react";

import { usePreferences } from "@/components/preferences/preferences-provider";
import { canOpenPlatformPost } from "@/lib/facebook-boost";

type PlatformPostLinkProps = {
  postId: string;
  platform: string;
  status: string;
  externalPostId: string | null | undefined;
  pageId: string | null | undefined;
};

export function PlatformPostLink({
  postId,
  platform,
  status,
  externalPostId,
  pageId,
}: PlatformPostLinkProps) {
  const { t } = usePreferences();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canOpenPlatformPost({ platform, status, externalPostId, pageId })) {
    return null;
  }

  const label =
    platform === "instagram" ? t("posts.viewOnInstagram") : t("posts.viewOnFacebook");

  async function openPlatform() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/posts/${postId}/platform-link`, { cache: "no-store" });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? t("posts.couldNotOpenPlatform"));
        return;
      }
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      setError(t("posts.couldNotOpenPlatform"));
    } finally {
      setPending(false);
    }
  }

  return (
    <p className="mt-2">
      <button
        type="button"
        onClick={() => void openPlatform()}
        disabled={pending}
        className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
      >
        {pending ? t("posts.openingPlatform") : label}
      </button>
      <span className="mt-0.5 block text-xs text-muted">{t("posts.viewOnPlatformHint")}</span>
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </p>
  );
}
