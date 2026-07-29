const GRAPH_VERSION = "v21.0";

type GraphResponse = {
  id?: string;
<<<<<<< HEAD
  error?: { message: string; code?: number };
};

=======
  status_code?: string;
  error?: { message: string; code?: number };
};

const CONTAINER_POLL_MS = 2_000;
const CONTAINER_POLL_MAX_ATTEMPTS = 30;

async function waitForInstagramContainerReady(containerId: string, accessToken: string) {
  const statusUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${containerId}`);
  statusUrl.searchParams.set("fields", "status_code");
  statusUrl.searchParams.set("access_token", accessToken);

  for (let attempt = 0; attempt < CONTAINER_POLL_MAX_ATTEMPTS; attempt++) {
    const response = await fetch(statusUrl);
    const json = (await response.json()) as GraphResponse;

    if (!response.ok || json.error) {
      throw new Error(
        json.error?.message ?? `Instagram container status failed (${response.status}).`,
      );
    }

    if (json.status_code === "FINISHED") {
      return;
    }

    if (json.status_code === "ERROR" || json.status_code === "EXPIRED") {
      throw new Error(`Instagram media container is ${json.status_code}.`);
    }

    await new Promise((resolve) => setTimeout(resolve, CONTAINER_POLL_MS));
  }

  throw new Error("Instagram media was not ready to publish in time. Try again.");
}

>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
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

<<<<<<< HEAD
=======
  await waitForInstagramContainerReady(createJson.id, input.pageAccessToken);

>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
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
