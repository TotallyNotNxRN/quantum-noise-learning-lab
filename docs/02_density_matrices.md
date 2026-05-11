# 2. Density matrices in depth

## Defining properties
A 2×2 matrix ρ is a valid single-qubit density matrix iff

1. **Hermitian:** ρ = ρ†.
2. **Positive semidefinite:** every eigenvalue λᵢ(ρ) ≥ 0.
3. **Unit trace:** Tr ρ = 1.

In the engine, these checks live in `quantum_noise_lab.metrics`:

```python
is_hermitian(rho, atol=1e-10)
is_positive_semidefinite(rho, atol=1e-10)
is_valid_density_matrix(rho, atol=1e-10)
```

## Heatmap layout convention
The density-matrix heatmaps in the app use the natural matrix layout:
the top-left cell shows `ρ₀₀ = ⟨0|ρ|0⟩` (population of |0⟩), the bottom-right
shows `ρ₁₁` (population of |1⟩), and the off-diagonal cells `ρ₀₁` and `ρ₁₀`
show the coherences (complex conjugates of each other). When `Im(ρ) ≠ 0`,
a second heatmap for the imaginary part is displayed below the real one.

## Anatomy of ρ
For a single qubit:

$$
\rho = \begin{pmatrix} p_0 & c \\ c^* & p_1 \end{pmatrix},
\qquad p_0 + p_1 = 1,\quad |c|^2 \le p_0 p_1.
$$

- `p_0`, `p_1` are the **populations** — measurement probabilities for |0⟩
  and |1⟩.
- `c` is the **coherence** — its magnitude bounds how much "quantum phase"
  the state still carries.

The constraint `|c|² ≤ p₀ p₁` is exactly the positive-semidefinite condition
for a 2×2 matrix.

## Pure vs mixed
A pure state has eigenvalues `(1, 0)` and **purity** `Tr(ρ²) = 1`. The
maximally mixed state ρ = I/2 has eigenvalues `(1/2, 1/2)` and purity `1/2`.
Anything between corresponds to a partially mixed state.

## Why ρ — not |ψ⟩ — after noise
Noise is information-theoretic loss of phase or energy to an unobserved
environment. After the environment is traced out, the qubit's state can only
be described by a density matrix in general. Streamlining the lab around ρ
is what lets every later module behave uniformly under both pure and mixed
inputs.

## Code map
- `quantum_noise_lab.metrics.purity(rho)`
- `quantum_noise_lab.metrics.eigenvalues(rho)` (`scipy.linalg.eigh`,
   Hermitian-safe)
- `quantum_noise_lab.metrics.trace_value(rho)`
