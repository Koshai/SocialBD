"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, CardDescription, CardTitle } from "@socialbd/ui";
import type { IdeaStatus } from "@socialbd/db";

import { usePreferences } from "@/components/preferences/preferences-provider";
import { IdeaGalleryPicker } from "@/components/ideas/idea-gallery-picker";
import type { IdeaJson } from "@/lib/ideas-api";
import { serializeIdeaCounts } from "@/lib/ideas-api";
import {
  emptyGallerySelection,
  selectionFromIdea,
  type IdeaGallerySelection,
} from "@/lib/idea-gallery-selection";
import type { CaptionTone } from "@/lib/openai-client";

type CampaignJson = { id: string; name: string };
type TagJson = { id: string; name: string };

type IdeasWorkspaceProps = {
  initialIdeas: IdeaJson[];
  initialCounts: ReturnType<typeof serializeIdeaCounts>;
  initialCampaigns: CampaignJson[];
  initialTags: TagJson[];
};

const STATUS_TABS: Array<{ id: IdeaStatus | "all"; labelKey: string }> = [
  { id: "all", labelKey: "ideas.filterAll" },
  { id: "brainstorm", labelKey: "ideas.filterBrainstorm" },
  { id: "ready", labelKey: "ideas.filterReady" },
  { id: "archived", labelKey: "ideas.filterArchived" },
];

type EditorState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; idea: IdeaJson };

export function IdeasWorkspace({
  initialIdeas,
  initialCounts,
  initialCampaigns,
  initialTags,
}: IdeasWorkspaceProps) {
  const { t } = usePreferences();
  const [ideas, setIdeas] = useState(initialIdeas);
  const [counts, setCounts] = useState(initialCounts);
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [tags, setTags] = useState(initialTags);
  const [status, setStatus] = useState<IdeaStatus | "all">("brainstorm");
  const [campaignId, setCampaignId] = useState<string>("all");
  const [tagId, setTagId] = useState<string>("all");
  const [editor, setEditor] = useState<EditorState>({ mode: "closed" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCampaignName, setNewCampaignName] = useState("");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editorStatus, setEditorStatus] = useState<IdeaStatus>("brainstorm");
  const [editorCampaignId, setEditorCampaignId] = useState<string>("");
  const [tagInput, setTagInput] = useState("");
  const [aiBrief, setAiBrief] = useState("");
  const [aiTone, setAiTone] = useState<CaptionTone>("casual");
  const [aiPending, setAiPending] = useState(false);
  const [brainstormResults, setBrainstormResults] = useState<
    Array<{ title: string; body: string; tagNames: string[] }> | null
  >(null);
  const [gallerySelection, setGallerySelection] = useState<IdeaGallerySelection>(
    emptyGallerySelection(),
  );

  const statusTabs = useMemo(
    () =>
      STATUS_TABS.map((tab) => ({
        ...tab,
        label: t(tab.labelKey),
        count: counts[tab.id] ?? 0,
      })),
    [counts, t],
  );

  const fetchIdeas = useCallback(async () => {
    const params = new URLSearchParams({
      status,
      campaignId,
      tagId,
    });
    const response = await fetch(`/api/ideas?${params.toString()}`, { cache: "no-store" });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? t("ideas.couldNotLoad"));
      return;
    }
    setIdeas(json.ideas as IdeaJson[]);
    setCounts(json.counts);
    setError(null);
  }, [status, campaignId, tagId, t]);

  // SSR loads status=brainstorm + all campaigns/tags — skip first duplicate fetch.
  const [filtersReady, setFiltersReady] = useState(false);
  useEffect(() => {
    if (!filtersReady) {
      setFiltersReady(true);
      if (status === "brainstorm" && campaignId === "all" && tagId === "all") {
        return;
      }
    }
    void fetchIdeas();
  }, [fetchIdeas, filtersReady, status, campaignId, tagId]);

  function openCreate() {
    setTitle("");
    setBody("");
    setEditorStatus("brainstorm");
    setEditorCampaignId("");
    setTagInput("");
    setGallerySelection(emptyGallerySelection());
    setEditor({ mode: "create" });
    setError(null);
  }

  function openCreateWithGallery(selection: IdeaGallerySelection) {
    setTitle("");
    setBody("");
    setEditorStatus("brainstorm");
    setEditorCampaignId("");
    setTagInput("");
    setGallerySelection(selection);
    setEditor({ mode: "create" });
    setError(null);
  }

  function openEdit(idea: IdeaJson) {
    setTitle(idea.title);
    setBody(idea.body);
    setEditorStatus(idea.status);
    setEditorCampaignId(idea.campaignId ?? "");
    setTagInput(idea.tags.join(", "));
    setGallerySelection(selectionFromIdea(idea));
    setEditor({ mode: "edit", idea });
    setError(null);
  }

  function closeEditor() {
    setEditor({ mode: "closed" });
  }

  function applyGeneratedIdea(idea: { title: string; body: string; tagNames: string[] }) {
    if (
      (title.trim() || body.trim()) &&
      !window.confirm(t("ideas.aiConfirmReplace"))
    ) {
      return;
    }
    setTitle(idea.title);
    setBody(idea.body);
    if (idea.tagNames.length > 0) {
      setTagInput(idea.tagNames.join(", "));
    }
    if (editor.mode === "closed") {
      setEditor({ mode: "create" });
    }
    setError(null);
  }

  async function callAi(action: "generate" | "expand" | "brainstorm") {
    setError(null);
    setAiPending(true);

    const response = await fetch("/api/ai/idea", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        brief: aiBrief || body || title,
        title,
        body,
        tone: aiTone,
        campaignId: editorCampaignId || null,
        count: 3,
      }),
    });

    const json = (await response.json()) as {
      error?: string;
      idea?: { title: string; body: string; tagNames: string[] };
      ideas?: Array<{ title: string; body: string; tagNames: string[] }>;
    };

    setAiPending(false);

    if (!response.ok) {
      setError(json.error ?? t("common.couldNotGenerate"));
      return;
    }

    if (action === "brainstorm" && json.ideas) {
      setBrainstormResults(json.ideas);
      return;
    }

    if (json.idea) {
      applyGeneratedIdea(json.idea);
      setBrainstormResults(null);
    }
  }

  async function saveBrainstormIdeas() {
    if (!brainstormResults?.length) return;
    if (!window.confirm(t("ideas.confirmSaveAll", { count: brainstormResults.length }))) {
      return;
    }

    setPending(true);
    setError(null);

    for (const idea of brainstormResults) {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: idea.title,
          body: idea.body,
          status: "brainstorm",
          campaignId: campaignId !== "all" ? campaignId : null,
          tagNames: idea.tagNames,
        }),
      });

      if (!response.ok) {
        const json = await response.json();
        setError(json.error ?? t("ideas.couldNotSave"));
        setPending(false);
        return;
      }
    }

    setPending(false);
    setBrainstormResults(null);
    await fetchIdeas();
    const tagsRes = await fetch("/api/tags", { cache: "no-store" });
    if (tagsRes.ok) {
      const tagsJson = (await tagsRes.json()) as { tags: TagJson[] };
      setTags(tagsJson.tags);
    }
  }

  async function saveIdea() {
    setPending(true);
    setError(null);

    const tagNames = tagInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload = {
      title,
      body,
      status: editorStatus,
      campaignId: editorCampaignId || null,
      tagNames,
      galleryImageId: gallerySelection.starterId,
      workspaceGalleryId: gallerySelection.workspaceId,
    };

    const response =
      editor.mode === "edit"
        ? await fetch(`/api/ideas/${editor.idea.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/ideas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

    const json = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(json.error ?? t("ideas.couldNotSave"));
      return;
    }

    closeEditor();
    await fetchIdeas();
    const tagsRes = await fetch("/api/tags", { cache: "no-store" });
    if (tagsRes.ok) {
      const tagsJson = (await tagsRes.json()) as { tags: TagJson[] };
      setTags(tagsJson.tags);
    }
  }

  async function deleteIdea(idea: IdeaJson) {
    if (!window.confirm(t("ideas.confirmDelete"))) return;

    setPending(true);
    const response = await fetch(`/api/ideas/${idea.id}`, { method: "DELETE" });
    setPending(false);

    if (!response.ok) {
      const json = await response.json();
      setError(json.error ?? t("ideas.couldNotDelete"));
      return;
    }

    if (editor.mode === "edit" && editor.idea.id === idea.id) {
      closeEditor();
    }
    await fetchIdeas();
  }

  async function addCampaign() {
    const name = newCampaignName.trim();
    if (!name) return;

    setPending(true);
    const response = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const json = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(json.error ?? t("ideas.couldNotCreateCampaign"));
      return;
    }

    setCampaigns((current) => [...current, json.campaign as CampaignJson].sort((a, b) => a.name.localeCompare(b.name)));
    setNewCampaignName("");
    setEditorCampaignId(json.campaign.id);
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>{t("ideas.title")}</CardTitle>
            <CardDescription>{t("ideas.desc")}</CardDescription>
          </div>
          <Button type="button" onClick={openCreate}>
            {t("ideas.newIdea")}
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label={t("ideas.filterByStatus")}>
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={status === tab.id}
              onClick={() => setStatus(tab.id)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                status === tab.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted/40"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium text-muted">{t("ideas.campaign")}</span>
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-2"
            >
              <option value="all">{t("ideas.campaignAll")}</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium text-muted">{t("ideas.tag")}</span>
            <select
              value={tagId}
              onChange={(e) => setTagId(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-2"
            >
              <option value="all">{t("ideas.tagAll")}</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <Card className="mt-6">
          <CardTitle>{t("ideas.galleryTitle")}</CardTitle>
          <CardDescription>{t("ideas.galleryBrowseDesc")}</CardDescription>
          <div className="mt-4">
            <IdeaGalleryPicker
              selected={gallerySelection}
              disabled={pending}
              onSelect={(selection) => {
                setGallerySelection(selection);
                if (
                  editor.mode === "closed" &&
                  (selection.starterId || selection.workspaceId)
                ) {
                  openCreateWithGallery(selection);
                }
              }}
            />
          </div>
        </Card>

        <div className="mt-6 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-medium text-foreground">{t("ideas.aiBrainstorm")}</p>
          <p className="mt-1 text-xs text-muted">{t("ideas.aiBrainstormHint")}</p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="min-w-[200px] flex-1 space-y-1 text-sm">
              <span className="font-medium">{t("ideas.aiBriefLabel")}</span>
              <input
                value={aiBrief}
                onChange={(e) => setAiBrief(e.target.value)}
                placeholder={t("ideas.aiBriefPlaceholder")}
                className="h-10 w-full rounded-lg border border-border bg-background px-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">{t("ideas.aiTone")}</span>
              <select
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value as CaptionTone)}
                className="h-10 rounded-lg border border-border bg-background px-2"
              >
                <option value="casual">{t("composer.toneCasual")}</option>
                <option value="professional">{t("composer.toneProfessional")}</option>
                <option value="promotional">{t("composer.tonePromotional")}</option>
              </select>
            </label>
            <Button
              type="button"
              variant="outline"
              disabled={aiPending || pending}
              onClick={() => void callAi("brainstorm")}
            >
              {aiPending ? t("composer.generating") : t("ideas.aiBrainstorm")}
            </Button>
          </div>
        </div>
      </Card>

      {brainstormResults && brainstormResults.length > 0 ? (
        <Card>
          <CardTitle>{t("ideas.aiBrainstormTitle")}</CardTitle>
          <ul className="mt-4 space-y-3">
            {brainstormResults.map((idea, index) => (
              <li
                key={`${idea.title}-${index}`}
                className="rounded-lg border border-border bg-background/80 p-3"
              >
                <p className="font-medium">{idea.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{idea.body}</p>
                {idea.tagNames.length > 0 ? (
                  <p className="mt-2 text-xs text-primary">{idea.tagNames.join(", ")}</p>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => applyGeneratedIdea(idea)}
                >
                  {t("ideas.aiUseIdea")}
                </Button>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" disabled={pending} onClick={() => void saveBrainstormIdeas()}>
              {t("ideas.aiSaveAll")}
            </Button>
            <Button type="button" variant="outline" onClick={() => setBrainstormResults(null)}>
              {t("common.cancel")}
            </Button>
          </div>
        </Card>
      ) : null}

      {editor.mode !== "closed" ? (
        <Card>
          <CardTitle>
            {editor.mode === "create" ? t("ideas.editorCreate") : t("ideas.editorEdit")}
          </CardTitle>
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void saveIdea();
            }}
          >
            <label className="block space-y-1 text-sm">
              <span className="font-medium">{t("ideas.fieldTitle")}</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">{t("ideas.aiBriefLabel")}</span>
              <input
                value={aiBrief}
                onChange={(e) => setAiBrief(e.target.value)}
                placeholder={t("ideas.aiBriefPlaceholder")}
                className="h-10 w-full rounded-lg border border-border bg-background px-3"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">{t("ideas.fieldBody")}</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                placeholder={t("ideas.bodyPlaceholder")}
              />
            </label>
            <div className="flex flex-wrap items-end gap-3">
              <label className="space-y-1 text-sm">
                <span className="font-medium">{t("ideas.aiTone")}</span>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value as CaptionTone)}
                  className="h-10 rounded-lg border border-border bg-background px-2"
                >
                  <option value="casual">{t("composer.toneCasual")}</option>
                  <option value="professional">{t("composer.toneProfessional")}</option>
                  <option value="promotional">{t("composer.tonePromotional")}</option>
                </select>
              </label>
              <Button
                type="button"
                variant="outline"
                disabled={aiPending || pending}
                onClick={() => void callAi("generate")}
              >
                {aiPending ? t("composer.generating") : t("ideas.aiGenerate")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={aiPending || pending}
                onClick={() => void callAi("expand")}
              >
                {aiPending ? t("composer.generating") : t("ideas.aiExpand")}
              </Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="block space-y-1 text-sm">
                <span className="font-medium">{t("ideas.fieldStatus")}</span>
                <select
                  value={editorStatus}
                  onChange={(e) => setEditorStatus(e.target.value as IdeaStatus)}
                  className="h-10 rounded-lg border border-border bg-background px-2"
                >
                  <option value="brainstorm">{t("ideas.statusBrainstorm")}</option>
                  <option value="ready">{t("ideas.statusReady")}</option>
                  <option value="archived">{t("ideas.statusArchived")}</option>
                </select>
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">{t("ideas.campaign")}</span>
                <select
                  value={editorCampaignId}
                  onChange={(e) => setEditorCampaignId(e.target.value)}
                  className="h-10 min-w-[12rem] rounded-lg border border-border bg-background px-2"
                >
                  <option value="">{t("ideas.campaignNone")}</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">{t("ideas.fieldTags")}</span>
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder={t("ideas.tagsPlaceholder")}
                className="h-10 w-full rounded-lg border border-border bg-background px-3"
              />
            </label>
            <div className="flex flex-wrap items-end gap-2">
              <label className="min-w-[200px] flex-1 space-y-1 text-sm">
                <span className="font-medium">{t("ideas.newCampaign")}</span>
                <input
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder={t("ideas.campaignNamePlaceholder")}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3"
                />
              </label>
              <Button type="button" variant="outline" disabled={pending} onClick={() => void addCampaign()}>
                {t("ideas.addCampaign")}
              </Button>
            </div>
            {error ? (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? t("common.working") : t("common.save")}
              </Button>
              <Button type="button" variant="outline" onClick={closeEditor}>
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {ideas.length === 0 ? (
        <Card>
          <CardDescription>{t("ideas.empty")}</CardDescription>
        </Card>
      ) : (
        <ul className="space-y-3">
          {ideas.map((idea) => (
            <li key={idea.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {idea.galleryPreviewUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={idea.galleryPreviewUrl}
                      alt=""
                      className="size-20 shrink-0 rounded-lg border border-border object-cover"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{idea.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      {t(`ideas.statusLabel.${idea.status}`)} · {idea.authorName}
                      {idea.campaignName ? ` · ${idea.campaignName}` : ""}
                    </p>
                    {idea.tags.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {idea.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-muted">
                      {idea.body || t("ideas.noBody")}
                    </p>
                    {idea.promotedPostId ? (
                      <p className="mt-2 text-xs text-emerald-700">{t("ideas.promotedHint")}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/dashboard/composer?ideaId=${idea.id}`}>
                      <Button type="button" size="sm">
                        {t("ideas.turnIntoPost")}
                      </Button>
                    </Link>
                    <Button type="button" size="sm" variant="outline" onClick={() => openEdit(idea)}>
                      {t("ideas.edit")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => void deleteIdea(idea)}
                    >
                      {t("ideas.delete")}
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
