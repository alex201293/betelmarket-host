import { create } from "zustand";
import { useEffect, useState } from "react";

export type Locale = "en" | "es";

interface LanguageState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  locale: "en", // Always start with "en" to match server render
  setLocale: (locale: Locale) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", locale);
    }
    set({ locale });
  },
}));

/**
 * Hook that hydrates the language from localStorage after mount.
 * This prevents SSR hydration mismatch.
 */
export function useHydrateLanguage() {
  const { setLocale } = useLanguageStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("locale");
    if (stored === "en" || stored === "es") {
      setLocale(stored);
    }
    setHydrated(true);
  }, [setLocale]);

  return hydrated;
}
