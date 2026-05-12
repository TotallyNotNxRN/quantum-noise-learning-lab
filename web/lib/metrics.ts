// Port of `quantum_noise_lab/metrics.py` to TypeScript.
//
// Fidelity is the squared Uhlmann fidelity:
//   F(rho, sigma) = ( Tr sqrt( sqrt(rho) sigma sqrt(rho) ) )^2,  F ∈ [0, 1].
// For a pure reference |psi><psi| this reduces to <psi| rho |psi> — used as a
// fast path. Validity tolerance defaults to 1e-10, clip tolerance to 1e-9.

import { type Complex, cMul } from "./complex";
import {
  type Mat,
  type Vec,
  asymmetryNorm,
  conjTranspose,
  eigvalsh2,
  matMul,
  matRows,
  matSqrtPSD2,
  symmetrize,
  trace,
} from "./matrix";

export const DEFAULT_TOL = 1e-10;
export const PURE_EIGENVALUE_TOL = 1e-9;
export const CLIP_TOL = 1e-9;

function requireSquare(m: Mat, name = "rho"): void {
  if (m.length === 0 || m.length !== m[0]?.length) {
    throw new Error(`${name} must be a square 2-D matrix, got shape ${m.length}x${m[0]?.length ?? 0}`);
  }
}

function matIsFinite(m: Mat): boolean {
  for (const row of m) for (const e of row) if (!Number.isFinite(e.re) || !Number.isFinite(e.im)) return false;
  return true;
}

export function traceValue(rho: Mat): Complex {
  requireSquare(rho);
  return trace(rho);
}

export function isHermitian(rho: Mat, atol = DEFAULT_TOL): boolean {
  requireSquare(rho);
  return asymmetryNorm(rho) <= atol;
}

export function eigenvalues(rho: Mat): number[] {
  requireSquare(rho);
  // For 2x2 we have the closed form; that's all the lab needs.
  if (matRows(rho) === 2) {
    const [a, b] = eigvalsh2(rho);
    return [a, b];
  }
  throw new Error(`eigenvalues currently only supports 2x2 Hermitian matrices, got ${matRows(rho)}x${rho[0]?.length}`);
}

export function isPositiveSemidefinite(rho: Mat, atol = DEFAULT_TOL): boolean {
  const eigs = eigenvalues(rho);
  let min = Infinity;
  for (const e of eigs) if (e < min) min = e;
  return min >= -atol;
}

export function isValidDensityMatrix(rho: Mat, atol = DEFAULT_TOL): boolean {
  if (!Array.isArray(rho) || rho.length === 0 || rho.length !== rho[0]?.length) return false;
  if (!matIsFinite(rho)) return false;
  if (!isHermitian(rho, atol)) return false;
  if (!isPositiveSemidefinite(rho, atol)) return false;
  const tr = trace(rho);
  if (Math.abs(tr.re - 1) > atol) return false;
  if (Math.abs(tr.im) > atol) return false;
  return true;
}

export function purity(rho: Mat): number {
  requireSquare(rho);
  const sym = symmetrize(rho);
  const prod = matMul(sym, sym);
  let acc = 0;
  for (let i = 0; i < prod.length; i++) acc += prod[i][i].re;
  return acc;
}

function safeClipUnit(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} is non-finite: ${value}`);
  if (value < -CLIP_TOL || value > 1 + CLIP_TOL) {
    throw new Error(`${label} = ${value} lies outside [0, 1] beyond tol=${CLIP_TOL}; check that inputs are valid density matrices`);
  }
  return Math.min(1, Math.max(0, value));
}

function isVecLike(x: unknown): x is Vec {
  return Array.isArray(x) && x.length > 0 && typeof (x[0] as Complex)?.re === "number" && !Array.isArray(x[0]);
}

export function fidelity(rho: Mat, reference: Mat | Vec): number {
  requireSquare(rho);
  if (!matIsFinite(rho)) throw new Error("rho contains non-finite entries");
  const rhoSym = symmetrize(rho);

  // rho validation: Hermitian (already by symmetrize) + PSD + trace 1.
  if (asymmetryNorm(rho) > 1e-8) {
    throw new Error(`rho is not Hermitian: ||rho - rho^H||_F = ${asymmetryNorm(rho)}`);
  }
  const eigsRho = eigenvalues(rhoSym);
  if (Math.min(...eigsRho) < -DEFAULT_TOL) {
    throw new Error(`rho is not positive semidefinite within tol=${DEFAULT_TOL}: min eigenvalue = ${Math.min(...eigsRho)}`);
  }
  const trRho = trace(rhoSym);
  if (Math.abs(trRho.re - 1) > DEFAULT_TOL || Math.abs(trRho.im) > DEFAULT_TOL) {
    throw new Error(`rho does not have trace 1 within tol=${DEFAULT_TOL}: trace = ${trRho.re}+${trRho.im}i`);
  }

  // --- Pure ket reference --------------------------------------------------
  if (isVecLike(reference)) {
    const ket = reference as Vec;
    for (const z of ket) if (!Number.isFinite(z.re) || !Number.isFinite(z.im)) {
      throw new Error("reference contains non-finite entries");
    }
    if (ket.length !== matRows(rhoSym)) {
      throw new Error(`shape mismatch: rho is ${matRows(rhoSym)}x${matRows(rhoSym)}, reference ket is ${ket.length}`);
    }
    let normSq = 0;
    for (const z of ket) normSq += z.re * z.re + z.im * z.im;
    const norm = Math.sqrt(normSq);
    if (Math.abs(norm - 1) > DEFAULT_TOL) {
      throw new Error(`reference ket is not normalized within tol=${DEFAULT_TOL}: ||ref|| = ${norm}`);
    }
    // F = <psi| rho |psi>  (real)
    let acc = 0;
    const n = ket.length;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        // psi_i^* * rho_{ij} * psi_j → real part of the sum
        const a = { re: ket[i].re, im: -ket[i].im }; // conjugate
        const b = rhoSym[i][j];
        const c1 = cMul(a, b);
        const d = cMul(c1, ket[j]);
        acc += d.re;
      }
    }
    return safeClipUnit(acc, "fidelity (pure ket)");
  }

  // --- Matrix reference ----------------------------------------------------
  const refMat = reference as Mat;
  if (!matIsFinite(refMat)) throw new Error("reference contains non-finite entries");
  if (refMat.length !== rhoSym.length || refMat[0].length !== rhoSym[0].length) {
    throw new Error(`shape mismatch: rho is ${matRows(rhoSym)}x${matRows(rhoSym)}, reference matrix is ${matRows(refMat)}x${refMat[0]?.length ?? 0}`);
  }
  if (asymmetryNorm(refMat) > 1e-8) {
    throw new Error(`reference matrix is not Hermitian: ||ref - ref^H||_F = ${asymmetryNorm(refMat)}`);
  }
  const refSym = symmetrize(refMat);
  const refEigs = eigenvalues(refSym);
  if (Math.min(...refEigs) < -DEFAULT_TOL) {
    throw new Error(`reference matrix is not positive semidefinite within tol=${DEFAULT_TOL}: min eigenvalue = ${Math.min(...refEigs)}`);
  }
  const trRef = trace(refSym);
  if (Math.abs(trRef.re - 1) > DEFAULT_TOL || Math.abs(trRef.im) > DEFAULT_TOL) {
    throw new Error(`reference matrix trace = ${trRef.re}+${trRef.im}i is not 1 within tol=${DEFAULT_TOL}`);
  }

  // Pure reference fast path: F = Tr(rho ref).
  const isPure = Math.max(...refEigs) > 1 - PURE_EIGENVALUE_TOL &&
    refEigs.filter((e) => e > PURE_EIGENVALUE_TOL).length === 1;
  if (isPure) {
    const prod = matMul(rhoSym, refSym);
    let acc = 0;
    for (let i = 0; i < prod.length; i++) acc += prod[i][i].re;
    return safeClipUnit(acc, "fidelity (pure rho reference)");
  }

  // General Uhlmann path. 2x2 only — the lab does not use larger matrices.
  if (matRows(rhoSym) !== 2) {
    throw new Error(`general Uhlmann fidelity currently supports 2x2 only, got ${matRows(rhoSym)}x${matRows(rhoSym)}`);
  }
  const sqrtRho = matSqrtPSD2(rhoSym);
  const inner = matMul(matMul(sqrtRho, refSym), sqrtRho);
  const innerSym = symmetrize(inner);
  const innerEigs = eigenvalues(innerSym).map((e) => Math.max(0, e));
  const sumSqrt = innerEigs.reduce((s, e) => s + Math.sqrt(e), 0);
  return safeClipUnit(sumSqrt * sumSqrt, "fidelity (general)");
}
