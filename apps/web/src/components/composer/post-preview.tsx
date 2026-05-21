"use client";

import { bengaliTextClassName } from "@/lib/bengali-text";
import { getPlatformLabel } from "@/lib/platform-labels";
import { usePreferences } from "@/components/preferences/preferences-provider";

type PostPreviewProps = {
  platform: string;
  displayName: string;
  username?: string | null;
  body: string;
  mediaPreviewUrl?: string | null;
};

function PreviewPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex aspect-square w-full items-center justify-center bg-muted/30 text-xs text-muted">
      {label}
    </div>
  );
}

export function PostPreview(props: PostPreviewProps) {
  const { t } = usePreferences();
  const isInstagram = props.platform === "instagram";
  const isLinkedIn = props.platform === "linkedin_organization";
  const caption = props.body.trim() || (isInstagram ? t("composer.previewIgCaption") : t("composer.previewCaption"));
  const captionClass = bengaliTextClassName(caption);
  const handle = props.username
    ? `@${props.username.replace(/^@/, "")}`
    : props.displayName;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {t("composer.previewLabel")} · {getPlatformLabel(props.platform, t)}
      </p>

      <div className="overflow-hidden rounded-lg border border-border bg-surface text-sm shadow-sm">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <span
            aria-hidden
            className={
              isInstagram
                ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 via-pink-500 to-purple-600 text-[10px] font-bold text-white"
                : isLinkedIn
                  ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#0a66c2] text-xs font-bold text-white"
                  : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
            }
          >
            {(isInstagram ? handle : props.displayName).slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{isInstagram ? handle : props.displayName}</p>
            {!isInstagram ? <p className="text-xs text-muted">Just now · Public</p> : null}
          </div>
        </div>

        {!isInstagram ? (
          <p className={`whitespace-pre-wrap px-3 py-2 text-[13px] leading-snug ${captionClass}`}>
            {caption}
          </p>
        ) : null}

        {props.mediaPreviewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={props.mediaPreviewUrl}
            alt=""
            className={isInstagram ? "aspect-square w-full object-cover" : "max-h-72 w-full object-cover"}
          />
        ) : (
          <div className={isInstagram ? "" : "mx-3 mb-3 overflow-hidden rounded-md border border-dashed border-border"}>
            <PreviewPlaceholder label={t("composer.previewCaption")} />
          </div>
        )}

        {isInstagram ? (
          <div className="space-y-1 px-3 py-2">
            <p className="text-xs text-muted">♥ 💬 ↗</p>
            <p className={`whitespace-pre-wrap text-[13px] leading-snug ${captionClass}`}>
              <span className="font-semibold">{handle} </span>
              {caption}
            </p>
          </div>
        ) : (
          <div className="flex gap-4 border-t border-border px-3 py-2 text-xs text-muted">
            <span>Like</span>
            <span>Comment</span>
            <span>Share</span>
          </div>
        )}
      </div>

      <p className="text-xs text-muted">
        {isInstagram
          ? t("composer.previewIgHint")
          : isLinkedIn
            ? t("composer.previewLinkedInHint")
            : t("composer.previewFbHint")}
      </p>
    </div>
  );
}
