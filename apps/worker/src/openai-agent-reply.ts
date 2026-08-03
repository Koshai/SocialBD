type AgentReplyInput = {
  systemPrompt: string;
  language: string;
  tone: string;
  incomingText: string;
  channelName: string;
  eventType: string;
};

function getOpenAiConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  return {
    apiKey,
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
  };
}

export async function generateAgentReply(input: AgentReplyInput) {
  const { apiKey, model } = getOpenAiConfig();

  const languageHint =
    input.language === "bn"
      ? "Prefer Bangla (বাংলা) in your reply unless the customer wrote in English."
      : "Prefer English unless the customer wrote in Bangla — then reply in Bangla.";

  const surface =
    input.eventType === "messenger"
      ? "This is a private Messenger / Instagram DM."
      : "This is a public comment or mention — keep the reply brand-safe.";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      max_tokens: 280,
      messages: [
        {
          role: "system",
          content: `${input.systemPrompt}

Channel: ${input.channelName}
Tone preference: ${input.tone}
${languageHint}
${surface}
Reply with the message text only — no quotes or labels.`,
        },
        {
          role: "user",
          content: input.incomingText,
        },
      ],
    }),
  });

  const json = (await response.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!response.ok) {
    throw new Error(json.error?.message ?? `OpenAI request failed (${response.status}).`);
  }

  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI returned an empty agent reply.");
  }

  return content.slice(0, 1900);
}
