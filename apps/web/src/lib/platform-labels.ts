const labels: Record<string, string> = {
  facebook_page: "Facebook Page",
  instagram: "Instagram",
  linkedin: "LinkedIn",
};

export function getPlatformLabel(platform: string) {
  return labels[platform] ?? platform;
}
