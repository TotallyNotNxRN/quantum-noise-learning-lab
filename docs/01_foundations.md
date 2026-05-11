# 1. Foundations — state vectors and density matrices

> This file and `02_density_matrices.md` both back the **Foundations Lab**
> page in the app: this one focuses on state vectors and the motivation for
> ρ, while `02_*` is a deeper dive on the density-matrix object itself.

## What this module covers
The single-qubit state vector |ψ⟩, the computational basis, measurement
probabilities, and the density matrix ρ = |ψ⟩⟨ψ|. The goal is to motivate
ρ as the right object to study before noise enters the picture.

## Key formulas

A pure single-qubit state in the computational basis:

$$
|\psi\rangle = \alpha\,|0\rangle + \beta\,|1\rangle,
\qquad |\alpha|^2 + |\beta|^2 = 1.
$$

The Bloch-form parameterization used by the custom state in the app:

$$
|\psi(\theta, \varphi)\rangle = \cos(\theta/2)\,|0\rangle
+ e^{i\varphi}\sin(\theta/2)\,|1\rangle.
$$

The density matrix for a pure state is the outer product:

$$
\rho = |\psi\rangle\langle\psi| =
\begin{pmatrix}|\alpha|^2 & \alpha\beta^*\\ \alpha^*\beta & |\beta|^2\end{pmatrix}.
$$

Diagonal entries are populations (measurement probabilities) and off-diagonal
entries are *coherences* — the quantum phase information.

## Why density matrices

Once the qubit interacts with noise, it is no longer in a single ket
|ψ⟩; it is a statistical mixture of possible outcomes. A density matrix
ρ captures both the pure-state and the mixed-state regime uniformly: any
ρ obeying ρ = ρ†, ρ ⪰ 0, Tr ρ = 1 is a valid quantum state, pure or mixed.

For a mixture of pure states {|ψᵢ⟩} with probabilities {pᵢ}:

$$
\rho = \sum_i p_i\,|\psi_i\rangle\langle\psi_i|, \qquad \sum_i p_i = 1.
$$

There is no ket that represents this mixture — only the density matrix does.

## Code map
- `quantum_noise_lab.basis_state(index, dimension)`
- `quantum_noise_lab.ket_zero()`, `ket_one()`, `plus_state()`
- `quantum_noise_lab.custom_qubit_state(theta, phi)`
- `quantum_noise_lab.density_matrix(psi)` (validates normalization)
- `quantum_noise_lab.tensor_product(*arrays)`

## What to look at in the app
Open **Foundations Lab**, pick `|+⟩`, then switch to *Custom |ψ⟩* and sweep
θ. Watch the diagonal entries (populations) move while the off-diagonals
encode the relative phase. Sweep φ and notice the off-diagonals pick up
imaginary parts — this is the quantum phase the next module will destroy.

## Next
Continue to `02_density_matrices.md` for a focused treatment of ρ before
the channels in `03_noise_channels.md`.
