"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";

import { BeginnerBox, TechnicalBox, ValidationPill } from "@/components/Callouts";
import { ProbabilityBar } from "@/components/Charts";
import { DensityMatrixHeatmap } from "@/components/DensityMatrixHeatmap";
import { Equation } from "@/components/Equation";
import { GlassPanel } from "@/components/GlassPanel";

import { eigenvalues, isHermitian, isPositiveSemidefinite, traceValue } from "@/lib/metrics";
import { customQubitState, densityMatrix, ketOne, ketZero, plusState } from "@/lib/states";

const BlochSphere = dynamic(() => import("@/components/BlochSphere").then((m) => m.BlochSphere), {
  ssr: false,
});

type Preset = "0" | "1" | "+" | "custom";

export default function FoundationsPage() {
  const [preset, setPreset] = useState<Preset>("+");
  const [theta, setTheta] = useState<number>(Math.PI / 2);
  const [phi, setPhi] = useState<number>(0);

  const psi = useMemo(() => {
    if (preset === "0") return ketZero();
    if (preset === "1") return ketOne();
    if (preset === "+") return plusState();
    return customQubitState(theta, phi);
  }, [preset, theta, phi]);

  const rho = useMemo(() => densityMatrix(psi), [psi]);
  const probs = [
    { name: "|0⟩", value: rho[0][0].re },
    { name: "|1⟩", value: rho[1][1].re },
  ];
  const tr = traceValue(rho).re;
  const eigs = eigenvalues(rho);
  const herm = isHermitian(rho);
  const psd = isPositiveSemidefinite(rho);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-dim">
          Module 01 — Foundations
        </p>
        <h1 className="font-serif text-3xl md:text-4xl">State vectors and density matrices</h1>
        <p className="max-w-3xl text-ink-dim">
          Pick a single-qubit state and inspect its state vector, measurement
          probabilities, and density matrix. The density matrix is the object
          the rest of the lab will deform with noise — building it carefully
          here is the whole point of this module.
        </p>
      </header>

      <GlassPanel className="p-5">
        <h2 className="mb-3 font-serif text-lg">Choose a state</h2>
        <div className="flex flex-wrap items-center gap-2">
          {(["0", "1", "+", "custom"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className={[
                "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                preset === p
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-panel-border text-ink-dim hover:border-accent hover:text-ink",
              ].join(" ")}
            >
              {p === "custom" ? "custom |ψ⟩" : `|${p}⟩`}
            </button>
          ))}
        </div>
        {preset === "custom" && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-ink-dim">
              <span>
                θ — polar angle <span className="font-mono text-ink">{theta.toFixed(2)}</span>
              </span>
              <input
                type="range"
                min={0}
                max={Math.PI}
                step={0.01}
                value={theta}
                onChange={(e) => setTheta(parseFloat(e.target.value))}
                className="qnl-slider"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-ink-dim">
              <span>
                φ — azimuthal angle <span className="font-mono text-ink">{phi.toFixed(2)}</span>
              </span>
              <input
                type="range"
                min={0}
                max={2 * Math.PI}
                step={0.01}
                value={phi}
                onChange={(e) => setPhi(parseFloat(e.target.value))}
                className="qnl-slider"
              />
            </label>
          </div>
        )}
      </GlassPanel>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassPanel className="space-y-4 p-6">
          <h2 className="font-serif text-xl">|ψ⟩ — state vector</h2>
          <Equation latex="|\psi\rangle = \alpha\,|0\rangle + \beta\,|1\rangle,\quad \alpha = \cos(\theta/2),\;\beta = e^{i\varphi}\sin(\theta/2)" />
          <pre className="mono whitespace-pre rounded-lg bg-bg-deep/60 p-3 text-xs text-ink">
{`α = ${fmt(psi[0])}
β = ${fmt(psi[1])}`}
          </pre>
          <BeginnerBox>
            A qubit's state is a vector of two complex numbers, the amplitudes
            α and β. Their squared magnitudes give the probabilities of
            measuring 0 or 1, and they always sum to 1 because the qubit has
            to come out as <em>something</em>.
          </BeginnerBox>
          <TechnicalBox>
            For a pure state |ψ⟩ the density matrix is the outer product:
            <div className="my-2">
              <Equation latex="\rho = |\psi\rangle\langle\psi| = \begin{pmatrix} |\alpha|^2 & \alpha\beta^* \\ \alpha^*\beta & |\beta|^2 \end{pmatrix}" />
            </div>
            Diagonal entries are populations (measurement probabilities);
            off-diagonal entries are <em>coherences</em> — the quantum-phase
            information that noise will destroy first.
          </TechnicalBox>
        </GlassPanel>

        <div className="space-y-6">
          <GlassPanel className="space-y-3 p-4" tilt={false}>
            <h2 className="font-serif text-xl">Bloch sphere</h2>
            <BlochSphere rho={rho} caption="Orange vector: r = (Tr ρX, Tr ρY, Tr ρZ). Pure states sit on the surface." />
          </GlassPanel>
          <GlassPanel className="p-4" tilt={false}>
            <h2 className="font-serif text-xl">Density matrix ρ</h2>
            <DensityMatrixHeatmap rho={rho} />
          </GlassPanel>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassPanel className="p-4" tilt={false}>
          <h2 className="mb-3 font-serif text-xl">Measurement probabilities</h2>
          <ProbabilityBar probs={probs} />
        </GlassPanel>
        <GlassPanel className="space-y-3 p-6">
          <h2 className="font-serif text-xl">Validation</h2>
          <ValidationPill hermitian={herm} psd={psd} trace={tr} atol={1e-10} />
          <p className="text-xs text-ink-dim">
            Eigenvalues: <span className="font-mono text-ink">[{eigs[0].toFixed(4)}, {eigs[1].toFixed(4)}]</span>
          </p>
          <h3 className="pt-2 font-serif text-sm text-ink-dim">Why density matrices?</h3>
          <p className="text-sm text-ink-dim">
            A pure state can be written as a single ket |ψ⟩. The instant noise
            enters the picture, the system is no longer in one definite state
            — it is a statistical mixture. There is no ket that represents
            "70 % |0⟩ and 30 % |1⟩"; you need a density matrix ρ for that.
          </p>
        </GlassPanel>
      </section>

      <NextLink href="/noise" label="Noise — watch ρ deform under three Kraus channels" />
    </div>
  );
}

function fmt(z: { re: number; im: number }): string {
  if (Math.abs(z.im) < 1e-12) return `${z.re.toFixed(4)}`;
  const sign = z.im >= 0 ? "+" : "−";
  return `${z.re.toFixed(4)} ${sign} ${Math.abs(z.im).toFixed(4)}i`;
}

function NextLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 rounded-glass border border-panel-border bg-panel px-4 py-2.5 text-sm font-medium text-ink hover:border-accent hover:text-accent"
    >
      Next →
      <span className="text-ink-dim group-hover:text-accent">{label}</span>
    </Link>
  );
}
