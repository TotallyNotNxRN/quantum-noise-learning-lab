"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import createPlotlyComponent from "react-plotly.js/factory";
import Plotly from "plotly.js-basic-dist";

import { useThemeRevision, useResolvedToken, COLOR_VARS, type CurveSeries } from "./PlotlyCurve";

const Plot = createPlotlyComponent(Plotly as never);

interface Props {
  height: number;
  series: CurveSeries[];
  xLabel: string;
  yLabel: string;
  yDomain: [number, number];
  vline?: number;
}

export default function PlotlyCore({ height, series, xLabel, yLabel, yDomain, vline }: Props) {
  const tick = useThemeRevision();
  const text = useResolvedToken("--text", "#f5f5f4");
  const textDim = useResolvedToken("--text-dim", "#a8a29e");
  const grid = useResolvedToken("--plot-grid", "rgba(255,255,255,0.06)");
  const panelStrong = useResolvedToken("--panel-strong", "rgba(20,26,38,0.85)");
  const panelBorder = useResolvedToken("--panel-border", "rgba(122,162,255,0.18)");
  const warn = useResolvedToken("--warn", "#fbbf24");

  // Resolve per-series color names to hex.
  const data = useMemo(
    () =>
      series.map((s) => ({
        x: s.values.map((p) => p.x),
        y: s.values.map((p) => p.y),
        mode: "lines+markers" as const,
        name: s.name,
        type: "scatter" as const,
        line: {
          color: getColorFor(s.color),
          width: 2.4,
          dash: s.dashed ? ("dash" as const) : ("solid" as const),
        },
        marker: { size: 5 },
        hovertemplate: `${xLabel} = %{x:.3f}<br>${s.name} = %{y:.4f}<extra></extra>`,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, xLabel, tick],
  );

  function getColorFor(c: CurveSeries["color"]): string {
    return getComputedStyle(document.documentElement).getPropertyValue(COLOR_VARS[c]).trim() || "#fbbf24";
  }

  const layout = useMemo(
    () =>
      ({
        autosize: true,
        height,
        margin: { l: 50, r: 20, t: 8, b: 42 },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: textDim, family: "Inter, sans-serif", size: 11 },
        xaxis: {
          title: { text: xLabel, font: { color: textDim } },
          range: [0, 1],
          gridcolor: grid,
          zerolinecolor: grid,
          tickfont: { color: textDim },
          fixedrange: false,
        },
        yaxis: {
          title: { text: yLabel, font: { color: textDim } },
          range: yDomain,
          gridcolor: grid,
          zerolinecolor: grid,
          tickfont: { color: textDim },
          fixedrange: false,
        },
        showlegend: series.length > 1,
        legend: {
          orientation: "h" as const,
          x: 1,
          xanchor: "right" as const,
          y: 1.08,
          yanchor: "bottom" as const,
          font: { color: textDim, size: 11 },
        },
        shapes: vline !== undefined ? [
          {
            type: "line" as const,
            xref: "x" as const,
            yref: "paper" as const,
            x0: vline,
            x1: vline,
            y0: 0,
            y1: 1,
            line: { color: warn, width: 1.4, dash: "dot" as const },
          },
        ] : undefined,
        hoverlabel: {
          bgcolor: panelStrong,
          bordercolor: panelBorder,
          font: { color: text, family: "Inter, sans-serif" },
        },
        dragmode: "zoom" as const,
      }),
    [height, xLabel, yLabel, yDomain, vline, series.length, text, textDim, grid, panelStrong, panelBorder, warn],
  );

  const config = useMemo(
    () => ({
      displaylogo: false,
      responsive: true,
      modeBarButtonsToRemove: [
        "lasso2d",
        "select2d",
        "toggleSpikelines",
      ] as ("lasso2d" | "select2d" | "toggleSpikelines")[],
      displayModeBar: "hover" as const,
    }),
    [],
  );

  return (
    <Plot
      data={data}
      layout={layout}
      config={config}
      style={{ width: "100%", height: `${height}px` }}
      useResizeHandler
    />
  );
}
