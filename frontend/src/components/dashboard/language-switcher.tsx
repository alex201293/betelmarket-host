"use client";

import { useLanguageStore, type Locale } from "@/stores/language";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguageStore();

  const toggle = () => {
    const next: Locale = locale === "en" ? "es" : "en";
    setLocale(next);
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
      title="Switch language"
    >
      <Languages className="h-4 w-4" />
      <span className="uppercase font-semibold">{locale}</span>
    </button>
  );
}
