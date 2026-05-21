import { chatCompletion, type CaptionTone } from "./openai-client";

export type { CaptionTone } from "./openai-client";

const TONE_HINTS: Record<CaptionTone, string> = {
  casual: "Friendly and conversational, suitable for Facebook in Bangladesh.",
  professional: "Clear and professional, trustworthy tone.",
  promotional: "Engaging promotional tone with a soft call to action.",
};

export async function generatePostCaption(input: { brief: string; tone: CaptionTone }) {
  const brief = input.brief.trim();
  if (!brief) {
    throw new Error("Describe what you want to post about first.");
  }

  return chatCompletion({
    maxTokens: 400,
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
  });
}
