"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <header className="sticky top-0 z-40 border-b border-panel-border bg-bg/80 backdrop-blur-md">
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
                className={[
                  "relative rounded-md px-3 py-1.5 text-sm transition-colors",
                  active ? "text-ink" : "text-ink-dim hover:text-ink",
                ].join(" ")}
              >
                {m.label}
                {active && (
                  <span className="absolute inset-x-2 -bottom-px h-px bg-accent" />
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
