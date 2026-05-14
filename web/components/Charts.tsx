"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Plotly-backed line chart with native box-zoom / pan / reset. Re-exported
// here so existing pages can keep importing { MetricCurve } from
// "@/components/Charts" unchanged.
export { MetricCurve } from "./PlotlyCurve";

export function EigenvalueBar({ eigs, title, height = 220 }: { eigs: number[]; title?: string; height?: number }) {
  const data = eigs.map((e, i) => ({ name: `λ${i}`, value: e }));
  return (
    <div className="qnl-plot-host rounded-glass p-3" style={{ background: "var(--plot-bg)" }}>
      {title && <p className="px-1 pb-2 font-serif text-sm text-ink">{title}</p>}
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="var(--plot-grid)" strokeDasharray="2 2" vertical={false} />
            <XAxis dataKey="name" stroke="var(--text-dim)" tick={{ fill: "var(--text-dim)", fontSize: 12 }} />
            <YAxis domain={[0, 1]} stroke="var(--text-dim)" tick={{ fill: "var(--text-dim)", fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: "var(--panel-strong)",
                border: "1px solid var(--panel-border)",
                borderRadius: 10,
                color: "var(--text)",
                fontSize: 12,
              }}
              cursor={{ fill: "var(--panel-border)" }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={false}>
              {data.map((d, i) => (
                <Cell key={i} fill={i === 0 ? "var(--plot-line-2)" : "var(--plot-line)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ProbabilityBar({ probs, title, height = 220 }: { probs: { name: string; value: number }[]; title?: string; height?: number }) {
  return (
    <div className="qnl-plot-host rounded-glass p-3" style={{ background: "var(--plot-bg)" }}>
      {title && <p className="px-1 pb-2 font-serif text-sm text-ink">{title}</p>}
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <BarChart data={probs} margin={{ top: 10, right: 20, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="var(--plot-grid)" strokeDasharray="2 2" vertical={false} />
            <XAxis dataKey="name" stroke="var(--text-dim)" tick={{ fill: "var(--text-dim)", fontSize: 12 }} />
            <YAxis domain={[0, 1]} stroke="var(--text-dim)" tick={{ fill: "var(--text-dim)", fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: "var(--panel-strong)",
                border: "1px solid var(--panel-border)",
                borderRadius: 10,
                color: "var(--text)",
                fontSize: 12,
              }}
              cursor={{ fill: "var(--panel-border)" }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="var(--plot-line)" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
