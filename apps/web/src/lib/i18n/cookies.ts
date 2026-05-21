export const LOCALE_COOKIE = "socialbd-locale";
export const THEME_COOKIE = "socialbd-theme";

export type Locale = "en" | "bn";
export type Theme = "light" | "dark" | "system";

export function parseLocale(value: string | undefined): Locale {
  return value === "bn" ? "bn" : "en";
}

export function parseTheme(value: string | undefined): Theme {
  if (value === "dark" || value === "light" || value === "system") {
    return value;
  }
  return "system";
}
