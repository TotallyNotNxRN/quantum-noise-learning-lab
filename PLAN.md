# Quantum Noise Learning Lab — Locked Architecture Plan

Status: Phase A. Awaiting Codex adversarial review before code implementation.

## Central Narrative

"How does quantum information degrade under noise, and how can we understand, measure, visualize, and partially protect it?"

## Audience

Undergraduate admissions / research portfolio. Beginner-accessible explanations, undergrad-rigor math.

## Stack

- Streamlit (multi-page) — UI
- NumPy — numerical core
- SciPy (`scipy.linalg.eigh`) — Hermitian-safe eigendecomposition
- Plotly — heatmaps + curves
- pytest — tests
- Matplotlib (only inside `examples/generate_all_figures.py` for static portfolio figures)

Hard separation: `src/` has no Streamlit/Plotly imports. `app/` has no math beyond formatting.

## Five Modules (locked)

1. **Foundations Lab** — state vectors and density matrices.
   - States: `|0>`, `|1>`, `|+> = (|0> + |1>)/sqrt(2)`, custom `|psi> = cos(theta/2)|0> + e^{i phi} sin(theta/2)|1>`.
   - Visuals: state-vector readout, probability bar, density matrix heatmap (Re/Im if phi != 0).
   - Goal: motivate why density matrices are needed before noise.

2. **Noise Lab** — Kraus channels.
   - Channels: amplitude damping, phase damping, depolarizing.
   - Per channel: parameter slider, Kraus operators, original rho, noisy rho, difference matrix, physical interpretation.
   - Goal: show diagonal = populations, off-diagonal = coherence.

3. **Metrics Lab** — fidelity, purity, eigenvalues.
   - Compute and plot vs noise parameter: fidelity curve, purity curve, eigenvalue bar + evolution, validation status pill (trace, Hermitian, PSD).
   - Goal: connect each metric to something visible in rho.

4. **Validation Lab** — analytical vs simulated decoherence.
   - Initial state `|+>`, `rho = [[1/2, 1/2], [1/2, 1/2]]`.
   - Amplitude damping closed-form:
     - `rho_AD(gamma) = [[(1+gamma)/2, sqrt(1-gamma)/2], [sqrt(1-gamma)/2, (1-gamma)/2]]`
     - `F_AD(gamma) = (1 + sqrt(1-gamma)) / 2`
   - Phase damping (convention: off-diag scaled by `(1 - lambda)`):
     - `rho_PD(lambda) = [[1/2, (1-lambda)/2], [(1-lambda)/2, 1/2]]`
     - `F_PD(lambda) = 1 - lambda/2`
   - Visuals: side-by-side analytical vs simulated rho, |error| heatmap, overlaid fidelity curves.
   - Goal: prove the simulator is mathematically grounded.

5. **Protection Lab** — 3-repetition bit-flip intuition.
   - Formulas:
     - `P_unprotected = 1 - p`
     - `P_protected = (1-p)^3 + 3p(1-p)^2`
   - Honest scoping (loud, repeated): bit-flip only, not full QEC, no cloning theorem violation, phase errors not addressed.

## Simulation API (locked signatures, all in `src/`)

```python
# states.py
basis_state(index: int, dimension: int = 2) -> np.ndarray
ket_zero() -> np.ndarray
ket_one() -> np.ndarray
plus_state() -> np.ndarray
custom_qubit_state(theta: float, phi: float) -> np.ndarray
density_matrix(psi: np.ndarray) -> np.ndarray
tensor_product(*arrays: np.ndarray) -> np.ndarray

# noise.py
# Amplitude damping (Nielsen & Chuang 8.3.5): p in [0, 1], gamma == prob of decay.
#   E0 = [[1, 0], [0, sqrt(1-gamma)]]
#   E1 = [[0, sqrt(gamma)], [0, 0]]
amplitude_damping_kraus(gamma: float) -> list[np.ndarray]
# Phase damping (this project's convention -- random-Z / phase-flip form,
# chosen because off-diagonals scale by EXACTLY (1 - lambda), which makes
# F_PD(lambda) = 1 - lambda/2 a clean closed form):
#   E0 = sqrt(1 - lambda/2) * I
#   E1 = sqrt(lambda/2)     * Z
#   Result on rho = [[a, b], [c, d]]:  rho' = [[a, b(1-lambda)], [c(1-lambda), d]]
#   At lambda = 1: populations preserved, off-diagonals -> 0; on |+><+| output is I/2.
#   NOTE: the textbook dissipative-style pair
#         E0 = diag(1, sqrt(1-lambda)), E1 = diag(0, sqrt(lambda))
#         scales off-diagonals by sqrt(1-lambda) instead -- different parameterization.
phase_damping_kraus(lambda_param: float) -> list[np.ndarray]
# Depolarizing (Nielsen & Chuang 8.3.4 convention): D(rho) = (1-p) rho + p I/2.
#   E0 = sqrt(1 - 3p/4) * I
#   E1 = sqrt(p/4) * X
#   E2 = sqrt(p/4) * Y
#   E3 = sqrt(p/4) * Z
#   p in [0, 1]. At p=1 the channel sends every input rho to the maximally mixed state I/2.
depolarizing_kraus(p: float) -> list[np.ndarray]
apply_kraus_channel(rho: np.ndarray, kraus_ops: list[np.ndarray]) -> np.ndarray
kraus_completeness_residual(kraus_ops) -> float                # ||sum K_i^dag K_i - I||_F

# metrics.py
# Fidelity convention: SQUARED Uhlmann fidelity.
#   F(rho, sigma) = ( Tr sqrt( sqrt(rho) sigma sqrt(rho) ) )^2,  F in [0, 1].
#   Pure-state fast path: if reference == |psi><psi| (rank 1), F = <psi|rho|psi>.
#   This convention is what makes F_AD = (1+sqrt(1-gamma))/2 and F_PD = 1 - lambda/2
#   (verified: <+|rho_AD|+> = (1+sqrt(1-gamma))/2; <+|rho_PD|+> = 1-lambda/2).
fidelity(rho: np.ndarray, reference: np.ndarray) -> float
purity(rho) -> float                                              # Tr(rho^2)
# Hermitian-safe path: rho is symmetrized (rho + rho^H)/2 before eigh; tiny negative
# eigenvalues from float noise are clipped to 0 ONLY for reporting/visualization,
# never for validity checks. Validity checks use raw eigenvalues against tolerance.
eigenvalues(rho) -> np.ndarray                                    # via scipy.linalg.eigh
trace_value(rho) -> complex
is_hermitian(rho, atol=1e-10) -> bool
is_positive_semidefinite(rho, atol=1e-10) -> bool                 # min eigenvalue >= -atol
is_valid_density_matrix(rho, atol=1e-10) -> bool                  # Hermitian + PSD + |Tr-1| <= atol

# analytical.py
analytical_amplitude_density(gamma) -> np.ndarray
analytical_phase_density(lambda_param) -> np.ndarray
analytical_amplitude_fidelity(gamma) -> float
analytical_phase_fidelity(lambda_param) -> float

# qec.py
repetition_success_unprotected(p) -> float
repetition_success_protected(p) -> float                        # (1-p)^3 + 3p(1-p)^2

# sweeps.py
sweep_noise(channel_kraus_fn, rho_initial, param_grid) -> list[np.ndarray]
sweep_metric(channel_kraus_fn, rho_initial, reference, metric_fn, param_grid) -> np.ndarray
```

## UI Flow

Per module page: sidebar controls (sliders), two-column body (left = math/explanation, right = visuals), collapsible Beginner + Technical explainers, validation status pill, equation blocks via `st.latex`.

Landing page (`app/main.py`): central narrative, module index, "Start with Foundations Lab" CTA.

## Repository Tree

```
quantum-noise-learning-lab/
├── README.md
├── requirements.txt
├── pyproject.toml
├── .gitignore
├── LICENSE
├── PLAN.md                  # this file
├── .streamlit/config.toml
├── app/
│   ├── main.py
│   ├── pages/
│   │   ├── 1_Foundations_Lab.py
│   │   ├── 2_Noise_Lab.py
│   │   ├── 3_Metrics_Lab.py
│   │   ├── 4_Validation_Lab.py
│   │   └── 5_Protection_Lab.py
│   └── components/{plots.py, explain.py, validation.py}
├── src/
│   ├── __init__.py
│   ├── states.py
│   ├── noise.py
│   ├── metrics.py
│   ├── analytical.py
│   ├── qec.py
│   └── sweeps.py
├── docs/
│   ├── 01_foundations.md
│   ├── 02_density_matrices.md
│   ├── 03_noise_channels.md
│   ├── 04_metrics.md
│   ├── 05_analytical_validation.md
│   ├── 06_qec_intuition.md
│   └── limitations.md
├── examples/
│   ├── run_single_qubit_sweep.py
│   └── generate_all_figures.py
├── tests/
│   ├── test_states.py
│   ├── test_noise.py
│   ├── test_metrics.py
│   ├── test_analytical.py
│   └── test_qec.py
├── results/{figures/, data/}
└── assets/screenshots/
```

## Input-Validation Contract (locked)

All public `src/` functions validate inputs and raise `ValueError` with a clear message on bad input. The UI relies on this; sliders are clamped, but examples and tests must hit the failure modes.

- `density_matrix(psi)`: requires `psi` be a 1-D `np.ndarray` of dtype `complex128` (or castable), nonzero, normalized to within `1e-10`. Otherwise `ValueError`.
- `custom_qubit_state(theta, phi)`: accepts any real `theta`, `phi`; returns normalized state by construction (no validation needed).
- `amplitude_damping_kraus(gamma)`, `phase_damping_kraus(lambda_param)`, `depolarizing_kraus(p)`: parameter must be in `[0.0, 1.0]`; otherwise `ValueError`.
- `apply_kraus_channel(rho, kraus_ops)`: requires `rho` square, dim matches every Kraus operator, `kraus_ops` non-empty list. `rho` is symmetrized before use; if asymmetry exceeds `1e-8` raises `ValueError` (non-Hermitian input is a bug, not a tolerance issue).
- `fidelity(rho, reference)`: same shape, both square, `rho` valid density matrix; `reference` either valid density matrix or pure state ket — function detects which.
- All return arrays are `np.ndarray` of dtype `complex128` for matrices, `float64` for scalars.
- All numerical tolerances default to `1e-10` and are exposed as kwargs.

## Test Plan (expanded per Codex review)

- `test_states.py`: normalization, density matrix trace = 1, Hermiticity, PSD; non-normalized psi raises ValueError; bad shape raises.
- `test_noise.py`:
  - amplitude damping at gamma in {0, 0.25, 0.5, 0.75, 1}, applied to |0><0|, |1><1|, |+><+|;
  - phase damping at lambda in {0, 0.25, 0.5, 0.75, 1}, applied to same three states;
  - depolarizing at p in {0, 0.25, 0.5, 0.75, 1}, applied to |0><0| and |+><+|; at p=1 result must equal I/2 to 1e-12;
  - Kraus completeness residual < 1e-10 for all three channels across the parameter grid;
  - out-of-range parameter (-0.1, 1.1) raises ValueError;
  - mismatched-dimension Kraus list raises ValueError.
- `test_metrics.py`: fidelity in [0, 1], purity in [1/d, 1], eigenvalues real and in [-tol, 1+tol], trace preservation under valid channels; pure-state fidelity fast path agrees with general path to 1e-12; `is_valid_density_matrix` rejects non-Hermitian, negative-eigenvalue, and trace ≠ 1 inputs.
- `test_analytical.py`:
  - numerical `apply_kraus_channel` output matches `analytical_amplitude_density(gamma)` and `analytical_phase_density(lambda)` to 1e-12 across the full grid;
  - `analytical_amplitude_fidelity` and `analytical_phase_fidelity` match the numerical `fidelity(...)` to 1e-12;
  - parameter-boundary cases (gamma=0, gamma=1, lambda=0, lambda=1) match by closed-form check.
- `test_qec.py`: P_unprotected = 1 - p, P_protected = (1-p)^3 + 3p(1-p)^2 (closed-form), P_protected > P_unprotected for p in (0, 0.5), P_protected = P_unprotected at p in {0, 0.5}, P_protected < P_unprotected for p in (0.5, 1).
- `test_architecture.py`: AST/string scan of `src/` rejects any import of `streamlit`, `plotly`, `matplotlib`, `dash`; AST scan of `app/pages` and `app/main.py` rejects local definitions of channel/metric/density-matrix math (must call `src/`).
- `test_smoke.py`: imports every public module, runs one mini sweep end-to-end. Catches broken imports / missing files in clean clones.

## Reproducibility Plan (locked)

- `requirements.txt` pins minor-version ranges: `numpy>=1.26,<3`, `scipy>=1.11,<2`, `streamlit>=1.30,<2`, `plotly>=5.18,<7`, `matplotlib>=3.8,<4`, `pytest>=7,<9`.
- `pyproject.toml` declares `quantum_noise_lab` as the importable package backed by `src/`. Install via `pip install -e .` so tests and examples import without sys.path tricks.
- README clean-clone smoke sequence (must succeed on a fresh checkout):
  1. `pip install -e .`
  2. `pytest -q`
  3. `python examples/run_single_qubit_sweep.py`
  4. `streamlit run app/main.py` (manual visual smoke check)
- Phase B exit gate: `pytest -q` passes locally before Phase C begins.

## Phase B Status

Engine + tests complete. `pytest -q` -> 201 passed, 2 skipped (architecture tests for `app/` are skipped until Phase C builds the UI).

## Codex Phase B Feedback (received and applied)

Accepted (5/5 — all correctness, none scope creep):

- BLOCKER: Non-finite state inputs no longer bypass normalization. `custom_qubit_state` rejects non-finite `theta`/`phi`; `density_matrix` rejects non-finite ket entries and non-finite norms.
- HIGH-PRI: `apply_kraus_channel` now validates inputs as full density matrices (finite, Hermitian, PSD within `1e-10`, trace 1 within `1e-10`) and rejects non-finite Kraus operators.
- HIGH-PRI: `fidelity` no longer silently clips invalid physics. Inputs validated for finiteness, ket reference normalization, matrix reference PSD; output clipped only within `CLIP_TOL = 1e-9` and raises beyond that.
- TESTS-TO-ADD: NaN/Inf paths covered for `custom_qubit_state`, `density_matrix`, `apply_kraus_channel`, `fidelity`; non-PSD/wrong-trace paths covered for `apply_kraus_channel` and `fidelity`; non-normalized-ket path covered for `fidelity`.

Nothing rejected.

## Documentation Plan

`README.md` sections: title, one-sentence summary, motivation, audience, key features, screenshots, scientific background, equations, install, run, test, repo structure, example results, limitations, future work, references.

`docs/` per-module markdown files explain math and link back to specific functions in `src/` and visuals in `app/`.

## Limitations (explicit, in README and `docs/limitations.md`)

- Educational simulator only.
- Single-qubit focus throughout.
- Module 5 demonstrates classical-style 3-repetition intuition, NOT full quantum error correction (does not address phase errors, no syndrome measurement, no logical Pauli operators).
- Real hardware noise is more complex than these idealized Kraus channels.
- Phase damping parameter conventions vary across textbooks; this project fixes the convention `off-diagonal × (1 - lambda)` and states it explicitly.
- No fault-tolerant architecture. No hardware execution. No cloud APIs.
- Density matrix simulation scales exponentially with qubit count (`O(4^n)` storage); this is fine here because the project is single-qubit.
- Results are for conceptual and computational learning, not hardware prediction.

## Phase Plan

- A: lock plan (this) — Gemini + Codex adversarial review pending.
- B: implement `src/` engine + `tests/` only. Codex adversarial review on engine.
- C: implement `app/` UI on top of tested engine. Gemini UI/learning review.
- D: README + `docs/` + `examples/` + screenshots. Gemini docs review. Brand Voice tone polish (no math touched). Design polish on layout. `/codex:review` final release audit.
- E: final self-audit + delivery.

## Gemini Phase A Feedback (received)

Accepted (will incorporate before/during implementation):
- Drop "research tool" language → use "Interactive Educational Lab" or "Quantum Information Simulator." (overclaim risk)
- Be loud about the 3-bit code being a "Classical-style Repetition Code" that does NOT handle phase flips. (overclaim risk)
- Bridge the |psi> → rho transition explicitly in Foundations Lab — add a "Why density matrices?" callout in the module before Noise Lab. (clarity blocker)
- Annotate Kraus operators with their physical role in the UI (e.g., "E1: energy decay event"). (clarity blocker)
- Augment the difference-matrix heatmap with a scalar summary (Frobenius norm or trace distance) so beginners get a single number. (clarity blocker)
- Validation Lab consistency: gamma and lambda must be defined identically in `src/` code, `analytical.py`, and `st.latex` blocks. Add "Convention" callout. (coherence)
- Add `st.info` "Next:" continuity hints at the bottom of each module page linking to the next module. (polish)
- Add tooltip on the validation status pill showing the absolute tolerance epsilon used. (polish)

Rejected:
- Bloch sphere as "hero visual." Reason: scope creep beyond locked module list; density matrix heatmap already serves Foundations + Noise + Validation labs and is more directly tied to the central narrative ("information degrades = matrix changes"). May reconsider in Phase D Polish if it would replace, not add to, an existing visual.
- Any expansion to 2+ qubits. Reason: explicitly out of scope; depth > breadth.

## Codex Phase A Feedback (received and applied)

Accepted (incorporated above):
- BLOCKER: depolarizing semantics now pinned to Nielsen & Chuang convention `D(rho) = (1-p) rho + p I/2` with explicit Kraus matrices and `p=1 -> I/2` documented; tests cover intermediate p on `|0><0|` and `|+><+|`, not just endpoints.
- BLOCKER: input-validation contract is now part of the locked API — every `src/` function defines accepted shapes/ranges and the `ValueError` cases; tests cover out-of-range params, malformed rho, dim mismatch.
- HIGH-PRI: fidelity convention pinned to squared Uhlmann; analytical formulas verified against `<+|rho|+>` derivation; Hermitian symmetrization + report-only eigenvalue clipping rules locked.
- HIGH-PRI: import-boundary enforcement added as `tests/test_architecture.py` — `src/` cannot import Streamlit/Plotly/Matplotlib/Dash; `app/pages` cannot redefine channel/metric/density-matrix math.
- LOW-PRI: reproducibility — pinned dependency ranges, `pip install -e .` install mode, clean-clone smoke sequence in README, Phase B gates on `pytest -q` passing.

Nothing rejected. All findings tightened correctness without expanding scope.
