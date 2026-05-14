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
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="relative inline-flex h-9 w-[68px] items-center rounded-full border px-1"
      style={{
        borderColor: "var(--panel-border)",
        background: "var(--panel)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <span className="sr-only">Toggle theme</span>
      {/* Static side icons — dimmed when not the active mode. */}
      <span
        className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2"
        style={{
          color: isDark ? "var(--accent)" : "var(--text-dim)",
          opacity: isDark ? 1 : 0.45,
          transition: "opacity 280ms ease, color 280ms ease",
        }}
        aria-hidden
      >
        <MoonIcon />
      </span>
      <span
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
        style={{
          color: isDark ? "var(--text-dim)" : "var(--accent)",
          opacity: isDark ? 0.45 : 1,
          transition: "opacity 280ms ease, color 280ms ease",
        }}
        aria-hidden
      >
        <SunIcon />
      </span>
      {/* Sliding thumb. */}
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 480, damping: 32 }}
        className="absolute h-7 w-7 rounded-full"
        style={{
          background: "var(--accent)",
          left: isDark ? 4 : 36,
          top: 4,
          boxShadow: "0 4px 14px rgba(251, 191, 36, 0.40)",
        }}
      />
    </button>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m4.93 19.07 1.41-1.41" />
      <path d="m17.66 6.34 1.41-1.41" />
    </svg>
  );
}
