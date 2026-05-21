import type { TranslateFn } from "@/lib/i18n/translate";

const fallbackLabels: Record<string, string> = {
  facebook_page: "Facebook Page",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  linkedin_organization: "LinkedIn Company Page",
};

export function getPlatformLabel(platform: string, t?: TranslateFn) {
  if (t) {
    const keyMap: Record<string, string> = {
      facebook_page: "platform.facebookPage",
      instagram: "platform.instagram",
      linkedin: "platform.linkedin",
      linkedin_organization: "platform.linkedin",
    };
    const key = keyMap[platform];
    if (key) return t(key);
  }
  return fallbackLabels[platform] ?? platform;
}
