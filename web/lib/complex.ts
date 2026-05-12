// Minimal complex-number utilities for the quantum engine. Real/imag parts
// stored as plain numbers (Float64). All operations are pure and immutable.

export interface Complex {
  re: number;
  im: number;
}

export const c = (re: number, im = 0): Complex => ({ re, im });

export const cZero = (): Complex => ({ re: 0, im: 0 });
export const cOne = (): Complex => ({ re: 1, im: 0 });

export const cAdd = (a: Complex, b: Complex): Complex => ({
  re: a.re + b.re,
  im: a.im + b.im,
});

export const cSub = (a: Complex, b: Complex): Complex => ({
  re: a.re - b.re,
  im: a.im - b.im,
});

export const cMul = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});

export const cScale = (a: Complex, s: number): Complex => ({
  re: a.re * s,
  im: a.im * s,
});

export const cConj = (a: Complex): Complex => ({ re: a.re, im: -a.im });

export const cAbs2 = (a: Complex): number => a.re * a.re + a.im * a.im;
export const cAbs = (a: Complex): number => Math.sqrt(cAbs2(a));

export const cEq = (a: Complex, b: Complex, tol = 1e-12): boolean =>
  Math.abs(a.re - b.re) <= tol && Math.abs(a.im - b.im) <= tol;

export const cIsFinite = (a: Complex): boolean =>
  Number.isFinite(a.re) && Number.isFinite(a.im);

export const cFromPolar = (r: number, theta: number): Complex => ({
  re: r * Math.cos(theta),
  im: r * Math.sin(theta),
});

export const cFormat = (a: Complex, digits = 4): string => {
  const re = a.re.toFixed(digits);
  if (Math.abs(a.im) < 1e-12) return re;
  const sign = a.im >= 0 ? "+" : "-";
  return `${re} ${sign} ${Math.abs(a.im).toFixed(digits)}i`;
};
