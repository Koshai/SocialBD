"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  LOCALE_COOKIE,
  THEME_COOKIE,
  type Locale,
  type Theme,
} from "@/lib/i18n/cookies";
import { getMessages } from "@/lib/i18n/messages";
import { createTranslator, type TranslateFn } from "@/lib/i18n/translate";

type PreferencesContextValue = {
  locale: Locale;
  theme: Theme;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: Theme) => void;
  t: TranslateFn;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function setCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function applyThemeToDocument(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;

  const applyDark = (isDark: boolean) => {
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  };

  if (theme === "dark") applyDark(true);
  else if (theme === "light") applyDark(false);
  else applyDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
}

function applyLocaleToDocument(locale: Locale) {
  document.documentElement.lang = locale;
  if (locale === "bn") document.documentElement.classList.add("locale-bn");
  else document.documentElement.classList.remove("locale-bn");
}

type PreferencesProviderProps = {
  initialLocale: Locale;
  initialTheme: Theme;
  children: ReactNode;
};

export function PreferencesProvider({
  initialLocale,
  initialTheme,
  children,
}: PreferencesProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setCookie(LOCALE_COOKIE, next);
    applyLocaleToDocument(next);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    setCookie(THEME_COOKIE, next);
    applyThemeToDocument(next);
  }, []);

  useEffect(() => {
    applyLocaleToDocument(locale);
    applyThemeToDocument(theme);

    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyThemeToDocument("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [locale, theme]);

  const t = useMemo(() => createTranslator(getMessages(locale)), [locale]);

  const value = useMemo(
    () => ({ locale, theme, setLocale, setTheme, t }),
    [locale, theme, setLocale, setTheme, t],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return context;
}
