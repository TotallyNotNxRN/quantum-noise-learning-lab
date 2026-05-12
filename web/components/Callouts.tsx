"use client";

import { type ReactNode, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";

function Disclosure({
  label,
  children,
  defaultOpen = true,
}: {
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-glass border border-panel-border bg-panel shadow-glass">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-ink hover:text-accent"
      >
        <span>{label}</span>
        <span
          className="text-ink-dim transition-transform"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0)" }}
          aria-hidden
        >
          +
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 pb-4 pt-1 text-sm leading-relaxed text-ink-dim">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function BeginnerBox({ children }: { children: ReactNode }) {
  return <Disclosure label="Beginner explanation">{children}</Disclosure>;
}

export function TechnicalBox({ children }: { children: ReactNode }) {
  return <Disclosure label="Technical explanation" defaultOpen={false}>{children}</Disclosure>;
}

export function ConventionCallout({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-glass border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-ink">
      <strong className="font-semibold text-warn">Convention.</strong>{" "}
      <span className="text-ink-dim">{children}</span>
    </div>
  );
}

export function ValidationPill({
  hermitian,
  psd,
  trace,
  atol,
}: {
  hermitian: boolean;
  psd: boolean;
  trace: number;
  atol: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <Pill ok={hermitian} label="Hermitian" tooltip={`||ρ − ρ†||_F ≤ ${atol}`} />
      <Pill ok={psd} label="PSD" tooltip={`min eigenvalue ≥ −${atol}`} />
      <Pill ok={Math.abs(trace - 1) <= atol} label="Trace = 1" tooltip={`|Tr ρ − 1| = ${Math.abs(trace - 1).toExponential(2)} ≤ ${atol}`} />
    </div>
  );
}

function Pill({ ok, label, tooltip }: { ok: boolean; label: string; tooltip: string }) {
  return (
    <span
      title={tooltip}
      className={[
        "rounded-full border px-3 py-1 font-mono text-[11px] tracking-wide",
        ok
          ? "border-good/40 bg-good/10 text-good"
          : "border-bad/40 bg-bad/10 text-bad",
      ].join(" ")}
    >
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}
