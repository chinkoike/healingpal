export type AppLanguage = "th" | "en";

export const DEFAULT_LANGUAGE: AppLanguage = "th";
export const LANGUAGE_STORAGE_KEY = "healingpal.language";

export function isAppLanguage(value: unknown): value is AppLanguage {
  return value === "th" || value === "en";
}

export function normalizeLanguage(value: unknown): AppLanguage {
  return isAppLanguage(value) ? value : DEFAULT_LANGUAGE;
}
