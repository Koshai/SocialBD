import { cookies } from "next/headers";

import { LOCALE_COOKIE, THEME_COOKIE, parseLocale, parseTheme } from "./cookies";
import { getMessages } from "./messages";
import { createTranslator } from "./translate";

export async function getServerPreferences() {
  const cookieStore = await cookies();
  return {
    locale: parseLocale(cookieStore.get(LOCALE_COOKIE)?.value),
    theme: parseTheme(cookieStore.get(THEME_COOKIE)?.value),
  };
}

export async function getServerTranslator() {
  const { locale } = await getServerPreferences();
  return createTranslator(getMessages(locale));
}
