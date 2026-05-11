# 5. Analytical vs simulated decoherence

Initial state:

$$
|\psi\rangle = (|0\rangle + |1\rangle)/\sqrt{2},\qquad
\rho_0 = \begin{pmatrix} 1/2 & 1/2 \\ 1/2 & 1/2 \end{pmatrix}.
$$

## Amplitude damping
Applying `E₀ = diag(1, √(1−γ))` and `E₁ = [[0, √γ], [0, 0]]` to `ρ₀`:

$$
\rho_{AD}(\gamma) = \begin{pmatrix}
(1+\gamma)/2 & \sqrt{1-\gamma}/2 \\
\sqrt{1-\gamma}/2 & (1-\gamma)/2
\end{pmatrix}.
$$

Fidelity against `|+⟩`:

$$
F_{AD}(\gamma) = \langle +|\,\rho_{AD}(\gamma)\,|+\rangle
= \tfrac{1}{2}\bigl(\tfrac{1+\gamma}{2} + \sqrt{1-\gamma} + \tfrac{1-\gamma}{2}\bigr)
= \frac{1 + \sqrt{1-\gamma}}{2}.
$$

At γ = 0: F = 1, ρ unchanged. At γ = 1: F = 1/2, state collapses to |0⟩⟨0|
and the |+⟩ overlap is exactly 1/2.

## Phase damping
With the random-Z Kraus convention used here,

$$
E_0 = \sqrt{1-\lambda/2}\;I,\quad E_1 = \sqrt{\lambda/2}\;Z,
$$

acting on `ρ₀` gives:

$$
\rho_{PD}(\lambda) = \begin{pmatrix} 1/2 & (1-\lambda)/2 \\
(1-\lambda)/2 & 1/2 \end{pmatrix}.
$$

Fidelity:

$$
F_{PD}(\lambda) = \langle +|\rho_{PD}(\lambda)|+\rangle = 1 - \lambda/2.
$$

At λ = 0: F = 1, identity channel. At λ = 1: F = 1/2, off-diagonals fully
suppressed and ρ → I/2.

## Why this matters
The closed-form expressions above are derived by hand. The Kraus channels
are implemented independently in `quantum_noise_lab.noise` without
reference to those formulas. The Validation Lab compares the two side by
side, in real time, for every parameter value. The automated tests
(`tests/test_analytical.py`) make this a regression-protected guarantee:
every push to the engine must keep `‖ρ_sim − ρ_ana‖ ≤ 1e-12` and
`|F_sim − F_ana| ≤ 1e-12` across the entire grid.

## Convention warning
Phase damping parameterizations differ across textbooks. This project's
choice is documented loudly in the Validation Lab and again here. If you
adapt this engine to course material that uses the dissipative form
`E₁ = √λ · diag(0, 1)`, the analytical formulas above must be re-derived.

## Code map
- `quantum_noise_lab.analytical.analytical_amplitude_density(gamma)`
- `quantum_noise_lab.analytical.analytical_phase_density(lambda_param)`
- `quantum_noise_lab.analytical.analytical_amplitude_fidelity(gamma)`
- `quantum_noise_lab.analytical.analytical_phase_fidelity(lambda_param)`
- `tests/test_analytical.py`
