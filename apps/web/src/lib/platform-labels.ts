import type { TranslateFn } from "@/lib/i18n/translate";

const fallbackLabels: Record<string, string> = {
  facebook_page: "Facebook Page",
  instagram: "Instagram",
  linkedin: "LinkedIn",
};

export function getPlatformLabel(platform: string, t?: TranslateFn) {
  if (t) {
    const keyMap: Record<string, string> = {
      facebook_page: "platform.facebookPage",
      instagram: "platform.instagram",
      linkedin: "platform.linkedin",
    };
    const key = keyMap[platform];
    if (key) return t(key);
  }
  return fallbackLabels[platform] ?? platform;
}
