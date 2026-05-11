# 6. Repetition-code intuition

## Setup
A single classical-style bit is encoded as three physical bits:

$$
0 \;\mapsto\; 000, \qquad 1 \;\mapsto\; 111.
$$

Each physical bit flips independently with probability `p`. The decoder
reads all three bits and emits the majority value.

## Success probability

**Unprotected** (no encoding):

$$
P_{unprot}(p) = 1 - p.
$$

**Protected** (3 physical bits, majority vote): the decoder is right when
at most one of the three bits flipped. The probability of 0 or 1 errors:

$$
P_{prot}(p) = (1-p)^3 + 3p(1-p)^2.
$$

Algebraically `P_prot − P_unprot = p(1-p)(1-2p)`, which is non-negative
exactly when `p ≤ 1/2` — the famous threshold for this code.

## Why this is in the lab
The Protection Lab uses these formulas because they are honest. They show:

- redundancy helps when per-bit noise is below 1/2,
- above 1/2 redundancy *hurts* (more chances for the majority to be wrong),
- you can plot a clean, intuitive success curve without claiming to do
  quantum error correction.

## What this is *not*
This is a **classical** repetition code applied to a single error type.
It is not real quantum error correction. Specifically:

- **Phase errors are ignored.** Real qubits also experience Z-type errors;
  this code cannot detect or correct those.
- **No syndrome extraction.** Real QEC measures stabilizer operators on
  ancillary qubits without disturbing the encoded logical state.
- **No-cloning.** You cannot copy an unknown quantum state, so encoding
  `α|0⟩ + β|1⟩` as `(α|0⟩ + β|1⟩)⊗³` is **forbidden**. Real codes
  embed the logical state in *entanglement* over multiple physical qubits;
  the Shor code, surface code, and so on do this.
- **Not fault tolerant.** A real fault-tolerant architecture also handles
  errors during encoding, gate execution, and measurement.

## Where to go next
The references in the README cover the Shor code, stabilizer formalism, and
surface code — the natural next steps after this intuition.

## Code map
- `quantum_noise_lab.qec.repetition_success_unprotected(p)`
- `quantum_noise_lab.qec.repetition_success_protected(p)`
- `tests/test_qec.py`
