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
      className="relative inline-flex h-8 w-16 items-center rounded-full border px-1 transition-colors"
      style={{
        borderColor: "var(--panel-border)",
        background: "var(--panel)",
      }}
    >
      <span className="sr-only">Toggle theme</span>
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 480, damping: 30 }}
        className="absolute h-6 w-6 rounded-full"
        style={{
          background: "var(--accent)",
          left: isDark ? 4 : 36,
          boxShadow: "0 4px 12px rgba(251, 191, 36, 0.35)",
        }}
      />
      <span className="ml-auto select-none text-[10px] uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
        {isDark ? "dark" : "light"}
      </span>
    </button>
  );
}
