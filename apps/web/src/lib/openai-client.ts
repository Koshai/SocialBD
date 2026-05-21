export type CaptionTone = "casual" | "professional" | "promotional";

export const CAPTION_TONES: CaptionTone[] = ["casual", "professional", "promotional"];

export function isCaptionTone(value: string): value is CaptionTone {
  return CAPTION_TONES.includes(value as CaptionTone);
}

export function getOpenAiConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  return {
    apiKey,
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
  };
}

export async function chatCompletion(input: {
  messages: Array<{ role: "system" | "user"; content: string }>;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}) {
  const { apiKey, model } = getOpenAiConfig();

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxTokens ?? 500,
      ...(input.jsonMode ? { response_format: { type: "json_object" } } : {}),
      messages: input.messages,
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
    throw new Error("OpenAI returned an empty response.");
  }

  return content;
}
