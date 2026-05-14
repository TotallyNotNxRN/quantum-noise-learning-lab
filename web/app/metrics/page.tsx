"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { BeginnerBox, TechnicalBox, ValidationPill } from "@/components/Callouts";
import { EigenvalueBar, MetricCurve } from "@/components/Charts";
import { DensityMatrixHeatmap } from "@/components/DensityMatrixHeatmap";
import { Equation } from "@/components/Equation";
import { GlassPanel } from "@/components/GlassPanel";

import { eigenvalues, fidelity, isHermitian, isPositiveSemidefinite, purity, traceValue } from "@/lib/metrics";
import {
  amplitudeDampingKraus,
  applyKrausChannel,
  depolarizingKraus,
  phaseDampingKraus,
} from "@/lib/noise";
import { densityMatrix, plusState } from "@/lib/states";
import { linspace, sweepMetric } from "@/lib/sweeps";

type Channel = "amplitude" | "phase" | "depolarizing";

const CHANNEL: Record<Channel, { label: string; symbol: string; fn: typeof amplitudeDampingKraus }> = {
  amplitude: { label: "Amplitude damping", symbol: "γ", fn: amplitudeDampingKraus },
  phase: { label: "Phase damping", symbol: "λ", fn: phaseDampingKraus },
  depolarizing: { label: "Depolarizing", symbol: "p", fn: depolarizingKraus },
};

export default function MetricsPage() {
  const [channel, setChannel] = useState<Channel>("amplitude");
  const [param, setParam] = useState(0.4);
  // Slider perf: the recharts MetricCurves re-layout on every prop change
  // (including the vline `param`). Deferring `param` for the curves means
  // the heavy chart re-render runs at idle priority while the Bloch +
  // density-matrix heatmap stay real-time on the slider's `param`.
  const paramForCurves = useDeferredValue(param);
  const grid = useMemo(() => linspace(0, 1, 51), []);
  const rho0 = useMemo(() => densityMatrix(plusState()), []);
  const ref = useMemo(() => plusState(), []);
  const fidCurve = useMemo(
    () => sweepMetric(CHANNEL[channel].fn, rho0, ref, fidelity, grid),
    [channel, grid, rho0, ref],
  );
  const purCurve = useMemo(
    () => sweepMetric(CHANNEL[channel].fn, rho0, ref, (rho) => purity(rho), grid),
    [channel, grid, rho0, ref],
  );
  const rhoNow = useMemo(() => applyKrausChannel(rho0, CHANNEL[channel].fn(param)), [rho0, channel, param]);
  const eigsNow = eigenvalues(rhoNow);
  const fidNow = fidelity(rhoNow, ref);
  const purNow = purity(rhoNow);
  const trNow = traceValue(rhoNow).re;
  const minEig = Math.min(...eigsNow);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-dim">
          Module 03 — Metrics
        </p>
        <h1 className="font-serif text-3xl md:text-4xl">Fidelity, purity, eigenvalues</h1>
        <p className="max-w-3xl text-ink-dim">
          Three scalar diagnostics for how much a noise channel has deformed
          ρ. The Validation Lab next door proves that this lab's numbers
          match closed-form analytical predictions to 1e-12.
        </p>
      </header>

      <GlassPanel className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(CHANNEL) as Channel[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChannel(c)}
              className={[
                "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                channel === c ? "border-accent bg-accent/15 text-accent" : "border-panel-border text-ink-dim hover:border-accent hover:text-ink",
              ].join(" ")}
            >
              {CHANNEL[c].label}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="text-sm text-ink-dim">
            <span className="font-mono text-ink">{CHANNEL[channel].symbol}</span>{" "}
            <span>= </span>
            <span className="font-mono text-ink">{param.toFixed(3)}</span>
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
          <h2 className="font-serif text-xl">Definitions</h2>
          <Equation latex="F(\rho, \sigma) = \left(\operatorname{Tr}\sqrt{\sqrt{\rho}\,\sigma\,\sqrt{\rho}}\right)^2" />
          <Equation latex="\text{Purity}(\rho) = \operatorname{Tr}(\rho^2)" />
          <BeginnerBox>
            Fidelity measures how close the noisy state is to a reference;
            1 means identical, 0 means orthogonal. Purity tells you whether
            the state is pure (1) or a maximally mixed soup (1/d). Together
            with the eigenvalue spectrum they paint the full picture of how
            "quantum" the state still is.
          </BeginnerBox>
          <TechnicalBox>
            Fidelity here is the <em>squared</em> Uhlmann fidelity. For a pure
            reference σ = |ψ⟩⟨ψ|, F simplifies to ⟨ψ|ρ|ψ⟩ — used as a fast
            path in code. Eigenvalues come from a closed-form 2×2 Hermitian
            decomposition; tiny negatives from floating-point noise are
            clipped only for display, never for validity checks.
          </TechnicalBox>
        </GlassPanel>

        <div className="space-y-6">
          <GlassPanel className="p-4" tilt={false}>
            <h2 className="mb-3 font-serif text-xl">Current ρ at {CHANNEL[channel].symbol} = {param.toFixed(3)}</h2>
            <DensityMatrixHeatmap rho={rhoNow} />
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
              <Stat label="Fidelity F" value={fidNow.toFixed(4)} />
              <Stat label={`Purity Tr(ρ²)`} value={purNow.toFixed(4)} />
              <Stat label="Smallest eigenvalue" value={minEig.toFixed(4)} />
            </div>
            <div className="mt-3">
              <ValidationPill hermitian={isHermitian(rhoNow)} psd={isPositiveSemidefinite(rhoNow)} trace={trNow} atol={1e-10} />
            </div>
          </GlassPanel>
          <GlassPanel className="p-3" tilt={false}>
            <EigenvalueBar eigs={eigsNow} title="Eigenvalues of ρ" />
          </GlassPanel>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassPanel className="p-3" tilt={false}>
          <MetricCurve
            title="Fidelity vs noise"
            xLabel={CHANNEL[channel].symbol}
            yLabel="F"
            yDomain={[0, 1]}
            vline={paramForCurves}
            series={[{ name: "F", values: grid.map((x, i) => ({ x, y: fidCurve[i] })), color: "primary" }]}
          />
        </GlassPanel>
        <GlassPanel className="p-3" tilt={false}>
          <MetricCurve
            title="Purity vs noise"
            xLabel={CHANNEL[channel].symbol}
            yLabel="Tr(ρ²)"
            yDomain={[0.4, 1.05]}
            vline={paramForCurves}
            series={[{ name: "Purity", values: grid.map((x, i) => ({ x, y: purCurve[i] })), color: "secondary" }]}
          />
        </GlassPanel>
      </section>

      <Link
        href="/validation"
        className="group inline-flex items-center gap-2 rounded-glass border border-panel-border bg-panel px-4 py-2.5 text-sm font-medium text-ink hover:border-accent hover:text-accent"
      >
        Next →<span className="text-ink-dim group-hover:text-accent">Validation — analytical vs simulated</span>
      </Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-panel-border bg-panel-strong p-2">
      <div className="text-[10px] uppercase tracking-wider text-ink-dim">{label}</div>
      <div className="mono text-sm text-ink">{value}</div>
    </div>
  );
}
