// Small complex-matrix operations used by the engine. Matrices are stored
// row-major as Complex[][]. All operations are pure and allocate new arrays.

import {
  type Complex,
  cAdd,
  cConj,
  cMul,
  cScale,
  cSub,
  cZero,
  cIsFinite,
} from "./complex";

export type Vec = Complex[];
export type Mat = Complex[][];

export const matRows = (m: Mat): number => m.length;
export const matCols = (m: Mat): number => (m.length === 0 ? 0 : m[0].length);

export const isSquare = (m: Mat): boolean => matRows(m) === matCols(m);

export const matIsFinite = (m: Mat): boolean => {
  for (const row of m) for (const e of row) if (!cIsFinite(e)) return false;
  return true;
};

export const cloneMat = (m: Mat): Mat => m.map((row) => row.map((e) => ({ ...e })));

export const identity = (n: number): Mat => {
  const out: Mat = [];
  for (let i = 0; i < n; i++) {
    const row: Complex[] = [];
    for (let j = 0; j < n; j++) row.push(i === j ? { re: 1, im: 0 } : cZero());
    out.push(row);
  }
  return out;
};

export const zerosMat = (rows: number, cols: number): Mat => {
  const out: Mat = [];
  for (let i = 0; i < rows; i++) {
    const row: Complex[] = [];
    for (let j = 0; j < cols; j++) row.push(cZero());
    out.push(row);
  }
  return out;
};

export const matAdd = (a: Mat, b: Mat): Mat => {
  if (matRows(a) !== matRows(b) || matCols(a) !== matCols(b)) {
    throw new Error(`matAdd shape mismatch: ${matRows(a)}x${matCols(a)} vs ${matRows(b)}x${matCols(b)}`);
  }
  const out: Mat = [];
  for (let i = 0; i < a.length; i++) {
    const row: Complex[] = [];
    for (let j = 0; j < a[i].length; j++) row.push(cAdd(a[i][j], b[i][j]));
    out.push(row);
  }
  return out;
};

export const matSub = (a: Mat, b: Mat): Mat => {
  if (matRows(a) !== matRows(b) || matCols(a) !== matCols(b)) {
    throw new Error(`matSub shape mismatch`);
  }
  const out: Mat = [];
  for (let i = 0; i < a.length; i++) {
    const row: Complex[] = [];
    for (let j = 0; j < a[i].length; j++) row.push(cSub(a[i][j], b[i][j]));
    out.push(row);
  }
  return out;
};

export const matScale = (m: Mat, s: number): Mat =>
  m.map((row) => row.map((e) => cScale(e, s)));

export const matMul = (a: Mat, b: Mat): Mat => {
  const aCols = matCols(a);
  const bRows = matRows(b);
  if (aCols !== bRows) {
    throw new Error(`matMul shape mismatch: ${matRows(a)}x${aCols} * ${bRows}x${matCols(b)}`);
  }
  const out: Mat = [];
  for (let i = 0; i < matRows(a); i++) {
    const row: Complex[] = [];
    for (let j = 0; j < matCols(b); j++) {
      let acc = cZero();
      for (let k = 0; k < aCols; k++) acc = cAdd(acc, cMul(a[i][k], b[k][j]));
      row.push(acc);
    }
    out.push(row);
  }
  return out;
};

export const conjTranspose = (m: Mat): Mat => {
  const r = matRows(m);
  const c = matCols(m);
  const out: Mat = [];
  for (let i = 0; i < c; i++) {
    const row: Complex[] = [];
    for (let j = 0; j < r; j++) row.push(cConj(m[j][i]));
    out.push(row);
  }
  return out;
};

export const trace = (m: Mat): Complex => {
  if (!isSquare(m)) throw new Error("trace requires a square matrix");
  let acc = cZero();
  for (let i = 0; i < m.length; i++) acc = cAdd(acc, m[i][i]);
  return acc;
};

export const frobeniusNorm = (m: Mat): number => {
  let s = 0;
  for (const row of m) for (const e of row) s += e.re * e.re + e.im * e.im;
  return Math.sqrt(s);
};

export const asymmetryNorm = (m: Mat): number => {
  // ||m - m^H||_F
  const adj = conjTranspose(m);
  return frobeniusNorm(matSub(m, adj));
};

export const symmetrize = (m: Mat): Mat => {
  if (!isSquare(m)) throw new Error("symmetrize requires a square matrix");
  const adj = conjTranspose(m);
  return matScale(matAdd(m, adj), 0.5);
};

export const outer = (psi: Vec, phi: Vec): Mat => {
  // |psi><phi|
  const out: Mat = [];
  for (let i = 0; i < psi.length; i++) {
    const row: Complex[] = [];
    for (let j = 0; j < phi.length; j++) row.push(cMul(psi[i], cConj(phi[j])));
    out.push(row);
  }
  return out;
};

// Kronecker (tensor) product of two matrices or vectors-as-column-matrices.
export const kron = (a: Mat, b: Mat): Mat => {
  const ar = matRows(a);
  const ac = matCols(a);
  const br = matRows(b);
  const bc = matCols(b);
  const out: Mat = [];
  for (let i = 0; i < ar * br; i++) {
    const row: Complex[] = [];
    for (let j = 0; j < ac * bc; j++) row.push(cZero());
    out.push(row);
  }
  for (let i1 = 0; i1 < ar; i1++) {
    for (let j1 = 0; j1 < ac; j1++) {
      for (let i2 = 0; i2 < br; i2++) {
        for (let j2 = 0; j2 < bc; j2++) {
          out[i1 * br + i2][j1 * bc + j2] = cMul(a[i1][j1], b[i2][j2]);
        }
      }
    }
  }
  return out;
};

// ---------------------------------------------------------------------------
// Real symmetric eigendecomposition for 2×2 Hermitian matrices.
//
// For any Hermitian matrix H, the spectrum is real. For 2×2 we have a closed
// form: trace t = h00 + h11, determinant d = h00 h11 - |h01|^2. Eigenvalues
// are (t ± sqrt(t^2 - 4 d)) / 2. We return them sorted ascending to match
// scipy.linalg.eigh(eigvals_only=True).
// ---------------------------------------------------------------------------

export const eigvalsh2 = (m: Mat): [number, number] => {
  if (matRows(m) !== 2 || matCols(m) !== 2) {
    throw new Error("eigvalsh2 requires a 2x2 matrix");
  }
  // Symmetrize defensively (Hermitian-safe path).
  const sym = symmetrize(m);
  const a = sym[0][0].re;
  const d = sym[1][1].re;
  const offRe = sym[0][1].re;
  const offIm = sym[0][1].im;
  const offAbs2 = offRe * offRe + offIm * offIm;
  const t = a + d;
  const disc = (a - d) * (a - d) + 4 * offAbs2;
  const root = Math.sqrt(Math.max(0, disc));
  const e1 = (t - root) / 2;
  const e2 = (t + root) / 2;
  return [e1, e2];
};

// General Hermitian eigendecomposition via two-sided Jacobi sweep. Used for
// matrices larger than 2x2 (currently only 2-qubit cases in tests). For 2x2
// we delegate to the closed form for stability.

export const eigvalshHermitian = (m: Mat): number[] => {
  const n = matRows(m);
  if (n !== matCols(m)) throw new Error("eigvalshHermitian requires square");
  if (n === 2) {
    const [a, b] = eigvalsh2(m);
    return [a, b];
  }
  // Defensive symmetrize.
  const A = symmetrize(m).map((row) => row.map((e) => ({ ...e })));
  const maxSweeps = 100;
  const tol = 1e-14;
  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    let off = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        off += A[i][j].re * A[i][j].re + A[i][j].im * A[i][j].im;
      }
    }
    if (off < tol) break;
    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        const apq = A[p][q];
        const mag2 = apq.re * apq.re + apq.im * apq.im;
        if (mag2 < 1e-30) continue;
        const app = A[p][p].re;
        const aqq = A[q][q].re;
        const tau = (aqq - app) / (2 * Math.sqrt(mag2));
        const tSign = tau >= 0 ? 1 : -1;
        const t = tSign / (Math.abs(tau) + Math.sqrt(1 + tau * tau));
        const cs = 1 / Math.sqrt(1 + t * t);
        const sn = cs * t;
        // unitary phase: theta = arg(apq)
        const mag = Math.sqrt(mag2);
        const cosPhi = apq.re / mag;
        const sinPhi = apq.im / mag;
        const sPlus = { re: sn * cosPhi, im: sn * sinPhi };
        const sMinus = { re: sn * cosPhi, im: -sn * sinPhi };
        // Rotate rows p and q.
        for (let k = 0; k < n; k++) {
          const apk = A[p][k];
          const aqk = A[q][k];
          A[p][k] = cAdd(cScale(apk, cs), cMul(sMinus, aqk));
          A[q][k] = cSub(cScale(aqk, cs), cMul(sPlus, apk));
        }
        // Rotate cols p and q.
        for (let k = 0; k < n; k++) {
          const akp = A[k][p];
          const akq = A[k][q];
          A[k][p] = cAdd(cScale(akp, cs), cMul(sPlus, akq));
          A[k][q] = cSub(cScale(akq, cs), cMul(sMinus, akp));
        }
        A[p][q] = cZero();
        A[q][p] = cZero();
      }
    }
  }
  const eigs: number[] = [];
  for (let i = 0; i < n; i++) eigs.push(A[i][i].re);
  return eigs.sort((x, y) => x - y);
};

// PSD square root via eigendecomposition. Returns the principal square root.
// Only used in the general Uhlmann fidelity path for non-pure references.
// For 2x2 Hermitian PSD, we diagonalize, take sqrt of (clipped) eigenvalues,
// and rotate back.

export const matSqrtPSD2 = (m: Mat): Mat => {
  if (matRows(m) !== 2 || matCols(m) !== 2) {
    throw new Error("matSqrtPSD2 requires a 2x2 matrix");
  }
  const sym = symmetrize(m);
  const a = sym[0][0].re;
  const d = sym[1][1].re;
  const offRe = sym[0][1].re;
  const offIm = sym[0][1].im;
  const offAbs2 = offRe * offRe + offIm * offIm;
  const tr = a + d;
  const disc = (a - d) * (a - d) + 4 * offAbs2;
  const root = Math.sqrt(Math.max(0, disc));
  const l1 = Math.max(0, (tr - root) / 2);
  const l2 = Math.max(0, (tr + root) / 2);
  const s1 = Math.sqrt(l1);
  const s2 = Math.sqrt(l2);
  // Eigenvectors:
  // If offAbs2 < tiny, the matrix is already diagonal — sqrt is element-wise
  // on the original diagonal, preserving the computational-basis ordering
  // (NOT the sorted-eigenvalue ordering, which would swap basis states for
  // descending diagonals like diag(1, 0)).
  if (offAbs2 < 1e-30) {
    return [
      [c(Math.sqrt(Math.max(0, a)), 0), c(0, 0)],
      [c(0, 0), c(Math.sqrt(Math.max(0, d)), 0)],
    ];
  }
  // For Hermitian m = [[a, z], [z*, d]] with eigenvalues l1, l2:
  // eigenvector for li satisfies (a - li) v1 + z v2 = 0 -> v2 = (li - a)/z' for v1=1,
  // where z = re+i*im; we keep vectors with the convention v = [z, l - a].
  const v1: Complex[] = [{ re: offRe, im: offIm }, { re: l1 - a, im: 0 }];
  const v2: Complex[] = [{ re: offRe, im: offIm }, { re: l2 - a, im: 0 }];
  const norm1 = Math.sqrt(cAbsSquared(v1[0]) + cAbsSquared(v1[1]));
  const norm2 = Math.sqrt(cAbsSquared(v2[0]) + cAbsSquared(v2[1]));
  const u11 = { re: v1[0].re / norm1, im: v1[0].im / norm1 };
  const u21 = { re: v1[1].re / norm1, im: v1[1].im / norm1 };
  const u12 = { re: v2[0].re / norm2, im: v2[0].im / norm2 };
  const u22 = { re: v2[1].re / norm2, im: v2[1].im / norm2 };
  // U = [[u11, u12], [u21, u22]]; m^{1/2} = U diag(s1, s2) U^H
  const U: Mat = [
    [u11, u12],
    [u21, u22],
  ];
  const D: Mat = [
    [c(s1, 0), c(0, 0)],
    [c(0, 0), c(s2, 0)],
  ];
  return matMul(matMul(U, D), conjTranspose(U));
};

function cAbsSquared(z: Complex): number {
  return z.re * z.re + z.im * z.im;
}

function c(re: number, im: number): Complex {
  return { re, im };
}
