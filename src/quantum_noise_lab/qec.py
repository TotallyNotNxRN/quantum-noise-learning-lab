"""Classical-style 3-repetition bit-flip protection success formulas.

These functions exist purely to give beginners an intuition bridge into the
idea of redundancy and majority-vote correction. They are NOT a model of
full quantum error correction: they ignore phase errors, do not use a
syndrome circuit, and rely on copying which is forbidden for unknown
quantum states by the no-cloning theorem.

Formulas (probability that the encoded value is read out correctly):
    P_unprotected(p) = 1 - p
    P_protected(p)   = (1 - p)^3 + 3 p (1 - p)^2

The protected formula counts "0 errors" plus "exactly 1 error", both of
which are corrected by majority vote across the three physical bits.
"""

from __future__ import annotations

import math


def _check_unit(name: str, value: float) -> float:
    f = float(value)
    if not math.isfinite(f) or f < 0.0 or f > 1.0:
        raise ValueError(f"{name} must be in [0, 1], got {value!r}")
    return f


def repetition_success_unprotected(p: float) -> float:
    """Return ``1 - p``, the success probability of an unprotected bit."""
    pp = _check_unit("p", p)
    return float(1.0 - pp)


def repetition_success_protected(p: float) -> float:
    """Return ``(1 - p)^3 + 3 p (1 - p)^2``, majority-vote success of the 3-rep code."""
    pp = _check_unit("p", p)
    one_minus = 1.0 - pp
    return float(one_minus**3 + 3.0 * pp * one_minus**2)
