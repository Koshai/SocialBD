export type CaptionTone = "casual" | "professional" | "promotional";

const TONE_HINTS: Record<CaptionTone, string> = {
  casual: "Friendly and conversational, suitable for Facebook in Bangladesh.",
  professional: "Clear and professional, trustworthy tone.",
  promotional: "Engaging promotional tone with a soft call to action.",
};

export async function generatePostCaption(input: { brief: string; tone: CaptionTone }) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const brief = input.brief.trim();
  if (!brief) {
    throw new Error("Describe what you want to post about first.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: 400,
      messages: [
        {
          role: "system",
          content:
            "You write short Facebook Page captions for businesses in Bangladesh. " +
            "Use plain English unless the brief asks for Bangla. No hashtags unless asked. " +
            "Return only the caption text, no quotes or labels.",
        },
        {
          role: "user",
          content: `Tone: ${TONE_HINTS[input.tone]}\n\nBrief: ${brief}`,
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

  const caption = json.choices?.[0]?.message?.content?.trim();
  if (!caption) {
    throw new Error("OpenAI returned an empty caption.");
  }

  return caption;
}
