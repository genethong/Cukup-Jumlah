import React, { createContext, useContext, useState } from "react";

export type Language = "ms" | "en";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (msText: string, enText: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "ms",
  setLang: () => {},
  toggleLang: () => {},
  t: (msText, _enText) => msText,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined" && typeof localStorage.getItem === "function") {
      try {
        const saved = localStorage.getItem("cukup_jumlah_lang");
        if (saved === "ms" || saved === "en") return saved;
      } catch {
        // Ignore localStorage error
      }
    }
    return "ms"; // Default to Malay first!
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== "undefined" && typeof localStorage !== "undefined" && typeof localStorage.setItem === "function") {
      try {
        localStorage.setItem("cukup_jumlah_lang", newLang);
      } catch {
        // Ignore localStorage error
      }
    }
  };

  const toggleLang = () => {
    setLang(lang === "ms" ? "en" : "ms");
  };

  const t = (msText: string, enText: string) => (lang === "ms" ? msText : enText);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
