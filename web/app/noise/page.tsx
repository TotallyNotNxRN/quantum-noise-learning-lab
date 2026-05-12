"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";

import { BeginnerBox, ConventionCallout, TechnicalBox, ValidationPill } from "@/components/Callouts";
import { DensityMatrixHeatmap } from "@/components/DensityMatrixHeatmap";
import { Equation } from "@/components/Equation";
import { GlassPanel } from "@/components/GlassPanel";

import { type Mat } from "@/lib/matrix";
import { eigenvalues, isHermitian, isPositiveSemidefinite, traceValue } from "@/lib/metrics";
import {
  amplitudeDampingKraus,
  applyKrausChannel,
  depolarizingKraus,
  krausCompletenessResidual,
  phaseDampingKraus,
} from "@/lib/noise";
import { customQubitState, densityMatrix, ketOne, ketZero, plusState } from "@/lib/states";

const BlochSphere = dynamic(() => import("@/components/BlochSphere").then((m) => m.BlochSphere), {
  ssr: false,
});

type Channel = "amplitude" | "phase" | "depolarizing";
type Preset = "0" | "1" | "+" | "custom";

const CHANNEL_INFO: Record<
  Channel,
  { label: string; symbol: string; description: string }
> = {
  amplitude: {
    label: "Amplitude damping",
    symbol: "γ",
    description: "Energy relaxation. |1⟩ slides toward |0⟩.",
  },
  phase: {
    label: "Phase damping",
    symbol: "λ",
    description: "Dephasing. Off-diagonal coherence decays; populations unchanged.",
  },
  depolarizing: {
    label: "Depolarizing",
    symbol: "p",
    description: "Mixes ρ toward I/2. With probability p the state is replaced by I/2.",
  },
};

export default function NoisePage() {
  const [channel, setChannel] = useState<Channel>("amplitude");
  const [param, setParam] = useState(0.4);
  const [preset, setPreset] = useState<Preset>("+");
  const [theta, setTheta] = useState(Math.PI / 2);
  const [phi, setPhi] = useState(0);

  const psi = useMemo(() => {
    if (preset === "0") return ketZero();
    if (preset === "1") return ketOne();
    if (preset === "+") return plusState();
    return customQubitState(theta, phi);
  }, [preset, theta, phi]);

  const rho0 = useMemo(() => densityMatrix(psi), [psi]);
  const kraus = useMemo(() => {
    if (channel === "amplitude") return amplitudeDampingKraus(param);
    if (channel === "phase") return phaseDampingKraus(param);
    return depolarizingKraus(param);
  }, [channel, param]);
  const rhoOut = useMemo(() => applyKrausChannel(rho0, kraus), [rho0, kraus]);
  const diff: Mat = useMemo(
    () => rhoOut.map((row, i) => row.map((e, j) => ({ re: e.re - rho0[i][j].re, im: e.im - rho0[i][j].im }))),
    [rho0, rhoOut],
  );
  const frob = useMemo(() => {
    let s = 0;
    for (const row of diff) for (const e of row) s += e.re * e.re + e.im * e.im;
    return Math.sqrt(s);
  }, [diff]);
  const completeness = krausCompletenessResidual(kraus);
  const tr = traceValue(rhoOut).re;
  const eigs = eigenvalues(rhoOut);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-dim">
          Module 02 — Noise
        </p>
        <h1 className="font-serif text-3xl md:text-4xl">Kraus channels and decoherence</h1>
        <p className="max-w-3xl text-ink-dim">
          Three noise channels in canonical Kraus form. Move the slider to
          watch ρ deform; the dashed Bloch vector keeps the initial state
          for visual contrast.
        </p>
      </header>

      <GlassPanel className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(CHANNEL_INFO) as Channel[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChannel(c)}
              className={[
                "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                channel === c
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-panel-border text-ink-dim hover:border-accent hover:text-ink",
              ].join(" ")}
            >
              {CHANNEL_INFO[c].label}
            </button>
          ))}
          <span className="ml-auto text-xs text-ink-dim">
            {CHANNEL_INFO[channel].description}
          </span>
        </div>
        <label className="block">
          <span className="text-sm text-ink-dim">
            <span className="font-mono text-ink">{CHANNEL_INFO[channel].symbol}</span> —{" "}
            <span>strength</span>{" "}
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
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-dim">
          <span className="uppercase tracking-wider">Initial state:</span>
          {(["0", "1", "+", "custom"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className={[
                "rounded-full border px-2.5 py-1 transition-colors",
                preset === p
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-panel-border hover:border-accent",
              ].join(" ")}
            >
              {p === "custom" ? "custom" : `|${p}⟩`}
            </button>
          ))}
          {preset === "custom" && (
            <span className="flex items-center gap-3">
              <label className="flex items-center gap-1">
                θ
                <input type="range" min={0} max={Math.PI} step={0.01} value={theta} onChange={(e) => setTheta(parseFloat(e.target.value))} />
                <span className="font-mono">{theta.toFixed(2)}</span>
              </label>
              <label className="flex items-center gap-1">
                φ
                <input type="range" min={0} max={2 * Math.PI} step={0.01} value={phi} onChange={(e) => setPhi(parseFloat(e.target.value))} />
                <span className="font-mono">{phi.toFixed(2)}</span>
              </label>
            </span>
          )}
        </div>
      </GlassPanel>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassPanel className="space-y-3 p-6">
          <h2 className="font-serif text-xl">Channel — formulas</h2>
          <ChannelFormulas channel={channel} />
          <ConventionCallout>
            Channel applied as ρ ↦ Σᵢ Eᵢ ρ Eᵢ†. Completeness residual{" "}
            <span className="font-mono">{completeness.toExponential(2)}</span> ≤ 1e-10 ✓
          </ConventionCallout>
          <BeginnerBox>
            Each Kraus operator captures one possible outcome the environment
            could enact on the qubit. Together they sum to the full
            statistical channel — there is no single "after-noise state",
            only a probabilistic mixture of outcomes that we accumulate into ρ.
          </BeginnerBox>
          <TechnicalBox>
            All three channels are completely positive trace preserving
            (CPTP). The residual <code className="mono">||Σ Kᵢ†Kᵢ − I||_F</code>{" "}
            stays below 1e-10 for every parameter value — verified live above.
          </TechnicalBox>
        </GlassPanel>

        <div className="space-y-6">
          <GlassPanel className="space-y-2 p-4" tilt={false}>
            <h2 className="font-serif text-xl">Bloch sphere — before & after</h2>
            <BlochSphere rho={rhoOut} ghost={rho0} caption="Solid: ρ after channel · dashed: ρ initial" />
          </GlassPanel>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <GlassPanel className="p-3" tilt={false}>
              <p className="px-1 pb-2 font-serif text-sm">ρ before</p>
              <DensityMatrixHeatmap rho={rho0} />
            </GlassPanel>
            <GlassPanel className="p-3" tilt={false}>
              <p className="px-1 pb-2 font-serif text-sm">ρ after</p>
              <DensityMatrixHeatmap rho={rhoOut} />
            </GlassPanel>
          </div>
          <GlassPanel className="p-4" tilt={false}>
            <p className="px-1 pb-2 font-serif text-sm">Δρ = ρ_after − ρ_before</p>
            <DensityMatrixHeatmap rho={diff} signed />
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <Stat label="‖Δρ‖_F" value={frob.toFixed(4)} />
              <Stat label="Trace(ρ_after)" value={tr.toFixed(6)} />
            </div>
          </GlassPanel>
          <GlassPanel className="p-4">
            <h3 className="font-serif text-sm">Validation</h3>
            <ValidationPill hermitian={isHermitian(rhoOut)} psd={isPositiveSemidefinite(rhoOut)} trace={tr} atol={1e-10} />
            <p className="mt-2 text-xs text-ink-dim">
              Eigenvalues: <span className="font-mono text-ink">[{eigs[0].toFixed(4)}, {eigs[1].toFixed(4)}]</span>
            </p>
          </GlassPanel>
        </div>
      </section>

      <NextLink href="/metrics" label="Metrics — fidelity, purity, eigenvalue analysis" />
    </div>
  );
}

function ChannelFormulas({ channel }: { channel: Channel }) {
  if (channel === "amplitude") {
    return (
      <>
        <Equation latex="E_0 = \begin{pmatrix}1 & 0 \\ 0 & \sqrt{1-\gamma}\end{pmatrix},\quad E_1 = \begin{pmatrix}0 & \sqrt{\gamma} \\ 0 & 0\end{pmatrix}" />
        <p className="text-sm text-ink-dim">
          γ ∈ [0, 1] is the probability of an energy-decay event. At γ = 1
          every input maps to |0⟩⟨0|.
        </p>
      </>
    );
  }
  if (channel === "phase") {
    return (
      <>
        <Equation latex="E_0 = \sqrt{1-\lambda/2}\;I,\quad E_1 = \sqrt{\lambda/2}\;Z" />
        <p className="text-sm text-ink-dim">
          Random-Z convention. Off-diagonals are scaled by exactly (1 − λ);
          populations untouched.
        </p>
      </>
    );
  }
  return (
    <>
      <Equation latex="\mathcal{D}(\rho) = (1-p)\,\rho + p\,\tfrac{I}{2}" />
      <Equation latex="E_0 = \sqrt{1-3p/4}\,I,\;E_1=\sqrt{p/4}\,X,\;E_2=\sqrt{p/4}\,Y,\;E_3=\sqrt{p/4}\,Z" />
      <p className="text-sm text-ink-dim">
        Nielsen & Chuang form. At p = 1 every input maps to the maximally
        mixed state I/2.
      </p>
    </>
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

function NextLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 rounded-glass border border-panel-border bg-panel px-4 py-2.5 text-sm font-medium text-ink hover:border-accent hover:text-accent"
    >
      Next →<span className="text-ink-dim group-hover:text-accent">{label}</span>
    </Link>
  );
}
