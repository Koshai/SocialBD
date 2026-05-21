import { readOrganizationMedia } from "./media-storage";

const LINKEDIN_REST_BASE = "https://api.linkedin.com/rest";
const LINKEDIN_API_VERSION = process.env.LINKEDIN_API_VERSION?.trim() || "202501";

function linkedInHeaders(accessToken: string, extra?: Record<string, string>) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "LinkedIn-Version": LINKEDIN_API_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
    ...extra,
  };
}

async function initializeImageUpload(input: {
  organizationUrn: string;
  accessToken: string;
}) {
  const response = await fetch(`${LINKEDIN_REST_BASE}/images?action=initializeUpload`, {
    method: "POST",
    headers: linkedInHeaders(input.accessToken, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: input.organizationUrn,
      },
    }),
  });

  const json = (await response.json()) as {
    value?: {
      uploadUrl?: string;
      image?: string;
    };
    message?: string;
  };

  if (!response.ok || !json.value?.uploadUrl || !json.value.image) {
    throw new Error(json.message ?? `LinkedIn image init failed (${response.status}).`);
  }

  return {
    uploadUrl: json.value.uploadUrl,
    imageUrn: json.value.image,
  };
}

async function uploadImageBinary(uploadUrl: string, buffer: Buffer, mimeType: string) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: new Uint8Array(buffer),
  });

  if (!response.ok) {
    throw new Error(`LinkedIn image upload failed (${response.status}).`);
  }
}

export async function publishLinkedInOrganizationPost(input: {
  organizationId: string;
  accessToken: string;
  commentary: string;
  media?: { path: string; mimeType: string };
}) {
  const author = `urn:li:organization:${input.organizationId}`;
  const commentary = input.commentary.trim();

  if (!commentary && !input.media) {
    throw new Error("LinkedIn posts require a caption or an image.");
  }

  let content: { media: { id: string } } | undefined;

  if (input.media) {
    const buffer = await readOrganizationMedia(input.media.path);
    const { uploadUrl, imageUrn } = await initializeImageUpload({
      organizationUrn: author,
      accessToken: input.accessToken,
    });
    await uploadImageBinary(uploadUrl, buffer, input.media.mimeType);
    content = { media: { id: imageUrn } };
  }

  const body: Record<string, unknown> = {
    author,
    commentary: commentary || " ",
    visibility: "PUBLIC",
    distribution: { feedDistribution: "MAIN_FEED" },
    lifecycleState: "PUBLISHED",
  };

  if (content) {
    body.content = content;
  }

  const response = await fetch(`${LINKEDIN_REST_BASE}/posts`, {
    method: "POST",
    headers: linkedInHeaders(input.accessToken, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });

  const postId = response.headers.get("x-restli-id");
  const text = await response.text();

  if (!response.ok) {
    let message = `LinkedIn publish failed (${response.status}).`;
    try {
      const json = JSON.parse(text) as { message?: string };
      if (json.message) message = json.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return { externalPostId: postId ?? "linkedin-published" };
}
