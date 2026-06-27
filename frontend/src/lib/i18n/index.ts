import { useLanguageStore } from "@/stores/language";
import { en } from "./en";
import { es } from "./es";
import type { Translations } from "./en";

const translations: Record<string, Translations> = { en, es };

export function useTranslation() {
  const { locale } = useLanguageStore();
  const t = translations[locale] || en;
  return { t, locale };
}

export type { Translations };
export { en, es };
