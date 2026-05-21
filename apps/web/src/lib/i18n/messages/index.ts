import type { Locale } from "../cookies";
import { bn } from "./bn";
import { en } from "./en";
import type { Messages } from "./types";

const catalogs: Record<Locale, Messages> = { en: en as Messages, bn };

export function getMessages(locale: Locale): Messages {
  return catalogs[locale];
}

export type { Messages } from "./types";
