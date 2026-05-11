# Limitations

This lab is deliberately narrow and deliberately honest about its scope.

- **Educational simulator.** Results are for conceptual and computational
  learning; they are not predictions of any specific quantum hardware.
- **Single-qubit focus.** Every module operates on 2×2 density matrices.
  Multi-qubit channels, entanglement, and correlated noise are out of scope.
- **Three noise channels only.** Amplitude damping, phase damping, and
  depolarizing. Real hardware experiences combinations of these plus
  channels not modeled here (leakage, crosstalk, coherent control errors).
- **Phase damping convention.** This project pins the random-Z form so the
  off-diagonals of ρ scale by exactly `(1 − λ)`. Textbooks differ;
  see [`03_noise_channels.md`](03_noise_channels.md).
- **Protection Lab is not quantum error correction.** It implements a
  classical-style 3-repetition code for bit-flip errors only. It does
  not handle phase errors, does not use syndrome measurement, and relies
  on copying that is forbidden for unknown quantum states by the
  no-cloning theorem. See [`06_qec_intuition.md`](06_qec_intuition.md).
- **No fault-tolerant architecture.** No syndrome circuits, no logical
  Pauli operators, no concatenation, no surface code.
- **No hardware execution.** The lab does not call IBM Quantum, AWS Braket,
  or any cloud provider. There is no backend other than NumPy/SciPy.
- **Exponential scaling.** Density matrix simulation needs `O(4^n)` storage
  for `n` qubits. Single-qubit work fits in 32 bytes; this is comfortable
  for teaching, but the same code would not scale far without changes.
- **Numerical tolerances.** Validity checks use `atol = 1e-10`. Floating
  point arithmetic on Hermitian matrices can still produce tiny negative
  eigenvalues; the engine reports them honestly and clips them only when
  reporting fidelity or visualizing eigenvalues.

These constraints exist because the project optimizes for **depth**, not
feature count. The companion repository roadmap calls for follow-up
projects that lift specific limits — see the `Future work` section in the
README.
