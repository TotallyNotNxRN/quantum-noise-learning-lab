"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

// Plotly is heavy and depends on browser-only globals (document, window).
// Dynamic-import with ssr:false so it never runs on the Next.js server.
const Plot = dynamic(() => import("./PlotlyCore"), { ssr: false });

interface CurveSeries {
  name: string;
  values: { x: number; y: number }[];
  color: "primary" | "secondary" | "good" | "bad";
  dashed?: boolean;
}

interface PlotlyCurveProps {
  title?: string;
  series: CurveSeries[];
  xLabel: string;
  yLabel: string;
  yDomain?: [number, number];
  vline?: number;
  height?: number;
}

/** Plotly-backed line chart with native box-zoom, pan, reset, and crosshair
 *  hover. Matches the interactive feel of the original Streamlit version
 *  while staying theme-aware on every render. */
export function MetricCurve({
  title,
  series,
  xLabel,
  yLabel,
  yDomain = [0, 1],
  vline,
  height = 320,
}: PlotlyCurveProps) {
  return (
    <div className="qnl-plot-host rounded-glass p-3" style={{ background: "var(--plot-bg)" }}>
      {title && <p className="px-1 pb-2 font-serif text-sm text-ink">{title}</p>}
      <Plot
        height={height}
        series={series}
        xLabel={xLabel}
        yLabel={yLabel}
        yDomain={yDomain}
        vline={vline}
      />
    </div>
  );
}

export type { CurveSeries };

/** Tiny hook to subscribe to theme-change events; used by the Plotly inner
 *  component to refresh its layout colors on toggle. Exported so the
 *  PlotlyCore module can import it without duplicating the listener. */
export function useThemeRevision(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    document.addEventListener("qnl-theme-change", bump);
    return () => document.removeEventListener("qnl-theme-change", bump);
  }, []);
  return tick;
}

// Stable color name map used both here and inside the Plotly core. Plotly
// needs hex / rgba strings, so we resolve CSS variables at render time.
export const COLOR_VARS: Record<CurveSeries["color"], string> = {
  primary: "--plot-line",
  secondary: "--plot-line-2",
  good: "--good",
  bad: "--bad",
};

export function useResolvedToken(name: string, fallback: string): string {
  const tick = useThemeRevision();
  return useMemo(() => {
    if (typeof window === "undefined") return fallback;
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, fallback, tick]);
}
