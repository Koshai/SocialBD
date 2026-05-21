import { getPlatformLabel } from "@/lib/platform-labels";

type PostPreviewProps = {
  platform: string;
  displayName: string;
  username?: string | null;
  body: string;
  mediaPreviewUrl?: string | null;
};

function PreviewPlaceholder() {
  return (
    <div className="flex aspect-square w-full items-center justify-center bg-muted/30 text-xs text-muted">
      Image preview
    </div>
  );
}

function FacebookPreview({ displayName, body, mediaPreviewUrl }: PostPreviewProps) {
  const caption = body.trim() || "Your caption will appear here…";

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface text-sm shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
        >
          {displayName.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold">{displayName}</p>
          <p className="text-xs text-muted">Just now · Public</p>
        </div>
      </div>
      <p className="whitespace-pre-wrap px-3 py-2 text-[13px] leading-snug">{caption}</p>
      {mediaPreviewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaPreviewUrl} alt="" className="max-h-72 w-full object-cover" />
      ) : (
        <div className="mx-3 mb-3 overflow-hidden rounded-md border border-dashed border-border">
          <PreviewPlaceholder />
        </div>
      )}
      <div className="flex gap-4 border-t border-border px-3 py-2 text-xs text-muted">
        <span>Like</span>
        <span>Comment</span>
        <span>Share</span>
      </div>
    </div>
  );
}

function InstagramPreview({ displayName, username, body, mediaPreviewUrl }: PostPreviewProps) {
  const handle = username ? `@${username.replace(/^@/, "")}` : displayName;
  const caption = body.trim() || "Caption preview…";

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface text-sm shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 via-pink-500 to-purple-600 text-[10px] font-bold text-white"
        >
          {handle.slice(1, 2).toUpperCase()}
        </span>
        <p className="truncate font-semibold">{handle}</p>
      </div>
      {mediaPreviewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaPreviewUrl} alt="" className="aspect-square w-full object-cover" />
      ) : (
        <PreviewPlaceholder />
      )}
      <div className="space-y-1 px-3 py-2">
        <p className="text-xs text-muted">♥ 💬 ↗</p>
        <p className="whitespace-pre-wrap text-[13px] leading-snug">
          <span className="font-semibold">{handle} </span>
          {caption}
        </p>
      </div>
    </div>
  );
}

export function PostPreview(props: PostPreviewProps) {
  const isInstagram = props.platform === "instagram";

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Preview · {getPlatformLabel(props.platform)}
      </p>
      {isInstagram ? <InstagramPreview {...props} /> : <FacebookPreview {...props} />}
      {isInstagram ? (
        <p className="text-xs text-muted">Instagram posts need a square-friendly image (1:1 works best).</p>
      ) : (
        <p className="text-xs text-muted">Facebook shows caption above the image when both are present.</p>
      )}
    </div>
  );
}
