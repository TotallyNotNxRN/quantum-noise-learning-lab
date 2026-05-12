"use client";

/** Quantum Noise Learning Lab — monochrome wordmark with an amber dot.
 *  Stylized Bloch silhouette: outer ring, equator ellipse, amber tip.
 *  Pairs with serif wordmark. Sizes via `size`. */
export function Logo({ size = 36, withWordmark = false, className }: { size?: number; withWordmark?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Quantum Noise Lab logo"
        role="img"
      >
        <circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <ellipse cx="24" cy="24" rx="17" ry="5.4" fill="none" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1" />
        <line x1="24" y1="24" x2="35" y2="14" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="35" cy="14" r="3.2" fill="var(--accent)" />
        <circle cx="24" cy="24" r="1.6" fill="currentColor" />
      </svg>
      {withWordmark && (
        <span className="flex flex-col leading-tight" style={{ color: "var(--text)" }}>
          <span className="font-serif text-[17px] tracking-tight">Quantum Noise Lab</span>
          <span className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--text-dim)" }}>
            single-qubit · decoherence
          </span>
        </span>
      )}
    </span>
  );
}
