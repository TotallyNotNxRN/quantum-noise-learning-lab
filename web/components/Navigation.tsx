"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const MODULES = [
  { href: "/", label: "Home" },
  { href: "/foundations", label: "Foundations" },
  { href: "/noise", label: "Noise" },
  { href: "/metrics", label: "Metrics" },
  { href: "/validation", label: "Validation" },
  { href: "/protection", label: "Protection" },
];

export function Navigation() {
  const pathname = usePathname();
  return (
    <header
      className="sticky top-0 z-40 border-b border-panel-border"
      style={{
        background: "color-mix(in srgb, var(--bg-deep) 80%, transparent)",
        backdropFilter: "blur(14px) saturate(140%)",
        WebkitBackdropFilter: "blur(14px) saturate(140%)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3">
        <Link href="/" className="flex items-center" aria-label="Home">
          <Logo size={32} withWordmark />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {MODULES.map((m) => {
            const active = pathname === m.href;
            return (
              <Link
                key={m.href}
                href={m.href}
                className="relative rounded-md px-3 py-1.5 text-sm transition-colors"
                style={{ color: active ? "var(--text)" : "var(--text-dim)" }}
              >
                {m.label}
                {active && (
                  <motion.span
                    layoutId="qnl-nav-underline"
                    className="absolute inset-x-2 -bottom-px h-px"
                    style={{ background: "var(--accent)" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
