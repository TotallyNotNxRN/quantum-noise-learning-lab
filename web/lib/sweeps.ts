// Port of `quantum_noise_lab/sweeps.py` to TypeScript.

import { applyKrausChannel } from "./noise";
import { type Mat, type Vec } from "./matrix";

export type KrausFn = (param: number) => Mat[];
export type MetricFn = (rho: Mat, reference: Mat | Vec) => number;

export function sweepNoise(kraus: KrausFn, rhoInitial: Mat, grid: number[]): Mat[] {
  if (!Array.isArray(grid)) throw new Error("grid must be an array");
  return grid.map((p) => applyKrausChannel(rhoInitial, kraus(p)));
}

export function sweepMetric(
  kraus: KrausFn,
  rhoInitial: Mat,
  reference: Mat | Vec,
  metric: MetricFn,
  grid: number[],
): number[] {
  if (!Array.isArray(grid)) throw new Error("grid must be an array");
  return grid.map((p) => metric(applyKrausChannel(rhoInitial, kraus(p)), reference));
}

export function linspace(start: number, stop: number, n: number): number[] {
  if (!Number.isInteger(n) || n < 2) throw new Error("linspace requires n >= 2");
  const out: number[] = new Array(n);
  const step = (stop - start) / (n - 1);
  for (let i = 0; i < n; i++) out[i] = start + step * i;
  return out;
}
