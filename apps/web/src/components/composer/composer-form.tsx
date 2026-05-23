"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, CardDescription, CardTitle } from "@socialbd/ui";

import { PostPreview } from "@/components/composer/post-preview";
import { TemplatePicker } from "@/components/composer/template-picker";
import { usePreferences } from "@/components/preferences/preferences-provider";
import type { PublicConnectedAccount } from "@/lib/connected-accounts";
import type { CaptionTone } from "@/lib/openai-client";
import { getPlatformLabel } from "@/lib/platform-labels";
import { bengaliTextClassName } from "@/lib/bengali-text";
import type { IdeaJson } from "@/lib/ideas-api";
import type { PostTemplate } from "@/lib/post-templates";

type ComposerFormProps = {
  channels: PublicConnectedAccount[];
  canPublishDirectly: boolean;
  promoteIdea?: IdeaJson | null;
};

type UploadedMedia = {
  mediaPath: string;
  mediaMimeType: string;
  previewUrl: string;
};

export function ComposerForm({ channels, canPublishDirectly, promoteIdea }: ComposerFormProps) {
  const router = useRouter();
  const { t } = usePreferences();
  const [connectedAccountId, setConnectedAccountId] = useState(channels[0]?.id ?? "");
  const [body, setBody] = useState(promoteIdea?.body ?? "");
  const [scheduledAt, setScheduledAt] = useState("");
  const [media, setMedia] = useState<UploadedMedia | null>(null);
  const [tone, setTone] = useState<CaptionTone>("casual");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiPending, setAiPending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (promoteIdea?.promoteMedia) {
      setMedia({
        mediaPath: promoteIdea.promoteMedia.mediaPath,
        mediaMimeType: promoteIdea.promoteMedia.mediaMimeType,
        previewUrl: promoteIdea.promoteMedia.previewUrl,
      });
      return;
    }

    if (!promoteIdea?.galleryImageId) return;

    let cancelled = false;
    void (async () => {
      setUploading(true);
      const response = await fetch("/api/media/from-gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ galleryImageId: promoteIdea.galleryImageId }),
      });
      const data = (await response.json()) as UploadedMedia & { error?: string };
      if (cancelled) return;
      setUploading(false);
      if (!response.ok) {
        setError(data.error ?? t("ideas.galleryImportFailed"));
        return;
      }
      setMedia({
        mediaPath: data.mediaPath,
        mediaMimeType: data.mediaMimeType,
        previewUrl: data.previewUrl,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [promoteIdea?.galleryImageId, promoteIdea?.promoteMedia, t]);

  if (channels.length === 0) {
    return (
      <Card>
        <CardTitle>{t("composer.noChannelsTitle")}</CardTitle>
        <CardDescription>{t("composer.noChannelsDesc")}</CardDescription>
      </Card>
    );
  }

  function pickImageFile(files: FileList | File[] | null | undefined) {
    if (!files) return null;
    const list = Array.from(files);
    return list.find((file) => file.type.startsWith("image/")) ?? null;
  }

  async function onImageSelected(file: File | null) {
    setError(null);
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t("composer.onlyImages"));
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/media/upload", { method: "POST", body: formData });
    const data = (await response.json()) as UploadedMedia & { error?: string };
    setUploading(false);

    if (!response.ok) {
      setError(data.error ?? t("common.couldNotUpload"));
      return;
    }

    setMedia({
      mediaPath: data.mediaPath,
      mediaMimeType: data.mediaMimeType,
      previewUrl: data.previewUrl,
    });
  }

  function clearMedia() {
    setMedia(null);
  }

  function applyTemplate(template: PostTemplate) {
    setError(null);
    if (body.trim() && !window.confirm(t("composer.confirmReplaceTemplate"))) {
      return;
    }
    setBody(template.caption);
  }

  async function generateCaption() {
    setError(null);
    setAiPending(true);

    const response = await fetch("/api/ai/caption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief: body || "A product update for our Facebook Page", tone }),
    });

    const data = (await response.json()) as { caption?: string; error?: string };
    setAiPending(false);

    if (!response.ok) {
      setError(data.error ?? t("common.couldNotGenerate"));
      return;
    }

    if (data.caption) {
      setBody(data.caption);
    }
  }

  async function savePost(options: {
    publishNow?: boolean;
    submitForApproval?: boolean;
    schedule?: boolean;
  }) {
    setError(null);

    const channel = channels.find((item) => item.id === connectedAccountId);
    const channelIsInstagram = channel?.platform === "instagram";
    const channelIsLinkedIn = channel?.platform === "linkedin_organization";

    if (channelIsInstagram && !media) {
      setError(t("composer.igImageRequired"));
      return;
    }

    if (!body.trim() && !media) {
      setError(
        channelIsLinkedIn ? t("posts.linkedinCaptionRequired") : t("composer.captionOrImage"),
      );
      return;
    }

    setPending(true);

    const scheduleIso =
      scheduledAt && (options.submitForApproval || options.schedule)
        ? new Date(scheduledAt).toISOString()
        : null;

    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        connectedAccountId,
        body,
        mediaPath: media?.mediaPath ?? null,
        mediaMimeType: media?.mediaMimeType ?? null,
        scheduledAt: options.publishNow ? null : scheduleIso,
        publishNow: options.publishNow === true,
        submitForApproval: options.submitForApproval === true,
        ideaId: promoteIdea?.id ?? null,
      }),
    });

    const data = (await response.json()) as { error?: string };
    setPending(false);

    if (!response.ok) {
      setError(data.error ?? t("common.couldNotSavePost"));
      return;
    }

    setBody("");
    setScheduledAt("");
    setMedia(null);
    router.refresh();
  }

  const hasSchedule = Boolean(scheduledAt);
  const busy = pending || uploading || aiPending;
  const selectedChannel = channels.find((channel) => channel.id === connectedAccountId);
  const isInstagram = selectedChannel?.platform === "instagram";
  const previewPlatform = selectedChannel?.platform ?? "facebook_page";

  return (
    <Card>
      <CardTitle>{t("composer.title")}</CardTitle>
      <CardDescription>
        {canPublishDirectly ? t("composer.descPublish") : t("composer.descApproval")}
      </CardDescription>

      {promoteIdea ? (
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <p className="font-medium text-primary">
            {t("composer.fromIdeaBanner", { title: promoteIdea.title })}
          </p>
          <p className="mt-1 text-muted">{t("composer.fromIdeaHint")}</p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void savePost({});
          }}
        >
        <label className="block space-y-1 text-sm">
          <span className="font-medium">{t("composer.channel")}</span>
          <select
            value={connectedAccountId}
            onChange={(e) => setConnectedAccountId(e.target.value)}
            required
            className="h-10 w-full rounded-lg border border-border bg-background px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.displayName} ({getPlatformLabel(channel.platform, t)})
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-2 text-sm">
          <span className="font-medium">
            {isInstagram ? t("composer.imageRequired") : t("composer.imageOptional")}
          </span>
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!busy) setIsDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.currentTarget === e.target) setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              if (busy) return;
              const file = pickImageFile(e.dataTransfer.files);
              void onImageSelected(file);
            }}
            className={[
              "rounded-xl border-2 border-dashed px-4 py-6 transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border bg-background hover:border-primary/40",
            ].join(" ")}
          >
            <p className="text-center text-sm text-muted">
              {isDragging ? t("composer.dropHere") : t("composer.dragDrop")}
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              disabled={busy}
              onChange={(e) => void onImageSelected(e.target.files?.[0] ?? null)}
              className="mt-3 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
            />
          </div>
          {uploading ? <p className="text-xs text-muted">{t("composer.uploading")}</p> : null}
          {media ? (
            <div className="flex items-start gap-3 rounded-lg border border-border p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={media.previewUrl}
                alt="Upload preview"
                className="h-24 w-24 rounded-md object-cover"
              />
              <Button type="button" variant="outline" size="sm" onClick={clearMedia} disabled={busy}>
                {t("composer.removeImage")}
              </Button>
            </div>
          ) : null}
        </div>

        <TemplatePicker disabled={busy} onApply={applyTemplate} />

        <label className="block space-y-1 text-sm">
          <span className="font-medium">{t("composer.caption")}</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            lang={bengaliTextClassName(body) ? "bn" : undefined}
            placeholder={t("composer.captionPlaceholder")}
            className={`w-full rounded-lg border border-border bg-background px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${bengaliTextClassName(body)}`}
          />
          <p className="text-xs text-muted">{t("composer.banglaKeyboardHint")}</p>
        </label>

        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium">{t("composer.aiTone")}</span>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as CaptionTone)}
              disabled={busy}
              className="h-10 rounded-lg border border-border bg-background px-3"
            >
              <option value="casual">{t("composer.toneCasual")}</option>
              <option value="professional">{t("composer.toneProfessional")}</option>
              <option value="promotional">{t("composer.tonePromotional")}</option>
            </select>
          </label>
          <Button type="button" variant="outline" disabled={busy} onClick={() => void generateCaption()}>
            {aiPending ? t("composer.generating") : t("composer.generateCaption")}
          </Button>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="font-medium">{t("composer.scheduleOptional")}</span>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            disabled={busy}
            className="h-10 w-full max-w-xs rounded-lg border border-border bg-background px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </label>

        {error ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="outline" disabled={busy || (canPublishDirectly && hasSchedule)}>
            {pending ? t("composer.saving") : t("composer.saveDraft")}
          </Button>

          {canPublishDirectly ? (
            <>
              <Button
                type="button"
                disabled={busy || !hasSchedule}
                onClick={() => void savePost({ schedule: true })}
              >
                {pending ? t("composer.saving") : t("composer.schedulePost")}
              </Button>
              <Button
                type="button"
                disabled={busy || hasSchedule}
                onClick={() => void savePost({ publishNow: true })}
              >
                {pending ? t("composer.publishing") : t("composer.publishNow")}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              disabled={busy}
              onClick={() => void savePost({ submitForApproval: true })}
            >
              {pending
                ? t("composer.submitting")
                : hasSchedule
                  ? t("composer.submitApprovalScheduled")
                  : t("composer.submitApproval")}
            </Button>
          )}
        </div>
        </form>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <PostPreview
            platform={previewPlatform}
            displayName={selectedChannel?.displayName ?? t("common.yourPage")}
            username={selectedChannel?.username}
            body={body}
            mediaPreviewUrl={media?.previewUrl ?? null}
          />
        </aside>
      </div>
    </Card>
  );
}
