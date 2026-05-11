# 3. Noise channels and Kraus operators

A *quantum channel* is a completely positive trace-preserving (CPTP) map
that takes a density matrix to a density matrix. Every such channel admits
a **Kraus representation**:

$$
\mathcal{E}(\rho) = \sum_i E_i \,\rho\, E_i^\dagger,
\qquad \sum_i E_i^\dagger E_i = I.
$$

The Kraus operators `{Eᵢ}` describe alternative physical effects the
environment can have on the system; the channel is the statistical mixture
of these effects.

## Three channels in this lab

### Amplitude damping (γ ∈ [0, 1])
Energy relaxation from |1⟩ to |0⟩ (e.g. spontaneous emission). Kraus form
(Nielsen & Chuang §8.3.5):

$$
E_0 = \begin{pmatrix} 1 & 0 \\ 0 & \sqrt{1-\gamma} \end{pmatrix},
\qquad
E_1 = \begin{pmatrix} 0 & \sqrt{\gamma} \\ 0 & 0 \end{pmatrix}.
$$

Effect: |1⟩-population shrinks by γ; off-diagonals shrink by √(1−γ).

### Phase damping (λ ∈ [0, 1], random-Z convention)
Pure dephasing — populations are preserved, only quantum phase is lost.
The convention pinned in this project gives off-diagonals scaled by **exactly
(1 − λ)** via the random-Z form:

$$
E_0 = \sqrt{1 - \lambda/2}\;I, \qquad E_1 = \sqrt{\lambda/2}\;Z.
$$

(Some textbooks use the dissipative form
`E₁ = √λ · diag(0, 1)`, which would scale off-diagonals by `√(1-λ)`. The
random-Z form is chosen here because it produces the cleanest analytical
formulas for the Validation Lab and matches the physical picture of random
Z rotations from a noisy environment.)

### Depolarizing (p ∈ [0, 1])
With probability p the qubit is replaced by the maximally mixed state I/2,
otherwise it is left alone:

$$
\mathcal{D}(\rho) = (1-p)\,\rho + p\,\tfrac{I}{2}.
$$

Kraus form:

$$
E_0 = \sqrt{1 - 3p/4}\;I,\quad
E_1 = \sqrt{p/4}\;X,\quad
E_2 = \sqrt{p/4}\;Y,\quad
E_3 = \sqrt{p/4}\;Z.
$$

## Completeness check
The engine enforces `Σᵢ Eᵢ† Eᵢ = I` to floating-point tolerance whenever a
channel is applied:

```python
quantum_noise_lab.kraus_completeness_residual(kraus_ops)  # ~0 in healthy channels
quantum_noise_lab.apply_kraus_channel(rho, kraus_ops)      # raises if residual too large
```

This catches accidental construction of non-CPTP operator sets in user
extensions.

## Code map
- `amplitude_damping_kraus(gamma)`
- `phase_damping_kraus(lambda_param)`
- `depolarizing_kraus(p)`
- `apply_kraus_channel(rho, kraus_ops)`
- `kraus_completeness_residual(kraus_ops)`
