import { chatCompletion, type CaptionTone } from "./openai-client";

export type { CaptionTone } from "./openai-client";

export type CaptionLanguage = "en" | "bn";

export function isCaptionLanguage(value: string): value is CaptionLanguage {
  return value === "en" || value === "bn";
}

const TONE_HINTS: Record<CaptionTone, string> = {
  casual: "Friendly and conversational, suitable for Facebook in Bangladesh.",
  professional: "Clear and professional, trustworthy tone.",
  promotional: "Engaging promotional tone with a soft call to action.",
};

const LANGUAGE_HINTS: Record<CaptionLanguage, string> = {
  en: "Write the caption in English.",
  bn: "Write the caption in Bangla (Bengali script). Do not transliterate into English letters.",
};

const DEFAULT_BRIEFS: Record<CaptionLanguage, string> = {
  en: "A product update for our Facebook Page",
  bn: "আমাদের ফেসবুক পেজের জন্য একটি পণ্য আপডেট",
};

export function defaultCaptionBrief(language: CaptionLanguage) {
  return DEFAULT_BRIEFS[language];
}

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
