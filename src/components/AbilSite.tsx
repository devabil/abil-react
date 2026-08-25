import { useEffect, useState } from "react";

export type AbilLang = "fr" | "en" | "pt" | "de" | "it";

export const ABIL_LANGS: AbilLang[] = ["fr", "en", "pt", "de", "it"];

export function useAbilLang(): [AbilLang, (lang: AbilLang) => void] {
  const [lang, setLang] = useState<AbilLang>(() => {
    try {
      const saved = localStorage.getItem("abil_lang") as AbilLang | null;
      if (saved && ABIL_LANGS.includes(saved)) return saved;

      const browserLang = (navigator.language || "fr").slice(0, 2) as AbilLang;
      return ABIL_LANGS.includes(browserLang) ? browserLang : "fr";
    } catch {
      return "fr";
    }
  });

  const updateLang = (nextLang: AbilLang) => {
    setLang(nextLang);
    try {
      localStorage.setItem("abil_lang", nextLang);
      document.documentElement.lang = nextLang;
    } catch {
      // Language persistence is optional when browser storage is unavailable.
    }
  };

  useEffect(() => {
    try {
      document.documentElement.lang = lang;
    } catch {
      // The document may be unavailable during non-browser rendering.
    }
  }, [lang]);

  return [lang, updateLang];
}
