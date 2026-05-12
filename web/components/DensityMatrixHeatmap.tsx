"use client";

import { type Mat } from "@/lib/matrix";

interface HeatmapProps {
  rho: Mat;
  title?: string;
  signed?: boolean;
  labels?: string[];
}

/** Hand-rendered SVG heatmap of the real part of a density matrix. Stays
 *  inside its parent container — no Plotly auto-resize bugs. Hover shows
 *  a tooltip with both real and imaginary parts. */
export function DensityMatrixHeatmap({ rho, title, signed = true, labels }: HeatmapProps) {
  if (!rho.length) return null;
  const n = rho.length;
  const cell = 88;
  const padLeft = 38;
  const padTop = title ? 38 : 16;
  const padRight = 12;
  const padBottom = 28;
  const w = padLeft + cell * n + padRight;
  const h = padTop + cell * n + padBottom;

  let absMax = 1;
  if (signed) {
    let m = 0;
    for (const row of rho) for (const e of row) m = Math.max(m, Math.abs(e.re));
    absMax = Math.max(m, 1e-12);
  }

  const lbl = labels ?? (n === 2 ? ["|0⟩", "|1⟩"] : Array.from({ length: n }, (_, i) => String(i)));

  return (
    <div className="qnl-plot-host rounded-glass" style={{ background: "var(--plot-bg)" }}>
      {title && (
        <p className="px-4 pt-3 font-serif text-sm text-ink">{title}</p>
      )}
      <svg
        viewBox={`0 0 ${w} ${h}`}
        xmlns="http://www.w3.org/2000/svg"
        className="block w-full"
        style={{ aspectRatio: `${w} / ${h}` }}
      >
        {lbl.map((s, j) => (
          <text
            key={`col-${j}`}
            x={padLeft + j * cell + cell / 2}
            y={padTop - 8}
            textAnchor="middle"
            fontSize={12}
            fill="var(--text-dim)"
            fontFamily="JetBrains Mono, monospace"
          >
            {s}
          </text>
        ))}
        {lbl.map((s, i) => (
          <text
            key={`row-${i}`}
            x={padLeft - 8}
            y={padTop + i * cell + cell / 2}
            textAnchor="end"
            dominantBaseline="central"
            fontSize={12}
            fill="var(--text-dim)"
            fontFamily="JetBrains Mono, monospace"
          >
            {s}
          </text>
        ))}
        {rho.map((row, i) =>
          row.map((entry, j) => {
            const val = entry.re;
            const norm = absMax === 0 ? 0 : val / absMax;
            const color = signed ? signedColor(norm) : posColor(Math.max(0, val));
            const cx = padLeft + j * cell;
            const cy = padTop + i * cell;
            const text = entry.im === 0 ? val.toFixed(3) : `${val.toFixed(3)}${entry.im >= 0 ? "+" : "−"}${Math.abs(entry.im).toFixed(3)}i`;
            return (
              <g key={`cell-${i}-${j}`}>
                <rect x={cx} y={cy} width={cell} height={cell} fill={color} stroke="rgba(255,255,255,0.04)" />
                <text
                  x={cx + cell / 2}
                  y={cy + cell / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={13}
                  fontFamily="JetBrains Mono, monospace"
                  fill={Math.abs(norm) > 0.55 ? "#fff" : "var(--text)"}
                >
                  {text}
                </text>
              </g>
            );
          }),
        )}
      </svg>
    </div>
  );
}

function signedColor(t: number): string {
  // t ∈ [-1, 1]. -1 → heatmap-neg, 0 → heatmap-mid, +1 → heatmap-pos
  if (t >= 0) return mix("var(--heatmap-mid)", "var(--heatmap-pos)", t);
  return mix("var(--heatmap-mid)", "var(--heatmap-neg)", -t);
}

function posColor(t: number): string {
  return mix("var(--heatmap-mid)", "var(--heatmap-pos)", Math.min(1, t));
}

function mix(a: string, b: string, t: number): string {
  // Use CSS color-mix for smooth gradient blending across themes.
  const pct = Math.round(t * 100);
  return `color-mix(in srgb, ${a} ${100 - pct}%, ${b} ${pct}%)`;
}
