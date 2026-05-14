"use client";

import { type ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  /** Kept for back-compat with prior API; ignored. The new glass design
   *  does not use the 3D mouse-tilt — it relies on a frost-and-glow hover
   *  instead, which feels calmer and is easier on the GPU. */
  tilt?: boolean;
  glow?: boolean;
}

/** Frosted-glass panel.
 *
 *  Resting state: light blur (16 px), low-opacity panel surface, hairline
 *  border.
 *  Hover state: blur jumps to 28 px + saturation 180 %, border lights up
 *  amber, and a soft outer halo grows. Implemented purely via CSS so the
 *  hover doesn't allocate / re-render anything in React. */
export function GlassPanel({ children, className, glow = false }: GlassPanelProps) {
  return (
    <div
      className={["qnl-glass rounded-glass relative", glow ? "qnl-glass-glow" : "", className ?? ""].join(" ")}
    >
      {children}
    </div>
  );
}
