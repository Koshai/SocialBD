const GRAPH_VERSION = "v21.0";

type GraphErrorBody = {
  error?: { message?: string; code?: number };
};

async function graphPost<T>(path: string, body: Record<string, unknown>, accessToken: string) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}${path}`);
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as T & GraphErrorBody;
  if (!response.ok || json.error) {
    throw new Error(json.error?.message ?? `Meta Graph POST failed (${response.status}).`);
  }
  return json;
}

/**
 * Send a Messenger / Instagram DM text reply.
 *
 * Meta Instagram Messaging (Page-linked IG) expects the **Facebook Page** Send API:
 * `POST /{PAGE-ID}/messages` or `POST /me/messages` with a Page access token.
 * Webhook `entry.id` is the IG professional account id — that must NOT be used as the send path.
 */
export async function sendMessengerText(input: {
  pageId: string;
  recipientId: string;
  text: string;
  pageAccessToken: string;
  /** When true, prefer Page /me path first (Instagram DMs). */
  instagram?: boolean;
}) {
  const body = {
    recipient: { id: input.recipientId },
    messaging_type: "RESPONSE" as const,
    message: { text: input.text.slice(0, 1000) },
  };

  if (input.instagram) {
    // Official Instagram sample path; PAT scopes to the linked Page.
    try {
      return await graphPost<{ message_id?: string }>(
        `/me/messages`,
        body,
        input.pageAccessToken,
      );
    } catch (meError) {
      // Fall back to explicit Page id when available.
      if (input.pageId && input.pageId !== "me") {
        try {
          return await graphPost<{ message_id?: string }>(
            `/${input.pageId}/messages`,
            body,
            input.pageAccessToken,
          );
        } catch {
          throw meError instanceof Error ? meError : new Error(String(meError));
        }
      }
      throw meError;
    }
  }

  return graphPost<{ message_id?: string }>(
    `/${input.pageId}/messages`,
    body,
    input.pageAccessToken,
  );
}

/** Reply to a Facebook or Instagram comment. */
export async function replyToComment(input: {
  commentId: string;
  message: string;
  pageAccessToken: string;
}) {
  return graphPost<{ id?: string }>(
    `/${input.commentId}/comments`,
    { message: input.message.slice(0, 1900) },
    input.pageAccessToken,
  );
}

/** Subscribe the Page to webhook fields needed for agents. */
export async function subscribePageToApp(input: {
  pageId: string;
  pageAccessToken: string;
}) {
  return graphPost<{ success?: boolean }>(
    `/${input.pageId}/subscribed_apps`,
    {
      subscribed_fields: [
        "messages",
        "messaging_postbacks",
        "feed",
        "mention",
      ].join(","),
    },
    input.pageAccessToken,
  );
}

/**
 * Subscribe the Instagram professional account so Meta delivers `object: "instagram"`
 * message webhooks (Page subscription alone is not always enough).
 */
export async function subscribeInstagramToApp(input: {
  igUserId: string;
  pageAccessToken: string;
}) {
  return graphPost<{ success?: boolean }>(
    `/${input.igUserId}/subscribed_apps`,
    {
      subscribed_fields: ["messages", "messaging_postbacks", "comments", "mentions"].join(","),
    },
    input.pageAccessToken,
  );
}
