"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { type ThemeName, getStoredTheme, setStoredTheme } from "@/lib/theme";

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("dark");

  useEffect(() => {
    const initial = getStoredTheme();
    setThemeState(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const apply = (next: ThemeName) => {
    setThemeState(next);
    setStoredTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    document.dispatchEvent(new CustomEvent("qnl-theme-change", { detail: { theme: next } }));
  };

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme: apply, toggle: () => apply(theme === "dark" ? "light" : "dark") }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
