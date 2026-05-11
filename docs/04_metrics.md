# 4. Metrics: fidelity, purity, eigenvalues

## Fidelity (squared Uhlmann)

$$
F(\rho, \sigma) = \left(\operatorname{Tr}\sqrt{\sqrt{\rho}\,\sigma\,\sqrt{\rho}}\right)^2
\in [0, 1].
$$

`F = 1` iff `ρ = σ` (when one is pure, this is also the only way to get 1).
`F = 0` iff the two states have orthogonal supports.

The engine uses two fast paths plus the general path:

- **Pure ket reference:** `F(ρ, |ψ⟩⟨ψ|) = ⟨ψ|ρ|ψ⟩` — directly the expectation
  of the projector.
- **Pure matrix reference:** detected via `eigh`; same result as above.
- **General mixed reference:** matrix square root via Hermitian-symmetrized
  eigendecomposition, eigenvalues of `√ρ σ √ρ` clipped to ≥ 0 for the
  square-root sum.

Output is clipped to `[0, 1]` only within ±1e-9; larger excursions raise
`ValueError` because they indicate corrupted input.

## Purity

$$
\operatorname{Tr}(\rho^2) \in [1/d, 1]
$$

For `d = 2`: 1/2 for the maximally mixed state, 1 for any pure state.
Implemented as `np.real(np.trace(rho_sym @ rho_sym))` after Hermitian
symmetrization.

## Eigenvalues
Computed by `scipy.linalg.eigh` after symmetrizing `ρ` to suppress complex
residue from floating-point arithmetic. For ρ:

- A pure state has eigenvalues `(1, 0)`.
- A maximally mixed state has `(1/2, 1/2)`.
- Trace of ρ equals the sum of eigenvalues; this is a free correctness check.

## Validity checks
`is_valid_density_matrix(rho, atol)` returns `True` iff all three hold:

- `is_hermitian(rho, atol)`: `‖ρ − ρ†‖_F ≤ atol`.
- `is_positive_semidefinite(rho, atol)`: `min λᵢ(ρ) ≥ −atol`.
- `|Tr ρ − 1| ≤ atol`.

The default `atol = 1e-10` is exposed as a kwarg and surfaced in the UI's
validation pill tooltips.

## Code map
- `quantum_noise_lab.metrics.fidelity(rho, reference)`
- `quantum_noise_lab.metrics.purity(rho)`
- `quantum_noise_lab.metrics.eigenvalues(rho)`
- `quantum_noise_lab.metrics.is_valid_density_matrix(rho, atol)`
