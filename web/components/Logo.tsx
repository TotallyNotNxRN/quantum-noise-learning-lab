"use client";

/** Quantum Noise Learning Lab logo. Hand-built SVG: a stylized Bloch sphere
 *  with an orange vector tip and accent rings. Pairs with the wordmark.
 *  Sized via `size`; renders inline so it inherits color from `currentColor`
 *  via the theme variable. */
export function Logo({ size = 36, withWordmark = false, className }: { size?: number; withWordmark?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Quantum Noise Lab logo"
        role="img"
      >
        <defs>
          <radialGradient id="qnl-halo" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.32" />
            <stop offset="60%" stopColor="var(--accent)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="qnl-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="22" fill="url(#qnl-halo)" />
        <circle
          cx="24"
          cy="24"
          r="16"
          fill="none"
          stroke="url(#qnl-ring)"
          strokeWidth="1.4"
        />
        <ellipse
          cx="24"
          cy="24"
          rx="16"
          ry="5.2"
          fill="none"
          stroke="var(--accent)"
          strokeOpacity="0.65"
          strokeWidth="1"
        />
        <line
          x1="24"
          y1="24"
          x2="34.5"
          y2="14.6"
          stroke="var(--bloch-vector)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="34.5" cy="14.6" r="3.2" fill="var(--bloch-vector)" />
        <circle cx="24" cy="24" r="1.8" fill="var(--accent)" />
      </svg>
      {withWordmark && (
        <span className="flex flex-col leading-tight">
          <span className="font-serif text-lg tracking-tight">Quantum Noise Lab</span>
          <span className="text-[10px] uppercase tracking-[0.16em] text-ink-dim">
            single-qubit · decoherence
          </span>
        </span>
      )}
    </span>
  );
}
