"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";

// Custom Theme Context to replace next-themes and avoid React 19 script tag errors
type Theme = 'light' | 'dark';
const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolvedTheme: Theme;
}>({
  theme: 'dark',
  setTheme: () => {},
  resolvedTheme: 'dark',
});

export const useTheme = () => useContext(ThemeContext);

export const Providers = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    // Sync with localStorage
    const saved = localStorage.getItem('theme') as Theme;
    if (saved) setThemeState(saved);
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setThemeState('dark');
  }, []);

  useEffect(() => {
    // Apply class to html tag
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <SessionProvider>
      <ThemeContext.Provider value={{ theme, setTheme: setThemeState, resolvedTheme: theme }}>
        {children}
      </ThemeContext.Provider>
    </SessionProvider>
  );
};
