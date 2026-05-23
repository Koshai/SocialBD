"use client";

import { usePreferences } from "@/components/preferences/preferences-provider";
import {
  buildFacebookBoostHandoffUrl,
  canBoostFacebookPost,
} from "@/lib/facebook-boost";

type FacebookBoostLinkProps = {
  platform: string;
  status: string;
  externalPostId: string | null | undefined;
  pageId: string | null | undefined;
};

export function FacebookBoostLink({
  platform,
  status,
  externalPostId,
  pageId,
}: FacebookBoostLinkProps) {
  const { t } = usePreferences();

  if (!canBoostFacebookPost({ platform, status, externalPostId, pageId })) {
    return null;
  }

  const href = buildFacebookBoostHandoffUrl(externalPostId!, pageId!);
  if (!href) return null;

  return (
    <p className="mt-2">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-medium text-primary hover:underline"
      >
        {t("posts.boostOnFacebook")}
      </a>
      <span className="mt-0.5 block text-xs text-muted">{t("posts.boostOnFacebookHint")}</span>
    </p>
  );
}
