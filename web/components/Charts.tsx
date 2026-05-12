"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface CurveSeries {
  name: string;
  values: { x: number; y: number }[];
  color: "primary" | "secondary" | "good" | "bad";
  dashed?: boolean;
}

const COLOR_VAR: Record<CurveSeries["color"], string> = {
  primary: "var(--plot-line)",
  secondary: "var(--plot-line-2)",
  good: "var(--good)",
  bad: "var(--bad)",
};

export function MetricCurve({
  title,
  series,
  xLabel,
  yLabel,
  yDomain = [0, 1],
  vline,
  height = 280,
}: {
  title?: string;
  series: CurveSeries[];
  xLabel: string;
  yLabel: string;
  yDomain?: [number, number];
  vline?: number;
  height?: number;
}) {
  const merged = mergeSeries(series);
  return (
    <div className="qnl-plot-host rounded-glass p-3" style={{ background: "var(--plot-bg)" }}>
      {title && <p className="px-1 pb-2 font-serif text-sm text-ink">{title}</p>}
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <LineChart data={merged} margin={{ top: 10, right: 20, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="var(--plot-grid)" strokeDasharray="2 2" />
            <XAxis
              dataKey="x"
              type="number"
              domain={[0, 1]}
              stroke="var(--text-dim)"
              tick={{ fill: "var(--text-dim)", fontSize: 11 }}
              label={{ value: xLabel, position: "insideBottom", offset: -4, fill: "var(--text-dim)" }}
            />
            <YAxis
              domain={yDomain}
              stroke="var(--text-dim)"
              tick={{ fill: "var(--text-dim)", fontSize: 11 }}
              label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "var(--text-dim)" }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--panel-strong)",
                border: "1px solid var(--panel-border)",
                borderRadius: 10,
                color: "var(--text)",
                fontSize: 12,
              }}
              labelFormatter={(v) => `${xLabel} = ${(v as number).toFixed(3)}`}
            />
            {vline !== undefined && (
              <ReferenceLine x={vline} stroke="var(--warn)" strokeDasharray="3 3" />
            )}
            <Legend wrapperStyle={{ paddingTop: 8, fontSize: 12, color: "var(--text-dim)" }} />
            {series.map((s, idx) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={COLOR_VAR[s.color]}
                strokeWidth={2.4}
                dot={{ r: 2 }}
                isAnimationActive={false}
                strokeDasharray={s.dashed ? "5 4" : undefined}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function mergeSeries(series: CurveSeries[]): Array<Record<string, number>> {
  const xs = new Set<number>();
  series.forEach((s) => s.values.forEach((p) => xs.add(p.x)));
  const xSorted = Array.from(xs).sort((a, b) => a - b);
  return xSorted.map((x) => {
    const row: Record<string, number> = { x };
    for (const s of series) {
      const found = s.values.find((p) => p.x === x);
      if (found) row[s.name] = found.y;
    }
    return row;
  });
}

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
