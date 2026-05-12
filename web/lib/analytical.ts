// Port of `quantum_noise_lab/analytical.py` to TypeScript.
//
// Closed-form results for the |+> initial state under amplitude and phase
// damping. Used by the Validation Lab to prove the simulator matches
// hand-derived formulas.

import { c } from "./complex";
import { type Mat } from "./matrix";

function checkUnit(name: string, value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${name} must be in [0, 1], got ${value}`);
  }
  return value;
}

export function analyticalAmplitudeDensity(gamma: number): Mat {
  const g = checkUnit("gamma", gamma);
  const s = Math.sqrt(1 - g);
  return [
    [c((1 + g) / 2, 0), c(s / 2, 0)],
    [c(s / 2, 0), c((1 - g) / 2, 0)],
  ];
}

export function analyticalPhaseDensity(lambdaParam: number): Mat {
  const lam = checkUnit("lambda", lambdaParam);
  const off = (1 - lam) / 2;
  return [
    [c(0.5, 0), c(off, 0)],
    [c(off, 0), c(0.5, 0)],
  ];
}

export function analyticalAmplitudeFidelity(gamma: number): number {
  const g = checkUnit("gamma", gamma);
  return (1 + Math.sqrt(1 - g)) / 2;
}

export function analyticalPhaseFidelity(lambdaParam: number): number {
  const lam = checkUnit("lambda", lambdaParam);
  return 1 - lam / 2;
}
