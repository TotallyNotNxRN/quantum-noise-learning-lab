"""Single-qubit quantum noise channels expressed as Kraus operators.

Conventions (locked):

* Amplitude damping (Nielsen & Chuang 8.3.5)
      E0 = [[1, 0], [0, sqrt(1 - gamma)]]
      E1 = [[0, sqrt(gamma)], [0, 0]]
      gamma in [0, 1] is the probability of an energy-decay event.

* Phase damping (this project's convention -- random-Z / phase-flip form)
      E0 = sqrt(1 - lambda/2) * I
      E1 = sqrt(lambda/2)     * Z
      lambda in [0, 1]; the channel scales rho off-diagonals by exactly
      (1 - lambda) and leaves populations unchanged. Note: textbooks vary
      between this random-Z parameterization and the dissipative form
      ``E1 = sqrt(lambda) diag(0, 1)``, which scales off-diagonals by
      sqrt(1 - lambda). PLAN.md fixes the random-Z convention because it
      produces the cleanest analytical formulas for the Validation Lab.

* Depolarizing (Nielsen & Chuang 8.3.4):
      D(rho) = (1 - p) rho + p I/2
      E0 = sqrt(1 - 3p/4) I
      E1 = sqrt(p/4)     X
      E2 = sqrt(p/4)     Y
      E3 = sqrt(p/4)     Z
      p in [0, 1]; at p = 1 every input maps to the maximally mixed state I/2.

All channels are completely positive trace preserving (CPTP); see
:func:`kraus_completeness_residual` for a numerical check.
"""

from __future__ import annotations

import numpy as np

ASYMMETRY_TOL = 1e-8

_PAULI_X = np.array([[0.0, 1.0], [1.0, 0.0]], dtype=np.complex128)
_PAULI_Y = np.array([[0.0, -1.0j], [1.0j, 0.0]], dtype=np.complex128)
_PAULI_Z = np.array([[1.0, 0.0], [0.0, -1.0]], dtype=np.complex128)
_IDENTITY_2 = np.eye(2, dtype=np.complex128)


def _check_unit_param(name: str, value: float) -> float:
    """Coerce ``value`` to ``float`` and require it lie in ``[0, 1]``."""
    f = float(value)
    if not np.isfinite(f) or f < 0.0 or f > 1.0:
        raise ValueError(f"{name} must be in [0, 1], got {value!r}")
    return f


def amplitude_damping_kraus(gamma: float) -> list[np.ndarray]:
    """Return the two Kraus operators of the amplitude damping channel."""
    g = _check_unit_param("gamma", gamma)
    e0 = np.array([[1.0, 0.0], [0.0, np.sqrt(1.0 - g)]], dtype=np.complex128)
    e1 = np.array([[0.0, np.sqrt(g)], [0.0, 0.0]], dtype=np.complex128)
    return [e0, e1]


def phase_damping_kraus(lambda_param: float) -> list[np.ndarray]:
    """Return the two Kraus operators of the phase damping channel.

    Uses the random-Z form so off-diagonals of rho are scaled by exactly
    ``(1 - lambda)``; the corresponding fidelity for ``|+>`` is ``1 - lambda/2``.
    """
    lam = _check_unit_param("lambda", lambda_param)
    e0 = np.sqrt(1.0 - lam / 2.0) * _IDENTITY_2
    e1 = np.sqrt(lam / 2.0) * _PAULI_Z
    return [e0, e1]


def depolarizing_kraus(p: float) -> list[np.ndarray]:
    """Return the four Kraus operators of the depolarizing channel.

    Uses the Nielsen & Chuang convention so that ``D(rho) = (1-p) rho + p I/2``.
    """
    pp = _check_unit_param("p", p)
    e0 = np.sqrt(max(0.0, 1.0 - 3.0 * pp / 4.0)) * _IDENTITY_2
    e1 = np.sqrt(pp / 4.0) * _PAULI_X
    e2 = np.sqrt(pp / 4.0) * _PAULI_Y
    e3 = np.sqrt(pp / 4.0) * _PAULI_Z
    return [e0, e1, e2, e3]


VALIDITY_TOL = 1e-10
KRAUS_COMPLETENESS_TOL = 1e-10


def apply_kraus_channel(rho: np.ndarray, kraus_ops: list[np.ndarray]) -> np.ndarray:
    """Apply a Kraus channel to a valid density matrix.

    Validates that ``rho`` is square, finite, Hermitian (asymmetry below
    ``ASYMMETRY_TOL``), positive semidefinite (min eigenvalue above
    ``-VALIDITY_TOL``), and has trace 1 (within ``VALIDITY_TOL``). It also
    validates that every Kraus operator is the right shape and finite.
    Returns the post-channel density matrix.
    """
    rho_arr = np.asarray(rho, dtype=np.complex128)
    if rho_arr.ndim != 2 or rho_arr.shape[0] != rho_arr.shape[1]:
        raise ValueError(f"rho must be a square matrix, got shape {rho_arr.shape}")
    if not np.all(np.isfinite(rho_arr)):
        raise ValueError("rho contains non-finite entries")
    if not kraus_ops:
        raise ValueError("kraus_ops must be a non-empty list")

    asym = float(np.linalg.norm(rho_arr - rho_arr.conj().T))
    if asym > ASYMMETRY_TOL:
        raise ValueError(
            f"rho is not Hermitian within tol={ASYMMETRY_TOL}: "
            f"||rho - rho^H||_F = {asym}"
        )
    rho_sym = 0.5 * (rho_arr + rho_arr.conj().T)

    eigs = np.linalg.eigvalsh(rho_sym)
    if float(np.min(eigs)) < -VALIDITY_TOL:
        raise ValueError(
            f"rho is not positive semidefinite within tol={VALIDITY_TOL}: "
            f"min eigenvalue = {float(np.min(eigs))}"
        )
    trace = complex(np.trace(rho_sym))
    if abs(trace - 1.0) > VALIDITY_TOL:
        raise ValueError(
            f"rho does not have trace 1 within tol={VALIDITY_TOL}: trace = {trace}"
        )

    dim = rho_sym.shape[0]
    coerced_ops: list[np.ndarray] = []
    for idx, k in enumerate(kraus_ops):
        k_arr = np.asarray(k, dtype=np.complex128)
        if k_arr.shape != (dim, dim):
            raise ValueError(
                f"Kraus operator {idx} has shape {k_arr.shape}, "
                f"expected {(dim, dim)} to match rho"
            )
        if not np.all(np.isfinite(k_arr)):
            raise ValueError(f"Kraus operator {idx} contains non-finite entries")
        coerced_ops.append(k_arr)

    residual = kraus_completeness_residual(coerced_ops)
    if residual > KRAUS_COMPLETENESS_TOL:
        raise ValueError(
            f"Kraus operator set is not trace-preserving within "
            f"tol={KRAUS_COMPLETENESS_TOL}: ||sum K^dag K - I||_F = {residual}"
        )

    out = np.zeros_like(rho_sym)
    for k_arr in coerced_ops:
        out = out + k_arr @ rho_sym @ k_arr.conj().T
    return out


def kraus_completeness_residual(kraus_ops: list[np.ndarray]) -> float:
    """Return ``||sum_i K_i^dagger K_i - I||_F``.

    A trace-preserving channel has residual ~0 to floating-point tolerance.
    Non-finite Kraus entries raise ``ValueError`` rather than silently
    producing NaN residuals.
    """
    if not kraus_ops:
        raise ValueError("kraus_ops must be a non-empty list")
    first = np.asarray(kraus_ops[0], dtype=np.complex128)
    if first.ndim != 2 or first.shape[0] != first.shape[1]:
        raise ValueError(
            f"Kraus operator 0 must be a square matrix, got shape {first.shape}"
        )
    dim = first.shape[0]
    total = np.zeros((dim, dim), dtype=np.complex128)
    for idx, k in enumerate(kraus_ops):
        k_arr = np.asarray(k, dtype=np.complex128)
        if k_arr.shape != (dim, dim):
            raise ValueError(
                f"Kraus operator {idx} has shape {k_arr.shape}, "
                f"expected {(dim, dim)}"
            )
        if not np.all(np.isfinite(k_arr)):
            raise ValueError(f"Kraus operator {idx} contains non-finite entries")
        total = total + k_arr.conj().T @ k_arr
    return float(np.linalg.norm(total - np.eye(dim, dtype=np.complex128)))
