import type { Messages } from "./messages";

type Interpolation = Record<string, string | number>;

function resolvePath(messages: Messages, key: string): string | undefined {
  const parts = key.split(".");
  let current: unknown = messages;

  for (const part of parts) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : undefined;
}

export function createTranslator(messages: Messages) {
  return function t(key: string, vars?: Interpolation): string {
    let value = resolvePath(messages, key) ?? key;

    if (vars) {
      for (const [name, replacement] of Object.entries(vars)) {
        value = value.replaceAll(`{${name}}`, String(replacement));
      }
    }

    return value;
  };
}

export type TranslateFn = ReturnType<typeof createTranslator>;
