import type { CaptionTone } from "./openai-client";

export type CaptionLanguage = "en" | "bn";

export function isCaptionLanguage(value: string): value is CaptionLanguage {
  return value === "en" || value === "bn";
}

const DEFAULT_BRIEFS: Record<CaptionLanguage, string> = {
  en: "A product update for our Facebook Page",
  bn: "আমাদের ফেসবুক পেজের জন্য একটি পণ্য আপডেট",
};

export function defaultCaptionBrief(language: CaptionLanguage) {
  return DEFAULT_BRIEFS[language];
}

export type { CaptionTone };
