// Port of `quantum_noise_lab/states.py` to TypeScript.
//
// All public functions validate their inputs and throw `Error` (mapped from
// Python's `ValueError`) with a clear message. Tests cover the failure paths
// to keep parity with pytest.

import { type Complex, c, cZero } from "./complex";
import { type Mat, type Vec, kron, matRows, outer } from "./matrix";

export const NORMALIZATION_TOL = 1e-10;

export function basisState(index: number, dimension = 2): Vec {
  if (!Number.isInteger(dimension) || dimension < 1) {
    throw new Error(`dimension must be an integer >= 1, got ${dimension}`);
  }
  if (!Number.isInteger(index) || index < 0 || index >= dimension) {
    throw new Error(`basis index ${index} out of range [0, ${dimension})`);
  }
  const out: Vec = [];
  for (let i = 0; i < dimension; i++) out.push(i === index ? c(1, 0) : cZero());
  return out;
}

export const ketZero = (): Vec => basisState(0, 2);
export const ketOne = (): Vec => basisState(1, 2);

export function plusState(): Vec {
  const s = 1 / Math.sqrt(2);
  return [c(s, 0), c(s, 0)];
}

export function customQubitState(theta: number, phi: number): Vec {
  if (!Number.isFinite(theta) || !Number.isFinite(phi)) {
    throw new Error(`theta and phi must be finite, got theta=${theta}, phi=${phi}`);
  }
  const half = theta / 2;
  const cosH = Math.cos(half);
  const sinH = Math.sin(half);
  return [
    c(cosH, 0),
    c(Math.cos(phi) * sinH, Math.sin(phi) * sinH),
  ];
}

export function densityMatrix(psi: Vec, atol = NORMALIZATION_TOL): Mat {
  if (!Array.isArray(psi) || psi.length === 0) {
    throw new Error("state vector must be a non-empty array");
  }
  for (const z of psi) {
    if (!Number.isFinite(z.re) || !Number.isFinite(z.im)) {
      throw new Error("state vector contains non-finite entries");
    }
  }
  let normSquared = 0;
  for (const z of psi) normSquared += z.re * z.re + z.im * z.im;
  const norm = Math.sqrt(normSquared);
  if (norm === 0) throw new Error("state vector is zero");
  if (Math.abs(norm - 1) > atol) {
    throw new Error(`state vector not normalized within tol=${atol}: ||psi|| = ${norm}`);
  }
  return outer(psi, psi);
}

/** Tensor (Kronecker) product mirroring numpy.kron for either vectors or
 *  matrices. Returns a flat Vec when ALL inputs are 1-D (matches the
 *  Python reference); returns a Mat otherwise. Throws on empty input. */
export function tensorProduct(...arrays: (Vec | Mat)[]): Vec | Mat {
  if (arrays.length === 0) throw new Error("tensorProduct requires at least one input");
  const isVec = (a: Vec | Mat): boolean =>
    Array.isArray(a) && a.length > 0 && !Array.isArray(a[0] as unknown);
  const allVec = arrays.every(isVec);
  const toMat = (a: Vec | Mat): Mat => {
    if (isVec(a)) {
      // Vec → 1×n row matrix so kron produces a row matrix (we collapse later).
      return [(a as Vec).map((e) => ({ ...e }))];
    }
    return a as Mat;
  };
  let result = toMat(arrays[0]);
  for (let i = 1; i < arrays.length; i++) {
    result = kron(result, toMat(arrays[i]));
  }
  if (allVec) {
    // Result has shape 1×N; collapse to a flat Vec.
    return result[0].map((e) => ({ ...e }));
  }
  return result;
}
