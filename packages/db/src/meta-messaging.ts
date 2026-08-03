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

/** Send a Messenger / Instagram DM text reply as the Page. */
export async function sendMessengerText(input: {
  pageId: string;
  recipientId: string;
  text: string;
  pageAccessToken: string;
}) {
  return graphPost<{ message_id?: string }>(
    `/${input.pageId}/messages`,
    {
      recipient: { id: input.recipientId },
      messaging_type: "RESPONSE",
      message: { text: input.text.slice(0, 1900) },
    },
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
