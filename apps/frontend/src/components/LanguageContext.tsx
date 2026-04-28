"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = {
  code: string;
  name: string;
  flag: string;
  aiCode: string; // Code used by Sarvam AI
};

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", flag: "🇺🇸", aiCode: "en-IN" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳", aiCode: "hi-IN" },
  { code: "bn", name: "বাংলা", flag: "🇮🇳", aiCode: "bn-IN" },
  { code: "te", name: "తెలుగు", flag: "🇮🇳", aiCode: "te-IN" },
  { code: "ta", name: "தமிழ்", flag: "🇮🇳", aiCode: "ta-IN" },
  { code: "mr", name: "मराठी", flag: "🇮🇳", aiCode: "mr-IN" },
  { code: "kn", name: "ಕನ್ನಡ", flag: "🇮🇳", aiCode: "kn-IN" },
  { code: "gu", name: "ગુજરાતી", flag: "🇮🇳", aiCode: "gu-IN" },
];

type LanguageContextType = {
  currentLanguage: Language;
  setLanguage: (code: string) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(LANGUAGES[0]);

  useEffect(() => {
    const saved = localStorage.getItem("preferred-language");
    if (saved) {
      const found = LANGUAGES.find((l) => l.code === saved);
      if (found) setCurrentLanguage(found);
    }
  }, []);

  const setLanguage = (code: string) => {
    const found = LANGUAGES.find((l) => l.code === code);
    if (found) {
      setCurrentLanguage(found);
      localStorage.setItem("preferred-language", code);
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
