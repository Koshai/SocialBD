"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, CardDescription, CardTitle } from "@socialbd/ui";

import type { PublicConnectedAccount } from "@/lib/connected-accounts";

type ComposerFormProps = {
  channels: PublicConnectedAccount[];
};

export function ComposerForm({ channels }: ComposerFormProps) {
  const router = useRouter();
  const [connectedAccountId, setConnectedAccountId] = useState(channels[0]?.id ?? "");
  const [body, setBody] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (channels.length === 0) {
    return (
      <Card>
        <CardTitle>No channels connected</CardTitle>
        <CardDescription>
          Connect a Facebook Page from Accounts before composing a post.
        </CardDescription>
      </Card>
    );
  }

  async function savePost(publishNow: boolean) {
    setError(null);
    setPending(true);

    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        connectedAccountId,
        body,
        scheduledAt: publishNow ? null : scheduledAt ? new Date(scheduledAt).toISOString() : null,
        publishNow,
      }),
    });

    const data = (await response.json()) as { error?: string };
    setPending(false);

    if (!response.ok) {
      setError(data.error ?? "Could not save post.");
      return;
    }

    setBody("");
    setScheduledAt("");
    router.refresh();
  }

  const hasSchedule = Boolean(scheduledAt);

  return (
    <Card>
      <CardTitle>New post</CardTitle>
      <CardDescription>
        Save a draft, schedule for later, or publish now to your Facebook Page. Ensure the worker
        is running (<code className="text-xs">pnpm dev</code> includes it) and Redis is up.
      </CardDescription>

      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void savePost(false);
        }}
      >
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Channel</span>
          <select
            value={connectedAccountId}
            onChange={(e) => setConnectedAccountId(e.target.value)}
            required
            className="h-10 w-full rounded-lg border border-border bg-background px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.displayName}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium">Caption</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={6}
            placeholder="Write your post..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium">Schedule (optional)</span>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="h-10 w-full max-w-xs rounded-lg border border-border bg-background px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
          <span className="block text-xs text-muted">
            Pick a future time, then use Schedule post. Leave empty for draft or publish now.
          </span>
        </label>

        {error ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="outline" disabled={pending || hasSchedule}>
            {pending ? "Saving..." : "Save draft"}
          </Button>
          <Button
            type="button"
            disabled={pending || !hasSchedule}
            onClick={() => void savePost(false)}
          >
            {pending ? "Saving..." : "Schedule post"}
          </Button>
          <Button type="button" disabled={pending || hasSchedule} onClick={() => void savePost(true)}>
            {pending ? "Publishing..." : "Publish now"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
