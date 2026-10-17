import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { detectLang, dictionaries, isLang, type Dictionary, type Lang } from "../lib/i18n";
import { readStorage, writeStorage } from "../lib/storage";

const LANG_KEY = "colectivo-544:lang";

interface LanguageValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageValue | null>(null);

/** Owns the active language: auto-detects on first visit, persists a manual choice and keeps `<html lang>` in sync. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = readStorage(LANG_KEY);
    return isLang(stored) ? stored : detectLang(navigator.languages);
  });

  // Persist only an explicit choice, so detection keeps running on fresh visits.
  const setLang = (next: Lang) => {
    setLangState(next);
    writeStorage(LANG_KEY, next);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<LanguageValue>(
    () => ({ lang, setLang, t: dictionaries[lang] }),
    [lang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue {
  const ctx = useContext(LanguageContext);
  if (ctx === null) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
