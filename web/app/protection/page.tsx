"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { BeginnerBox, ConventionCallout, TechnicalBox } from "@/components/Callouts";
import { MetricCurve } from "@/components/Charts";
import { Equation } from "@/components/Equation";
import { GlassPanel } from "@/components/GlassPanel";

import { repetitionSuccessProtected, repetitionSuccessUnprotected } from "@/lib/qec";
import { linspace } from "@/lib/sweeps";

export default function ProtectionPage() {
  const [p, setP] = useState(0.2);
  const grid = useMemo(() => linspace(0, 1, 101), []);
  const unprot = useMemo(() => grid.map((x) => repetitionSuccessUnprotected(x)), [grid]);
  const prot = useMemo(() => grid.map((x) => repetitionSuccessProtected(x)), [grid]);
  const uNow = repetitionSuccessUnprotected(p);
  const pNow = repetitionSuccessProtected(p);
  const advantage = pNow - uNow;
  const better = advantage > 0;

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-dim">
          Module 05 — Protection
        </p>
        <h1 className="font-serif text-3xl md:text-4xl">Simple error-correction intuition</h1>
        <p className="max-w-3xl text-ink-dim">
          A <em>classical-style</em> 3-repetition code for bit-flip errors.
          Encode 0 as 000, 1 as 111; if at most one of the three bits flips,
          majority vote recovers the correct value. This is not full quantum
          error correction — see the panel below for what it does not cover.
        </p>
      </header>

      <GlassPanel className="space-y-4 p-5">
        <label className="block">
          <span className="text-sm text-ink-dim">
            <span className="font-mono text-ink">p</span> — per-bit flip probability ={" "}
            <span className="font-mono text-ink">{p.toFixed(3)}</span>
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.005}
            value={p}
            onChange={(e) => setP(parseFloat(e.target.value))}
            className="qnl-slider mt-1 w-full"
          />
        </label>
      </GlassPanel>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassPanel className="space-y-3 p-6">
          <h2 className="font-serif text-xl">Formulas</h2>
          <Equation latex="P_{\text{unprot}}(p) = 1 - p,\quad P_{\text{prot}}(p) = (1-p)^3 + 3p(1-p)^2" />
          <BeginnerBox>
            Encode the value 0 as <code className="mono">000</code> and 1 as{" "}
            <code className="mono">111</code>. When noise flips each bit
            independently with probability p, the encoding still decodes
            correctly as long as at most one of the three bits flipped —
            the majority of two unflipped bits wins the vote.
          </BeginnerBox>
          <TechnicalBox>
            Below p = 1/2 the protected curve dominates the unprotected one:
            redundancy helps. Above p = 1/2 the noise is so heavy that
            majority vote is actively <em>worse</em> than not encoding at
            all (you keep majority-voting yourself into the wrong answer).
          </TechnicalBox>
          <ConventionCallout>
            Bit-flip channel only. Phase errors (Z) are <em>not</em> addressed
            here. Real quantum codes (Shor, Steane, surface) handle both X
            and Z errors and never copy unknown quantum states — they
            entangle them with ancillas instead.
          </ConventionCallout>
        </GlassPanel>

        <div className="space-y-6">
          <GlassPanel className="p-3" tilt={false}>
            <MetricCurve
              title="Success probability vs bit-flip rate"
              xLabel="p"
              yLabel="P(success)"
              vline={p}
              yDomain={[0, 1.05]}
              series={[
                { name: "Unprotected (1 − p)", values: grid.map((x, i) => ({ x, y: unprot[i] })), color: "primary" },
                { name: "3-rep protected", values: grid.map((x, i) => ({ x, y: prot[i] })), color: "good" },
              ]}
            />
          </GlassPanel>
          <GlassPanel className="p-5">
            <h3 className="mb-3 font-serif text-sm">At p = {p.toFixed(3)}</h3>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <Stat label="Unprotected" value={uNow.toFixed(4)} />
              <Stat label="Protected" value={pNow.toFixed(4)} />
              <Stat
                label="Advantage"
                value={`${better ? "+" : ""}${advantage.toFixed(4)}`}
                accent={better ? "good" : "bad"}
              />
            </div>
            <p className="mt-3 text-xs text-ink-dim">
              {better
                ? "Protection helps: majority vote across three copies beats one raw bit."
                : "Protection hurts: the noise rate is too high — majority vote concurs with the noise."}
            </p>
          </GlassPanel>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <GlassPanel className="p-6">
          <h3 className="font-serif text-xl">What this is</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-dim">
            <li>A classical repetition code treating the qubit as a single bit.</li>
            <li>An intuition pump for why physical redundancy + decoding helps when channel noise is bounded.</li>
            <li>A bridge into logical encoding and the idea of a code distance.</li>
          </ul>
        </GlassPanel>
        <GlassPanel className="p-6">
          <h3 className="font-serif text-xl">What this <em className="italic">isn't</em></h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-dim">
            <li>Not full quantum error correction (no phase error handling).</li>
            <li>Not Shor / Steane / surface codes — those use entanglement, not copies.</li>
            <li>Not fault-tolerant: gates between encoded qubits introduce their own error model.</li>
            <li>Not a no-cloning violation: classical bits can be copied; arbitrary quantum states cannot.</li>
          </ul>
        </GlassPanel>
      </section>

      <Link
        href="/foundations"
        className="group inline-flex items-center gap-2 rounded-glass border border-panel-border bg-panel px-4 py-2.5 text-sm font-medium text-ink hover:border-accent hover:text-accent"
      >
        ↻ Restart at Foundations
      </Link>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "good" | "bad" }) {
  const color = accent === "good" ? "text-good" : accent === "bad" ? "text-bad" : "text-ink";
  return (
    <div className="rounded-md border border-panel-border bg-panel-strong p-2">
      <div className="text-[10px] uppercase tracking-wider text-ink-dim">{label}</div>
      <div className={`mono text-sm ${color}`}>{value}</div>
    </div>
  );
}
