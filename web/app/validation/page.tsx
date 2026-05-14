"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { BeginnerBox, ConventionCallout, TechnicalBox } from "@/components/Callouts";
import { MetricCurve } from "@/components/Charts";
import { DensityMatrixHeatmap } from "@/components/DensityMatrixHeatmap";
import { Equation } from "@/components/Equation";
import { GlassPanel } from "@/components/GlassPanel";

import {
  analyticalAmplitudeDensity,
  analyticalAmplitudeFidelity,
  analyticalPhaseDensity,
  analyticalPhaseFidelity,
} from "@/lib/analytical";
import { type Mat } from "@/lib/matrix";
import { fidelity } from "@/lib/metrics";
import { amplitudeDampingKraus, applyKrausChannel, phaseDampingKraus } from "@/lib/noise";
import { densityMatrix, plusState } from "@/lib/states";
import { linspace, sweepMetric } from "@/lib/sweeps";

const BlochSphere = dynamic(() => import("@/components/BlochSphere").then((m) => m.BlochSphere), {
  ssr: false,
});

type Channel = "amplitude" | "phase";

export default function ValidationPage() {
  const [channel, setChannel] = useState<Channel>("amplitude");
  const [param, setParam] = useState(0.5);
  // Defer the slider value for the chart vline so recharts doesn't
  // re-layout on every slider tick.
  const paramForCurves = useDeferredValue(param);

  const grid = useMemo(() => linspace(0, 1, 51), []);
  const rho0 = useMemo(() => densityMatrix(plusState()), []);

  const krausFn = channel === "amplitude" ? amplitudeDampingKraus : phaseDampingKraus;
  const anaRhoFn = channel === "amplitude" ? analyticalAmplitudeDensity : analyticalPhaseDensity;
  const anaFidFn = channel === "amplitude" ? analyticalAmplitudeFidelity : analyticalPhaseFidelity;
  const sym = channel === "amplitude" ? "γ" : "λ";

  const rhoSim = useMemo(() => applyKrausChannel(rho0, krausFn(param)), [rho0, krausFn, param]);
  const rhoAna = useMemo(() => anaRhoFn(param), [anaRhoFn, param]);
  const err: Mat = useMemo(
    () => rhoSim.map((row, i) => row.map((e, j) => ({ re: e.re - rhoAna[i][j].re, im: e.im - rhoAna[i][j].im }))),
    [rhoSim, rhoAna],
  );
  const absMax = useMemo(() => {
    let m = 0;
    for (const row of err) for (const e of row) m = Math.max(m, Math.hypot(e.re, e.im));
    return m;
  }, [err]);

  const fidSim = useMemo(() => sweepMetric(krausFn, rho0, plusState(), fidelity, grid), [krausFn, rho0, grid]);
  const fidAna = useMemo(() => grid.map((g) => anaFidFn(g)), [anaFidFn, grid]);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-dim">
          Module 04 — Validation
        </p>
        <h1 className="font-serif text-3xl md:text-4xl">Analytical vs simulated decoherence</h1>
        <p className="max-w-3xl text-ink-dim">
          For the |+⟩ initial state under amplitude and phase damping we
          can solve ρ(t) and F(t) in closed form. This page renders both
          and shows the absolute error live — it should always be at
          floating-point noise level (~1e-15).
        </p>
      </header>

      <GlassPanel className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {(["amplitude", "phase"] as Channel[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChannel(c)}
              className={[
                "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                channel === c ? "border-accent bg-accent/15 text-accent" : "border-panel-border text-ink-dim hover:border-accent hover:text-ink",
              ].join(" ")}
            >
              {c === "amplitude" ? "Amplitude damping" : "Phase damping"}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="text-sm text-ink-dim">
            <span className="font-mono text-ink">{sym}</span> = <span className="font-mono text-ink">{param.toFixed(3)}</span>
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.005}
            value={param}
            onChange={(e) => setParam(parseFloat(e.target.value))}
            className="qnl-slider mt-1 w-full"
          />
        </label>
      </GlassPanel>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassPanel className="space-y-3 p-6">
          <h2 className="font-serif text-xl">Closed-form result</h2>
          {channel === "amplitude" ? (
            <Equation latex="\rho_{AD}(\gamma) = \begin{pmatrix} (1+\gamma)/2 & \sqrt{1-\gamma}/2 \\ \sqrt{1-\gamma}/2 & (1-\gamma)/2 \end{pmatrix},\quad F_{AD}(\gamma) = \frac{1+\sqrt{1-\gamma}}{2}" />
          ) : (
            <Equation latex="\rho_{PD}(\lambda) = \begin{pmatrix} 1/2 & (1-\lambda)/2 \\ (1-\lambda)/2 & 1/2 \end{pmatrix},\quad F_{PD}(\lambda) = 1 - \lambda/2" />
          )}
          <ConventionCallout>
            Phase damping convention: random-Z form, off-diagonals scaled by exactly (1 − λ).
          </ConventionCallout>
          <BeginnerBox>
            "Validation" means we wrote down the math by hand and then asked
            the simulator to match. If it doesn't, something in the simulator
            is wrong. The absolute-error heatmap should be uniformly zero;
            any visible color is just floating-point noise (~1e-15).
          </BeginnerBox>
          <TechnicalBox>
            The TypeScript engine in <code>web/lib</code> is gated by a Vitest
            suite that compares every output against a JSON fixture produced
            by the Python reference engine to an absolute tolerance of 1e-12.
            The Python engine in turn has 211 pytest assertions covering the
            same physics. Drift in either is caught immediately.
          </TechnicalBox>
          <div className="rounded-glass border border-good/30 bg-good/5 p-3 text-xs">
            <span className="font-medium text-good">max |Δρ| =</span>{" "}
            <span className="mono text-ink">{absMax.toExponential(2)}</span>{" "}
            <span className="text-ink-dim">(should be ≤ 1e-12)</span>
          </div>
          <div className="pt-2">
            <BlochSphere
              rho={rhoSim}
              ghost={rho0}
              height={320}
              caption="Solid: simulated · dashed: |+⟩ initial."
            />
          </div>
        </GlassPanel>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <GlassPanel className="p-3" tilt={false}>
              <p className="px-1 pb-2 font-serif text-sm">Simulated ρ</p>
              <DensityMatrixHeatmap rho={rhoSim} />
            </GlassPanel>
            <GlassPanel className="p-3" tilt={false}>
              <p className="px-1 pb-2 font-serif text-sm">Analytical ρ</p>
              <DensityMatrixHeatmap rho={rhoAna} />
            </GlassPanel>
          </div>
          <GlassPanel className="p-3" tilt={false}>
            <p className="px-1 pb-2 font-serif text-sm">|ρ_sim − ρ_ana|</p>
            <DensityMatrixHeatmap rho={err} signed />
          </GlassPanel>
          <GlassPanel className="p-3" tilt={false}>
            <MetricCurve
              title="Fidelity overlay"
              xLabel={sym}
              yLabel="F"
              vline={paramForCurves}
              yDomain={[0, 1.02]}
              series={[
                { name: "Simulated", values: grid.map((x, i) => ({ x, y: fidSim[i] })), color: "primary" },
                { name: "Analytical", values: grid.map((x, i) => ({ x, y: fidAna[i] })), color: "secondary", dashed: true },
              ]}
            />
          </GlassPanel>
        </div>
      </section>

      <Link
        href="/protection"
        className="group inline-flex items-center gap-2 rounded-glass border border-panel-border bg-panel px-4 py-2.5 text-sm font-medium text-ink hover:border-accent hover:text-accent"
      >
        Next →<span className="text-ink-dim group-hover:text-accent">Protection — why redundancy helps</span>
      </Link>
    </div>
  );
}
