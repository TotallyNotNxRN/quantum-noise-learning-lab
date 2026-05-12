import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-deep": "var(--bg-deep)",
        panel: "var(--panel)",
        "panel-strong": "var(--panel-strong)",
        "panel-border": "var(--panel-border)",
        ink: "var(--text)",
        "ink-dim": "var(--text-dim)",
        accent: "var(--accent)",
        "accent-2": "var(--accent-2)",
        good: "var(--good)",
        warn: "var(--warn)",
        bad: "var(--bad)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Newsreader", "Georgia", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glass: "0 10px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
        "glass-hover": "0 22px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10)",
      },
      borderRadius: {
        glass: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
