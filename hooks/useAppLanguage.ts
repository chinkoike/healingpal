"use client";

import { useEffect, useState } from "react";
import { AppLanguage, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, normalizeLanguage } from "@/lib/i18n";

export function useAppLanguage() {
  const [language, setLanguage] = useState<AppLanguage>(() => {
    if (typeof window === "undefined") return DEFAULT_LANGUAGE;
    return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  });

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  return { language, setLanguage };
}
