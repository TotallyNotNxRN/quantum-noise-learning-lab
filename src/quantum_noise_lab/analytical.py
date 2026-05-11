"""Closed-form decoherence results for the ``|+>`` initial state.

The Validation Lab compares simulated channel output to these analytical
expressions; tests verify agreement to ``1e-12``.

Initial state:
    |psi> = (|0> + |1>) / sqrt(2)
    rho_0 = [[1/2, 1/2], [1/2, 1/2]]

Amplitude damping (gamma in [0, 1]):
    rho_AD(gamma) = [[(1 + gamma)/2, sqrt(1 - gamma)/2],
                     [sqrt(1 - gamma)/2, (1 - gamma)/2]]
    F_AD(gamma)   = (1 + sqrt(1 - gamma)) / 2

Phase damping (lambda in [0, 1], off-diagonals scaled by (1 - lambda)):
    rho_PD(lambda) = [[1/2, (1 - lambda)/2],
                      [(1 - lambda)/2, 1/2]]
    F_PD(lambda)   = 1 - lambda/2
"""

from __future__ import annotations

import numpy as np


def _check_unit(name: str, value: float) -> float:
    f = float(value)
    if not np.isfinite(f) or f < 0.0 or f > 1.0:
        raise ValueError(f"{name} must be in [0, 1], got {value!r}")
    return f


def analytical_amplitude_density(gamma: float) -> np.ndarray:
    """Closed-form rho after amplitude damping applied to ``|+><+|``."""
    g = _check_unit("gamma", gamma)
    s = np.sqrt(1.0 - g)
    return np.array(
        [
            [(1.0 + g) / 2.0, s / 2.0],
            [s / 2.0, (1.0 - g) / 2.0],
        ],
        dtype=np.complex128,
    )


def analytical_phase_density(lambda_param: float) -> np.ndarray:
    """Closed-form rho after phase damping applied to ``|+><+|``."""
    lam = _check_unit("lambda", lambda_param)
    off = (1.0 - lam) / 2.0
    return np.array(
        [
            [0.5, off],
            [off, 0.5],
        ],
        dtype=np.complex128,
    )


def analytical_amplitude_fidelity(gamma: float) -> float:
    """Closed-form fidelity ``F(rho_AD, |+><+|)``."""
    g = _check_unit("gamma", gamma)
    return float((1.0 + np.sqrt(1.0 - g)) / 2.0)


def analytical_phase_fidelity(lambda_param: float) -> float:
    """Closed-form fidelity ``F(rho_PD, |+><+|)``."""
    lam = _check_unit("lambda", lambda_param)
    return float(1.0 - lam / 2.0)
