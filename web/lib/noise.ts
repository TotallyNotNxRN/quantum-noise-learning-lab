// Port of `quantum_noise_lab/noise.py` to TypeScript.
//
// Conventions (locked, identical to the Python reference):
//
//   - Amplitude damping (Nielsen & Chuang 8.3.5):
//       E0 = [[1, 0], [0, sqrt(1 - gamma)]]
//       E1 = [[0, sqrt(gamma)], [0, 0]]
//   - Phase damping (random-Z form, this project's convention):
//       E0 = sqrt(1 - lambda/2) * I
//       E1 = sqrt(lambda/2)     * Z
//       Result: off-diagonals of rho are scaled by (1 - lambda).
//   - Depolarizing (Nielsen & Chuang 8.3.4):
//       D(rho) = (1 - p) rho + p I/2
//       E0 = sqrt(1 - 3p/4) I
//       E1 = sqrt(p/4)     X
//       E2 = sqrt(p/4)     Y
//       E3 = sqrt(p/4)     Z

import { type Complex, c, cAdd, cZero } from "./complex";
import {
  type Mat,
  asymmetryNorm,
  cloneMat,
  conjTranspose,
  frobeniusNorm,
  identity,
  isSquare,
  matAdd,
  matIsFinite,
  matMul,
  matRows,
  matScale,
  symmetrize,
  trace,
  zerosMat,
} from "./matrix";
import { eigvalsh2 } from "./matrix";

export const ASYMMETRY_TOL = 1e-8;
export const VALIDITY_TOL = 1e-10;
export const KRAUS_COMPLETENESS_TOL = 1e-10;

function checkUnitParam(name: string, value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${name} must be in [0, 1], got ${value}`);
  }
  return value;
}

export function amplitudeDampingKraus(gamma: number): Mat[] {
  const g = checkUnitParam("gamma", gamma);
  const s = Math.sqrt(1 - g);
  const r = Math.sqrt(g);
  const e0: Mat = [
    [c(1, 0), c(0, 0)],
    [c(0, 0), c(s, 0)],
  ];
  const e1: Mat = [
    [c(0, 0), c(r, 0)],
    [c(0, 0), c(0, 0)],
  ];
  return [e0, e1];
}

export function phaseDampingKraus(lambdaParam: number): Mat[] {
  const lam = checkUnitParam("lambda", lambdaParam);
  const a = Math.sqrt(1 - lam / 2);
  const b = Math.sqrt(lam / 2);
  const e0: Mat = [
    [c(a, 0), c(0, 0)],
    [c(0, 0), c(a, 0)],
  ];
  // Z = diag(1, -1) → sqrt(lam/2) * Z
  const e1: Mat = [
    [c(b, 0), c(0, 0)],
    [c(0, 0), c(-b, 0)],
  ];
  return [e0, e1];
}

export function depolarizingKraus(p: number): Mat[] {
  const pp = checkUnitParam("p", p);
  const a = Math.sqrt(Math.max(0, 1 - (3 * pp) / 4));
  const b = Math.sqrt(pp / 4);
  const I: Mat = [
    [c(a, 0), c(0, 0)],
    [c(0, 0), c(a, 0)],
  ];
  const X: Mat = [
    [c(0, 0), c(b, 0)],
    [c(b, 0), c(0, 0)],
  ];
  const Y: Mat = [
    [c(0, 0), c(0, -b)],
    [c(0, b), c(0, 0)],
  ];
  const Z: Mat = [
    [c(b, 0), c(0, 0)],
    [c(0, 0), c(-b, 0)],
  ];
  return [I, X, Y, Z];
}

export function krausCompletenessResidual(kraus: Mat[]): number {
  if (!Array.isArray(kraus) || kraus.length === 0) {
    throw new Error("kraus_ops must be a non-empty list");
  }
  const first = kraus[0];
  if (!isSquare(first)) {
    throw new Error(`Kraus operator 0 must be square, got ${matRows(first)}x${first[0]?.length ?? 0}`);
  }
  const dim = matRows(first);
  let total = zerosMat(dim, dim);
  for (let i = 0; i < kraus.length; i++) {
    const k = kraus[i];
    if (matRows(k) !== dim || k[0].length !== dim) {
      throw new Error(`Kraus operator ${i} has shape ${matRows(k)}x${k[0]?.length ?? 0}, expected ${dim}x${dim}`);
    }
    if (!matIsFinite(k)) {
      throw new Error(`Kraus operator ${i} contains non-finite entries`);
    }
    total = matAdd(total, matMul(conjTranspose(k), k));
  }
  return frobeniusNorm(matSubFromIdentity(total));
}

function matSubFromIdentity(m: Mat): Mat {
  // Returns m - I_n. Helper to avoid importing matSub twice.
  const n = matRows(m);
  const out: Mat = [];
  for (let i = 0; i < n; i++) {
    const row: Complex[] = [];
    for (let j = 0; j < n; j++) {
      const e = m[i][j];
      row.push(i === j ? c(e.re - 1, e.im) : { re: e.re, im: e.im });
    }
    out.push(row);
  }
  return out;
}

export function applyKrausChannel(rho: Mat, kraus: Mat[]): Mat {
  if (!isSquare(rho)) {
    throw new Error(`rho must be a square matrix, got ${matRows(rho)}x${rho[0]?.length ?? 0}`);
  }
  if (!matIsFinite(rho)) {
    throw new Error("rho contains non-finite entries");
  }
  if (!Array.isArray(kraus) || kraus.length === 0) {
    throw new Error("kraus_ops must be a non-empty list");
  }
  const asym = asymmetryNorm(rho);
  if (asym > ASYMMETRY_TOL) {
    throw new Error(`rho is not Hermitian within tol=${ASYMMETRY_TOL}: ||rho - rho^H||_F = ${asym}`);
  }
  const rhoSym = symmetrize(rho);

  if (matRows(rhoSym) === 2) {
    const [eMin] = eigvalsh2(rhoSym);
    if (eMin < -VALIDITY_TOL) {
      throw new Error(`rho is not positive semidefinite within tol=${VALIDITY_TOL}: min eigenvalue = ${eMin}`);
    }
  }
  const tr = trace(rhoSym);
  if (Math.abs(tr.re - 1) > VALIDITY_TOL || Math.abs(tr.im) > VALIDITY_TOL) {
    throw new Error(`rho does not have trace 1 within tol=${VALIDITY_TOL}: trace = ${tr.re}${tr.im >= 0 ? "+" : ""}${tr.im}i`);
  }

  // Validate each Kraus op shape + finiteness, then collect coerced copies.
  const dim = matRows(rhoSym);
  const ops: Mat[] = [];
  for (let i = 0; i < kraus.length; i++) {
    const k = kraus[i];
    if (matRows(k) !== dim || k[0].length !== dim) {
      throw new Error(`Kraus operator ${i} has shape ${matRows(k)}x${k[0]?.length ?? 0}, expected ${dim}x${dim} to match rho`);
    }
    if (!matIsFinite(k)) {
      throw new Error(`Kraus operator ${i} contains non-finite entries`);
    }
    ops.push(k);
  }

  // Completeness gate.
  const residual = krausCompletenessResidual(ops);
  if (residual > KRAUS_COMPLETENESS_TOL) {
    throw new Error(`Kraus operator set is not trace-preserving within tol=${KRAUS_COMPLETENESS_TOL}: ||sum K^dag K - I||_F = ${residual}`);
  }

  // Apply.
  let out = zerosMat(dim, dim);
  for (const k of ops) {
    out = matAdd(out, matMul(matMul(k, rhoSym), conjTranspose(k)));
  }
  return out;
}
