"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, CardDescription, CardTitle } from "@socialbd/ui";

import { usePreferences } from "@/components/preferences/preferences-provider";
import { authClient } from "@/lib/auth-client";
import { slugify } from "@/lib/slugify";

export function CreateWorkspaceForm() {
  const { t } = usePreferences();
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const workspaceSlug = slugify(slug || name);
    if (!workspaceSlug) {
      setError(t("workspace.needSlug"));
      setPending(false);
      return;
    }

    const slugCheck = await authClient.organization.checkSlug({ slug: workspaceSlug });
    if (slugCheck.error || !slugCheck.data?.status) {
      setError(t("workspace.slugTaken"));
      setPending(false);
      return;
    }

    const created = await authClient.organization.create({
      name: name.trim(),
      slug: workspaceSlug,
    });

    if (created.error || !created.data) {
      setError(created.error?.message ?? t("workspace.couldNotCreate"));
      setPending(false);
      return;
    }

    await authClient.organization.setActive({
      organizationId: created.data.id,
    });

    router.refresh();
    router.push("/dashboard");
    setPending(false);
  }

  return (
    <Card className="max-w-lg">
      <CardTitle>{t("workspace.createYourWorkspace")}</CardTitle>
      <CardDescription>{t("workspace.createDesc")}</CardDescription>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">{t("workspace.workspaceName")}</span>
          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            placeholder={t("workspace.namePlaceholder")}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium">{t("workspace.urlSlug")}</span>
          <span className="block text-xs text-muted">
            {t("workspace.slugHint", { slug: slug || "your-slug" })}
          </span>
          <input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            required
            className="h-10 w-full rounded-lg border border-border bg-background px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </label>

        {error ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t("workspace.creating") : t("workspace.createWorkspace")}
        </Button>
      </form>
    </Card>
  );
}
