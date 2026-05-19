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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        connectedAccountId,
        body,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
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

  return (
    <Card>
      <CardTitle>New post</CardTitle>
      <CardDescription>
        Draft now or pick a future time to schedule. Publishing to Facebook runs in the next
        phase (worker).
      </CardDescription>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
          <span className="block text-xs text-muted">Leave empty to save as draft.</span>
        </label>

        {error ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : scheduledAt ? "Schedule post" : "Save draft"}
        </Button>
      </form>
    </Card>
  );
}
