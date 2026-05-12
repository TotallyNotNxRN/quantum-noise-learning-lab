# Quantum Noise Learning Lab

> An interactive single-qubit decoherence simulator — built as a static Next.js
> app on top of a NumPy/SciPy reference engine ported to TypeScript with
> per-output numerical parity to `1e-12`.

[![Tests — Python](https://img.shields.io/badge/pytest-209%20passed-brightgreen)]()
[![Tests — TypeScript parity](https://img.shields.io/badge/vitest-276%20passed-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

A focused teaching tool. Density matrices, three Kraus channels, fidelity,
purity, eigenvalue analysis, side-by-side analytical validation, and a
classical-style repetition-code intuition for why quantum error correction
matters. No backend, no auth, no database — the math runs in the browser.

## Architecture

```
quantum-noise-learning-lab/
├── src/quantum_noise_lab/        # Python reference engine (source of truth)
├── tests/                        # pytest — 209 assertions over the physics
├── tests/generate_parity_fixtures.py   # emits web/__tests__/parity_fixtures.json
├── docs/                         # math write-ups
├── examples/                     # Python scripts that render portfolio PNGs
├── web/                          # Next.js 15 app, deploys static to Vercel
│   ├── app/                      # routes (landing + 5 module pages)
│   ├── components/               # Bloch sphere (R3F), heatmaps, charts, glass panels
│   ├── lib/                      # TypeScript port of the engine
│   └── __tests__/parity.test.ts  # 276 parity assertions against the Python fixture
└── PLAN_V2.md                    # locked architecture spec for the pivot
```

The Python engine is the canonical numerical reference. The TypeScript port
in `web/lib/` is regenerated from the same math and gated by Vitest against
`web/__tests__/parity_fixtures.json` — every output (density matrices,
channel outputs, fidelity, purity, eigenvalues, analytical formulas, QEC
formulas) must match Python to `1e-12`.

## Quick start

### Run the web app locally

```bash
cd web
npm install
npm run dev     # http://localhost:3000
```

Production build:

```bash
cd web
npm run build && npm run start
```

### Run the Python reference

```bash
pip install -e .
pytest -q
python examples/run_single_qubit_sweep.py
python examples/generate_all_figures.py
```

### Regenerate parity fixtures (whenever the engine changes)

```bash
python tests/generate_parity_fixtures.py
cd web && npm test
```

## Deploy on Vercel

1. Push to GitHub `main`.
2. In Vercel: New Project → import the repo.
3. **Root Directory: `web`** (this is the critical setting).
4. Framework Preset: Next.js (auto-detected).
5. Install Command: `npm install`. Build Command: `npm run build`. Output Directory: default.

No environment variables needed; the app is fully static.

## Five modules

| # | Module | What it teaches |
|---|---|---|
| 1 | **Foundations** | State vectors, density matrices, Bloch sphere intuition. |
| 2 | **Noise** | Amplitude / phase / depolarizing Kraus channels, side-by-side before/after with a Δρ heatmap. |
| 3 | **Metrics** | Fidelity, purity, eigenvalues sweep across noise strength. |
| 4 | **Validation** | Simulated ρ vs closed-form analytical formulas for `|+⟩` — agreement at floating-point noise level. |
| 5 | **Protection** | Classical 3-repetition success curves; an honest panel on what real QEC adds. |

## Locked conventions

- **Amplitude damping** Kraus (Nielsen & Chuang 8.3.5).
- **Phase damping** in random-Z form: off-diagonals scaled by exactly `(1 − λ)`; `F_PD(λ) = 1 − λ/2`.
- **Depolarizing** in 4-op N&C form: `D(ρ) = (1 − p) ρ + p I/2`.
- **Fidelity** is the squared Uhlmann fidelity `F(ρ, σ) = (Tr √(√ρ σ √ρ))²`.
- All `src/` functions reject invalid inputs with a clear `ValueError`; the TS port mirrors the contract with `Error`.

## Limitations

- Single-qubit throughout. No multi-qubit gates, no entanglement.
- Module 5 is a *classical* repetition-code intuition; it does not implement quantum error correction (no phase errors, no syndromes, no no-cloning workaround).
- Density-matrix simulation scales `O(4ⁿ)` in qubit count; this is fine here because `n = 1`.
- Results are conceptual; not hardware predictions.

## Repository conventions

- Python engine in `src/quantum_noise_lab` may NOT import any plotting/UI library (enforced by `tests/test_architecture.py`).
- TypeScript port in `web/lib` may NOT import React/Next/UI primitives (it's pure math).
- The Vercel build only consumes `web/`.

## License

MIT.
