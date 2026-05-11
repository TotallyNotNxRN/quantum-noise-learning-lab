"""Density-matrix metrics: fidelity, purity, eigenvalues, and validity checks.

Conventions (locked):

* Fidelity is the squared Uhlmann fidelity:
      F(rho, sigma) = ( Tr sqrt( sqrt(rho) sigma sqrt(rho) ) )^2.
  For a pure reference ``ref = |psi><psi|`` this reduces to the inner product
  ``F(rho, |psi><psi|) = <psi| rho |psi>``, used as a fast path.

* Eigenvalues are computed via ``scipy.linalg.eigh`` after Hermitian
  symmetrization. Tiny negative eigenvalues from floating-point error are
  clipped to zero only for fidelity and reporting, never for validity checks.

* Validity tolerance defaults to ``1e-10`` and is exposed as a kwarg.
"""

from __future__ import annotations

import numpy as np
from scipy.linalg import eigh

DEFAULT_TOL = 1e-10
PURE_EIGENVALUE_TOL = 1e-9
CLIP_TOL = 1e-9
HERMITIAN_INPUT_TOL = 1e-8


def _symmetrize(rho: np.ndarray) -> np.ndarray:
    """Return ``(rho + rho^H) / 2`` as a complex-128 NumPy array."""
    arr = np.asarray(rho, dtype=np.complex128)
    return 0.5 * (arr + arr.conj().T)


def _require_square_2d(rho: np.ndarray, name: str = "rho") -> np.ndarray:
    arr = np.asarray(rho, dtype=np.complex128)
    if arr.ndim != 2 or arr.shape[0] != arr.shape[1]:
        raise ValueError(f"{name} must be a square 2-D matrix, got shape {arr.shape}")
    return arr


def trace_value(rho: np.ndarray) -> complex:
    """Return ``Tr(rho)`` as a Python ``complex``."""
    arr = _require_square_2d(rho)
    return complex(np.trace(arr))


def is_hermitian(rho: np.ndarray, atol: float = DEFAULT_TOL) -> bool:
    """Return ``True`` if ``||rho - rho^H||_F <= atol``."""
    arr = _require_square_2d(rho)
    return bool(np.linalg.norm(arr - arr.conj().T) <= atol)


def eigenvalues(rho: np.ndarray) -> np.ndarray:
    """Return the eigenvalues of ``rho`` (Hermitian-symmetrized) as a real ``np.ndarray``."""
    sym = _symmetrize(_require_square_2d(rho))
    return eigh(sym, eigvals_only=True).astype(np.float64)


def is_positive_semidefinite(rho: np.ndarray, atol: float = DEFAULT_TOL) -> bool:
    """Return ``True`` if every eigenvalue of ``rho`` is ``>= -atol``."""
    return bool(np.min(eigenvalues(rho)) >= -atol)


def is_valid_density_matrix(rho: np.ndarray, atol: float = DEFAULT_TOL) -> bool:
    """Return ``True`` if ``rho`` is square, Hermitian, PSD, and trace-1 within ``atol``."""
    arr = np.asarray(rho, dtype=np.complex128)
    if arr.ndim != 2 or arr.shape[0] != arr.shape[1]:
        return False
    if not is_hermitian(arr, atol=atol):
        return False
    if not is_positive_semidefinite(arr, atol=atol):
        return False
    if abs(complex(np.trace(arr)) - 1.0) > atol:
        return False
    return True


def purity(rho: np.ndarray) -> float:
    """Return ``Tr(rho^2)`` as a real ``float``."""
    sym = _symmetrize(_require_square_2d(rho))
    return float(np.real(np.trace(sym @ sym)))


def _matrix_sqrt_psd(rho_sym: np.ndarray) -> np.ndarray:
    """Hermitian PSD square root via eigendecomposition."""
    eigs, vecs = eigh(rho_sym)
    eigs_clipped = np.clip(eigs, 0.0, None)
    return vecs @ np.diag(np.sqrt(eigs_clipped)) @ vecs.conj().T


def _validate_density_matrix_strict(
    arr: np.ndarray, label: str, atol: float = DEFAULT_TOL
) -> np.ndarray:
    """Validate ``arr`` is a density matrix and return its symmetrized form.

    Raises ``ValueError`` if not finite, asymmetric beyond ``HERMITIAN_INPUT_TOL``,
    not PSD within ``atol``, or trace differs from 1 by more than ``atol``.
    """
    if not np.all(np.isfinite(arr)):
        raise ValueError(f"{label} contains non-finite entries")
    asym = float(np.linalg.norm(arr - arr.conj().T))
    if asym > HERMITIAN_INPUT_TOL:
        raise ValueError(
            f"{label} is not Hermitian within tol={HERMITIAN_INPUT_TOL}: "
            f"||{label} - {label}^H||_F = {asym}"
        )
    sym = 0.5 * (arr + arr.conj().T)
    eigs = eigh(sym, eigvals_only=True)
    if float(np.min(eigs)) < -atol:
        raise ValueError(
            f"{label} is not positive semidefinite within tol={atol}: "
            f"min eigenvalue = {float(np.min(eigs))}"
        )
    tr = complex(np.trace(sym))
    if abs(tr - 1.0) > atol:
        raise ValueError(
            f"{label} trace = {tr} is not 1 within tol={atol}"
        )
    return sym


def _safe_clip_unit(value: float, label: str) -> float:
    """Clip ``value`` to ``[0, 1]`` if it is at most ``CLIP_TOL`` outside; else raise."""
    if not np.isfinite(value):
        raise ValueError(f"{label} is non-finite: {value}")
    if value < -CLIP_TOL or value > 1.0 + CLIP_TOL:
        raise ValueError(
            f"{label} = {value} lies outside [0, 1] beyond tol={CLIP_TOL}; "
            f"check that inputs are valid density matrices"
        )
    return float(np.clip(value, 0.0, 1.0))


def fidelity(rho: np.ndarray, reference: np.ndarray) -> float:
    """Squared Uhlmann fidelity ``F(rho, reference)``.

    Validates inputs (finite, correct shapes, normalized ket reference,
    Hermitian/PSD matrix reference) and returns a value clipped to ``[0, 1]``
    only within ``CLIP_TOL``. Larger excursions raise ``ValueError`` rather
    than masking corruption.
    """
    rho_arr = _require_square_2d(rho)
    rho_sym = _validate_density_matrix_strict(rho_arr, "rho")

    ref_arr = np.asarray(reference, dtype=np.complex128)
    if not np.all(np.isfinite(ref_arr)):
        raise ValueError("reference contains non-finite entries")

    if ref_arr.ndim == 1:
        if ref_arr.shape[0] != rho_sym.shape[0]:
            raise ValueError(
                f"shape mismatch: rho is {rho_sym.shape}, reference ket is {ref_arr.shape}"
            )
        ref_norm = float(np.linalg.norm(ref_arr))
        if abs(ref_norm - 1.0) > DEFAULT_TOL:
            raise ValueError(
                f"reference ket is not normalized within tol={DEFAULT_TOL}: ||ref|| = {ref_norm}"
            )
        val = float(np.real(np.conjugate(ref_arr) @ rho_sym @ ref_arr))
        return _safe_clip_unit(val, "fidelity (pure ket)")

    if ref_arr.ndim == 2:
        if ref_arr.shape != rho_sym.shape:
            raise ValueError(
                f"shape mismatch: rho is {rho_sym.shape}, reference matrix is {ref_arr.shape}"
            )
        ref_sym = _validate_density_matrix_strict(ref_arr, "reference")
        ref_eigs = eigh(ref_sym, eigvals_only=True)
        is_pure = (
            float(np.max(ref_eigs)) > 1.0 - PURE_EIGENVALUE_TOL
            and int(np.sum(ref_eigs > PURE_EIGENVALUE_TOL)) == 1
        )
        if is_pure:
            val = float(np.real(np.trace(rho_sym @ ref_sym)))
            return _safe_clip_unit(val, "fidelity (pure rho reference)")

        sqrt_rho = _matrix_sqrt_psd(rho_sym)
        inner = sqrt_rho @ ref_sym @ sqrt_rho
        inner = 0.5 * (inner + inner.conj().T)
        inner_eigs = np.clip(eigh(inner, eigvals_only=True), 0.0, None)
        val = float(np.sum(np.sqrt(inner_eigs))) ** 2
        return _safe_clip_unit(val, "fidelity (general)")

    raise ValueError(
        f"reference must be a 1-D ket or a 2-D matrix matching rho, "
        f"got ndim={ref_arr.ndim}"
    )
