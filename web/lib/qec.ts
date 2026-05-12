// Port of `quantum_noise_lab/qec.py` to TypeScript.
//
// Classical-style 3-repetition bit-flip protection. NOT a real quantum
// error-correction code; phase errors are not addressed. Single source of
// truth lives in Python; this port mirrors the formulas exactly.

function checkUnit(name: string, value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${name} must be in [0, 1], got ${value}`);
  }
  return value;
}

export function repetitionSuccessUnprotected(p: number): number {
  const pp = checkUnit("p", p);
  return 1 - pp;
}

export function repetitionSuccessProtected(p: number): number {
  const pp = checkUnit("p", p);
  const q = 1 - pp;
  return q * q * q + 3 * pp * q * q;
}
