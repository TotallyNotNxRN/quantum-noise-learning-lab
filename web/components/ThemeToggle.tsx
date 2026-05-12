"use client";

import { motion } from "framer-motion";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="relative inline-flex h-8 w-16 items-center rounded-full border border-panel-border bg-panel px-1 transition-colors hover:border-accent"
    >
      <span className="sr-only">Toggle theme</span>
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 36 }}
        className="absolute h-6 w-6 rounded-full bg-accent shadow-glass"
        style={{ left: isDark ? 4 : 36 }}
      />
      <span className="ml-1 select-none text-xs font-medium text-ink-dim">
        {isDark ? "" : ""}
      </span>
    </button>
  );
}
