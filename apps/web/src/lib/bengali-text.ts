/** True if the string contains Bengali Unicode block characters. */
export function textIncludesBengaliScript(text: string) {
  return /[\u0980-\u09FF]/.test(text);
}

export function bengaliTextClassName(text: string) {
  return textIncludesBengaliScript(text) ? "bengali-text" : "";
}
