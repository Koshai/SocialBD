"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@socialbd/ui";

import { usePreferences } from "@/components/preferences/preferences-provider";
import {
  IDEA_GALLERY_CATEGORY_ORDER,
  getGalleryImageById,
  getGalleryImagesByCategory,
  type IdeaGalleryCategory,
  type IdeaGalleryImage,
} from "@/lib/idea-gallery";
import {
  emptyGallerySelection,
  gallerySelectionLabel,
  type IdeaGallerySelection,
} from "@/lib/idea-gallery-selection";
import type { WorkspaceGalleryImageJson } from "@/lib/workspace-gallery-api";

export type IdeaGalleryPickerProps = {
  selected: IdeaGallerySelection;
  onSelect: (selection: IdeaGallerySelection) => void;
  disabled?: boolean;
};

type GalleryTab = "starter" | "workspace";

type WorkspaceImagePreview = {
  id: string;
  name: string;
  previewUrl: string;
};

export function IdeaGalleryPicker({ selected, onSelect, disabled }: IdeaGalleryPickerProps) {
  const { t } = usePreferences();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<GalleryTab>("starter");
  const [category, setCategory] = useState<IdeaGalleryCategory>(IDEA_GALLERY_CATEGORY_ORDER[0]);
  const [workspaceImages, setWorkspaceImages] = useState<WorkspaceGalleryImageJson[]>([]);
  const [gridLoading, setGridLoading] = useState(false);
  const [uploadPending, setUploadPending] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedWorkspaceMeta, setSelectedWorkspaceMeta] = useState<WorkspaceImagePreview | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const starterImages = getGalleryImagesByCategory(category);
  const selectedStarter = getGalleryImageById(selected.starterId);
  const selectedWorkspaceFromList = workspaceImages.find((image) => image.id === selected.workspaceId);
  const selectedWorkspace = selectedWorkspaceFromList ?? selectedWorkspaceMeta;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const fetchWorkspaceImages = useCallback(async () => {
    setGridLoading(true);
    setError(null);

    const params = new URLSearchParams({ category });
    if (debouncedSearch) {
      params.set("q", debouncedSearch);
    }

    const response = await fetch(`/api/gallery?${params.toString()}`, { cache: "no-store" });
    const json = await response.json();
    setGridLoading(false);

    if (!response.ok) {
      setError(typeof json.error === "string" ? json.error : t("ideas.galleryLoadFailed"));
      return;
    }

    setWorkspaceImages(json.images as WorkspaceGalleryImageJson[]);
  }, [category, debouncedSearch, t]);

  useEffect(() => {
    if (tab === "workspace") {
      void fetchWorkspaceImages();
    }
  }, [tab, fetchWorkspaceImages]);

  function selectStarter(image: IdeaGalleryImage | null) {
    setSelectedWorkspaceMeta(null);
    if (!image) {
      onSelect(emptyGallerySelection());
      return;
    }
    onSelect({ starterId: image.id, workspaceId: null });
  }

  function selectWorkspace(image: WorkspaceGalleryImageJson | null) {
    if (!image) {
      setSelectedWorkspaceMeta(null);
      onSelect(emptyGallerySelection());
      return;
    }
    setSelectedWorkspaceMeta({
      id: image.id,
      name: image.name,
      previewUrl: image.previewUrl,
    });
    onSelect({ starterId: null, workspaceId: image.id });
  }

  function onUploadFileChange(file: File | null) {
    setError(null);
    setUploadFile(file);
  }

  function clearUploadForm() {
    setUploadFile(null);
    setUploadName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function submitWorkspaceUpload() {
    if (!uploadFile) {
      setError(t("ideas.galleryUploadPickFile"));
      return;
    }

    setUploadPending(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("category", category);
    if (uploadName.trim()) {
      formData.append("name", uploadName.trim());
    }

    const response = await fetch("/api/gallery", { method: "POST", body: formData });
    const json = await response.json();
    setUploadPending(false);

    if (!response.ok) {
      setError(typeof json.error === "string" ? json.error : t("common.couldNotUpload"));
      return;
    }

    clearUploadForm();
    setSearchQuery("");
    await fetchWorkspaceImages();
  }

  async function deleteWorkspaceImage(imageId: string) {
    if (!window.confirm(t("ideas.galleryConfirmDelete"))) return;

    setGridLoading(true);
    setError(null);

    const response = await fetch(`/api/gallery/${imageId}`, { method: "DELETE" });
    const json = await response.json();
    setGridLoading(false);

    if (!response.ok) {
      setError(typeof json.error === "string" ? json.error : t("ideas.galleryDeleteFailed"));
      return;
    }

    if (selected.workspaceId === imageId) {
      setSelectedWorkspaceMeta(null);
      onSelect(emptyGallerySelection());
    }
    await fetchWorkspaceImages();
  }

  const selectedLabel = gallerySelectionLabel(
    selected,
    t,
    selectedWorkspace?.name ?? null,
  );

  const selectedPreview =
    selectedStarter?.src ?? selectedWorkspace?.previewUrl ?? null;

  const workspaceEmpty = !gridLoading && workspaceImages.length === 0;
  const workspaceEmptyMessage = debouncedSearch
    ? t("ideas.gallerySearchEmpty")
    : t("ideas.galleryWorkspaceEmpty");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("ideas.galleryTabLabel")}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "starter"}
          disabled={disabled}
          onClick={() => setTab("starter")}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
            tab === "starter"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:bg-muted/40"
          }`}
        >
          {t("ideas.galleryTabStarter")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "workspace"}
          disabled={disabled}
          onClick={() => setTab("workspace")}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
            tab === "workspace"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:bg-muted/40"
          }`}
        >
          {t("ideas.galleryTabMine")}
        </button>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-medium">{t("ideas.galleryCategory")}</span>
        <select
          value={category}
          disabled={disabled || uploadPending}
          onChange={(e) => setCategory(e.target.value as IdeaGalleryCategory)}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {IDEA_GALLERY_CATEGORY_ORDER.map((key) => (
            <option key={key} value={key}>
              {t(`templateCategories.${key}`)}
            </option>
          ))}
        </select>
      </label>

      {tab === "workspace" ? (
        <>
          <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
            <div>
              <p className="text-sm font-medium">{t("ideas.galleryUploadTitle")}</p>
              <p className="mt-1 text-xs text-muted">{t("ideas.galleryUploadHint")}</p>
            </div>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">{t("ideas.galleryUploadName")}</span>
              <input
                value={uploadName}
                disabled={disabled || uploadPending}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder={t("ideas.galleryUploadNamePlaceholder")}
                className="h-10 w-full rounded-lg border border-border bg-background px-3"
              />
            </label>
            <div className="space-y-2 text-sm">
              <span className="font-medium">{t("ideas.galleryUploadFile")}</span>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  disabled={disabled || uploadPending}
                  onChange={(e) => onUploadFileChange(e.target.files?.[0] ?? null)}
                  className="block max-w-full text-sm"
                />
                <Button
                  type="button"
                  disabled={disabled || uploadPending || !uploadFile}
                  onClick={() => void submitWorkspaceUpload()}
                >
                  {uploadPending ? t("common.working") : t("ideas.galleryUploadButton")}
                </Button>
              </div>
              <p className="text-xs text-muted">
                {uploadFile
                  ? t("ideas.galleryUploadSelectedFile", { name: uploadFile.name })
                  : t("ideas.galleryUploadNoFile")}
              </p>
            </div>
          </div>

          <label className="block space-y-1 text-sm">
            <span className="font-medium">{t("ideas.gallerySearchLabel")}</span>
            <input
              type="search"
              value={searchQuery}
              disabled={disabled}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("ideas.gallerySearchPlaceholder")}
              className="h-10 w-full rounded-lg border border-border bg-background px-3"
            />
          </label>
        </>
      ) : null}

      {tab === "starter" ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {starterImages.map((image) => {
            const isSelected = selected.starterId === image.id;
            return (
              <li key={image.id}>
                <button
                  type="button"
                  disabled={disabled}
                  aria-pressed={isSelected}
                  onClick={() => selectStarter(isSelected ? null : image)}
                  className={`relative w-full overflow-hidden rounded-lg border-2 transition-colors ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.src}
                    alt={t(`ideas.galleryImages.${image.id}`)}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-left text-xs font-medium text-white">
                    {t(`ideas.galleryImages.${image.id}`)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <>
          {gridLoading && workspaceImages.length === 0 ? (
            <p className="text-sm text-muted">{t("common.working")}</p>
          ) : null}
          {gridLoading && workspaceImages.length > 0 ? (
            <p className="text-xs text-muted" aria-live="polite">
              {t("common.updating")}
            </p>
          ) : null}
          {workspaceEmpty ? (
            <p className="text-sm text-muted">{workspaceEmptyMessage}</p>
          ) : null}
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {workspaceImages.map((image) => {
              const isSelected = selected.workspaceId === image.id;
              return (
                <li key={image.id} className="relative">
                  <button
                    type="button"
                    disabled={disabled || gridLoading}
                    aria-pressed={isSelected}
                    onClick={() => selectWorkspace(isSelected ? null : image)}
                    className={`relative w-full overflow-hidden rounded-lg border-2 transition-colors ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.previewUrl}
                      alt={image.name}
                      className="aspect-square w-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-left text-xs font-medium text-white">
                      {image.name}
                    </span>
                  </button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled || gridLoading}
                    className="absolute right-1 top-1 h-7 min-w-0 px-2 text-xs"
                    onClick={(event) => {
                      event.stopPropagation();
                      void deleteWorkspaceImage(image.id);
                    }}
                  >
                    {t("ideas.delete")}
                  </Button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}

      {selectedPreview && selectedLabel ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selectedPreview} alt="" className="size-12 rounded-md object-cover" />
          <span className="min-w-0 flex-1 font-medium">
            {t("ideas.gallerySelected", { name: selectedLabel })}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => {
              setSelectedWorkspaceMeta(null);
              onSelect(emptyGallerySelection());
            }}
          >
            {t("ideas.galleryClear")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
