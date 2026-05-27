"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export type Language = "EN" | "FR";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "EN",
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [language, setLanguageState] = useState<Language>("EN");

  // Seed from localStorage on first render, then override with DB preference when session loads
  useEffect(() => {
    const stored = localStorage.getItem("language") as Language | null;
    if (stored === "EN" || stored === "FR") {
      setLanguageState(stored);
    }
  }, []);

  useEffect(() => {
    const sessionLang = (session?.user as { language?: string | null })?.language;
    if (sessionLang === "EN" || sessionLang === "FR") {
      setLanguageState(sessionLang);
      localStorage.setItem("language", sessionLang);
    }
  }, [session]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    // Persist to DB (fire-and-forget)
    await fetch("/api/users/language", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: lang }),
    }).catch(() => {});
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}

/** Pick the right localised string, falling back to English if French is missing. */
export function t(en: string | null | undefined, fr: string | null | undefined, lang: Language): string {
  if (lang === "FR" && fr) return fr;
  return en ?? "";
}
