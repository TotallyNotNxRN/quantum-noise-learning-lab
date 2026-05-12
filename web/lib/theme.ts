// Theme token contract. Both [data-theme="dark"] and [data-theme="light"]
// blocks in app/globals.css define the same set of variables — every UI
// surface paints through one of these tokens, never a literal color.

export type ThemeName = "dark" | "light";

export const THEME_TOKENS = [
  "--bg",
  "--bg-deep",
  "--panel",
  "--panel-strong",
  "--panel-border",
  "--text",
  "--text-dim",
  "--text-accent",
  "--accent",
  "--accent-2",
  "--good",
  "--warn",
  "--bad",
  "--plot-bg",
  "--plot-grid",
  "--plot-line",
  "--plot-line-2",
  "--heatmap-pos",
  "--heatmap-neg",
  "--heatmap-mid",
  "--bloch-sphere",
  "--bloch-equator",
  "--bloch-vector",
  "--bloch-axis",
  "--shadow-1",
  "--shadow-2",
  "--bg-point",
  "--bg-point-fade",
] as const;

export type ThemeToken = (typeof THEME_TOKENS)[number];

export function readThemeToken(token: ThemeToken): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}

export function getStoredTheme(): ThemeName {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem("qnl-theme");
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
}

export function setStoredTheme(theme: ThemeName): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("qnl-theme", theme);
}
