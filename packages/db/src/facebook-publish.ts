import { readOrganizationMedia } from "./media-storage";

const GRAPH_VERSION = "v21.0";

type GraphResponse = {
  id?: string;
  post_id?: string;
  error?: { message: string; code?: number };
};

export async function publishFacebookPagePost(input: {
  pageId: string;
  pageAccessToken: string;
  message: string;
  media?: { path: string; mimeType: string };
}) {
  if (input.media) {
    return publishFacebookPagePhoto({
      pageId: input.pageId,
      pageAccessToken: input.pageAccessToken,
      message: input.message,
      media: input.media,
    });
  }

  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${input.pageId}/feed`);
  url.searchParams.set("access_token", input.pageAccessToken);
  url.searchParams.set("message", input.message);

  const response = await fetch(url, { method: "POST" });
  const json = (await response.json()) as GraphResponse;

  if (!response.ok || json.error || !json.id) {
    throw new Error(json.error?.message ?? `Facebook publish failed (${response.status}).`);
  }

  return { externalPostId: json.id };
}

async function publishFacebookPagePhoto(input: {
  pageId: string;
  pageAccessToken: string;
  message: string;
  media: { path: string; mimeType: string };
}) {
  const buffer = await readOrganizationMedia(input.media.path);
  const form = new FormData();
  form.append("access_token", input.pageAccessToken);
  if (input.message.trim()) {
    form.append("message", input.message.trim());
  }
  const blob = new Blob([buffer], { type: input.media.mimeType });
  form.append("source", blob, `photo.${input.media.mimeType.split("/")[1] ?? "jpg"}`);

  const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${input.pageId}/photos`, {
    method: "POST",
    body: form,
  });
  const json = (await response.json()) as GraphResponse;

  const externalPostId = json.post_id ?? json.id;
  if (!response.ok || json.error || !externalPostId) {
    throw new Error(json.error?.message ?? `Facebook photo publish failed (${response.status}).`);
  }

  return { externalPostId };
}
