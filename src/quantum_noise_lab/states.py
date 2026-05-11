"""State construction for the single-qubit teaching engine.

Every public function returns NumPy arrays of dtype ``complex128`` (for kets
and density matrices). Inputs are validated; out-of-range or malformed
inputs raise ``ValueError``.
"""

from __future__ import annotations

import numpy as np

NORMALIZATION_TOL = 1e-10


def basis_state(index: int, dimension: int = 2) -> np.ndarray:
    """Return the computational basis ket ``|index>`` in dimension ``dimension``."""
    if dimension < 1:
        raise ValueError(f"dimension must be >= 1, got {dimension}")
    if not (0 <= index < dimension):
        raise ValueError(f"basis index {index} out of range [0, {dimension})")
    psi = np.zeros(dimension, dtype=np.complex128)
    psi[index] = 1.0 + 0.0j
    return psi


def ket_zero() -> np.ndarray:
    """Return the qubit ket ``|0>``."""
    return basis_state(0, 2)


def ket_one() -> np.ndarray:
    """Return the qubit ket ``|1>``."""
    return basis_state(1, 2)


def plus_state() -> np.ndarray:
    """Return ``|+> = (|0> + |1>) / sqrt(2)``."""
    return np.array([1.0, 1.0], dtype=np.complex128) / np.sqrt(2.0)


def custom_qubit_state(theta: float, phi: float) -> np.ndarray:
    """Return ``|psi> = cos(theta/2)|0> + e^{i phi} sin(theta/2)|1>``.

    Normalized by construction for any FINITE real ``theta``, ``phi``.
    Non-finite inputs (``nan``, ``inf``) are rejected with ``ValueError``.
    """
    theta_f = float(theta)
    phi_f = float(phi)
    if not (np.isfinite(theta_f) and np.isfinite(phi_f)):
        raise ValueError(f"theta and phi must be finite, got theta={theta!r}, phi={phi!r}")
    return np.array(
        [np.cos(theta_f / 2.0), np.exp(1j * phi_f) * np.sin(theta_f / 2.0)],
        dtype=np.complex128,
    )


def density_matrix(psi: np.ndarray, atol: float = NORMALIZATION_TOL) -> np.ndarray:
    """Return ``|psi><psi|`` for a normalized, finite ket.

    Raises ``ValueError`` if ``psi`` is not 1-D, contains non-finite entries,
    or is not normalized within ``atol``.
    """
    psi_arr = np.asarray(psi, dtype=np.complex128)
    if psi_arr.ndim != 1:
        raise ValueError(f"state vector must be 1-D, got shape {psi_arr.shape}")
    if not np.all(np.isfinite(psi_arr)):
        raise ValueError("state vector contains non-finite entries")
    norm = float(np.linalg.norm(psi_arr))
    if not np.isfinite(norm):
        raise ValueError(f"state vector norm is not finite: {norm}")
    if norm == 0.0:
        raise ValueError("state vector is zero")
    if abs(norm - 1.0) > atol:
        raise ValueError(
            f"state vector not normalized within tol={atol}: ||psi|| = {norm}"
        )
    return np.outer(psi_arr, np.conjugate(psi_arr))


def tensor_product(*arrays: np.ndarray) -> np.ndarray:
    """Return the tensor (Kronecker) product of one or more vectors / matrices."""
    if not arrays:
        raise ValueError("tensor_product requires at least one input")
    result = np.asarray(arrays[0], dtype=np.complex128)
    for arr in arrays[1:]:
        result = np.kron(result, np.asarray(arr, dtype=np.complex128))
    return result
