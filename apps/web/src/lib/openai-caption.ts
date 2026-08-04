import { chatCompletion, type CaptionTone } from "./openai-client";
import { type CaptionLanguage } from "./caption-brief";

export type { CaptionTone } from "./openai-client";
export type { CaptionLanguage } from "./caption-brief";
export { defaultCaptionBrief, isCaptionLanguage } from "./caption-brief";

const TONE_HINTS: Record<CaptionTone, string> = {
  casual: "Friendly and conversational, suitable for Facebook in Bangladesh.",
  professional: "Clear and professional, trustworthy tone.",
  promotional: "Engaging promotional tone with a soft call to action.",
};

const LANGUAGE_HINTS: Record<CaptionLanguage, string> = {
  en: "Write the caption in English.",
  bn: "Write the caption in Bangla (Bengali script). Do not transliterate into English letters.",
};

export async function generatePostCaption(input: {
  brief: string;
  tone: CaptionTone;
  language: CaptionLanguage;
}) {
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
          "You write short social media captions for businesses in Bangladesh (Facebook, Instagram, LinkedIn). " +
          `${LANGUAGE_HINTS[input.language]} ` +
          "No hashtags unless asked. Return only the caption text, no quotes or labels.",
      },
      {
        role: "user",
        content: `Tone: ${TONE_HINTS[input.tone]}\nLanguage: ${input.language}\n\nBrief: ${brief}`,
      },
    ],
  });
}
