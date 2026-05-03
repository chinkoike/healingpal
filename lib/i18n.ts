export type AppLanguage = "th" | "en";
export const DEFAULT_LANGUAGE: AppLanguage = "th";
export const LANGUAGE_STORAGE_KEY = "healingpal.language";
export function isAppLanguage(v: unknown): v is AppLanguage {
  return v === "th" || v === "en";
}
export function normalizeLanguage(v: unknown): AppLanguage {
  return isAppLanguage(v) ? v : DEFAULT_LANGUAGE;
}
