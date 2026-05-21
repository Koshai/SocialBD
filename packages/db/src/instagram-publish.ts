const GRAPH_VERSION = "v21.0";

type GraphResponse = {
  id?: string;
  error?: { message: string; code?: number };
};

export async function publishInstagramPost(input: {
  igUserId: string;
  pageAccessToken: string;
  caption: string;
  imageUrl: string;
}) {
  const createUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${input.igUserId}/media`);
  createUrl.searchParams.set("access_token", input.pageAccessToken);
  createUrl.searchParams.set("image_url", input.imageUrl);
  if (input.caption.trim()) {
    createUrl.searchParams.set("caption", input.caption.trim());
  }

  const createResponse = await fetch(createUrl, { method: "POST" });
  const createJson = (await createResponse.json()) as GraphResponse;

  if (!createResponse.ok || createJson.error || !createJson.id) {
    throw new Error(
      createJson.error?.message ?? `Instagram media create failed (${createResponse.status}).`,
    );
  }

  const publishUrl = new URL(
    `https://graph.facebook.com/${GRAPH_VERSION}/${input.igUserId}/media_publish`,
  );
  publishUrl.searchParams.set("access_token", input.pageAccessToken);
  publishUrl.searchParams.set("creation_id", createJson.id);

  const publishResponse = await fetch(publishUrl, { method: "POST" });
  const publishJson = (await publishResponse.json()) as GraphResponse;

  if (!publishResponse.ok || publishJson.error || !publishJson.id) {
    throw new Error(
      publishJson.error?.message ?? `Instagram publish failed (${publishResponse.status}).`,
    );
  }

  return { externalPostId: publishJson.id };
}
