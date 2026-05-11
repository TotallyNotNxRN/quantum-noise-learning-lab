"""Tests for state construction and density-matrix helpers."""

from __future__ import annotations

import numpy as np
import pytest

from quantum_noise_lab.states import (
    basis_state,
    custom_qubit_state,
    density_matrix,
    ket_one,
    ket_zero,
    plus_state,
    tensor_product,
)


TOL = 1e-12


def _is_normalized(psi: np.ndarray) -> bool:
    return abs(float(np.linalg.norm(psi)) - 1.0) <= TOL


def test_ket_zero_is_normalized_and_first_basis():
    psi = ket_zero()
    assert psi.shape == (2,)
    assert psi.dtype == np.complex128
    assert _is_normalized(psi)
    assert psi[0] == 1.0 + 0.0j and psi[1] == 0.0 + 0.0j


def test_ket_one_is_normalized_and_second_basis():
    psi = ket_one()
    assert _is_normalized(psi)
    assert psi[0] == 0.0 + 0.0j and psi[1] == 1.0 + 0.0j


def test_plus_state_is_normalized_and_equal_amplitudes():
    psi = plus_state()
    assert _is_normalized(psi)
    inv_sqrt2 = 1.0 / np.sqrt(2.0)
    np.testing.assert_allclose(psi, np.array([inv_sqrt2, inv_sqrt2]), atol=TOL)


@pytest.mark.parametrize(
    "theta,phi",
    [
        (0.0, 0.0),
        (np.pi, 0.0),
        (np.pi / 2.0, 0.0),
        (np.pi / 2.0, np.pi / 2.0),
        (1.234, -2.5),
    ],
)
def test_custom_qubit_state_is_normalized(theta, phi):
    psi = custom_qubit_state(theta, phi)
    assert _is_normalized(psi)


def test_custom_qubit_state_matches_ket_zero_at_theta_zero():
    np.testing.assert_allclose(custom_qubit_state(0.0, 0.0), ket_zero(), atol=TOL)


def test_custom_qubit_state_matches_ket_one_at_theta_pi():
    psi = custom_qubit_state(np.pi, 0.0)
    np.testing.assert_allclose(psi, ket_one(), atol=TOL)


def test_basis_state_validates_index_and_dimension():
    with pytest.raises(ValueError):
        basis_state(2, 2)
    with pytest.raises(ValueError):
        basis_state(-1, 2)
    with pytest.raises(ValueError):
        basis_state(0, 0)


def test_density_matrix_trace_is_one():
    for psi in (ket_zero(), ket_one(), plus_state(), custom_qubit_state(1.1, -0.3)):
        rho = density_matrix(psi)
        assert rho.shape == (2, 2)
        assert rho.dtype == np.complex128
        assert abs(complex(np.trace(rho)) - 1.0) <= TOL


def test_density_matrix_is_hermitian():
    for psi in (ket_zero(), ket_one(), plus_state(), custom_qubit_state(0.7, 1.3)):
        rho = density_matrix(psi)
        assert np.linalg.norm(rho - rho.conj().T) <= TOL


def test_density_matrix_is_psd():
    for psi in (ket_zero(), ket_one(), plus_state(), custom_qubit_state(2.1, 0.8)):
        rho = density_matrix(psi)
        eigs = np.linalg.eigvalsh(0.5 * (rho + rho.conj().T))
        assert float(np.min(eigs)) >= -TOL


def test_density_matrix_rejects_non_normalized_input():
    with pytest.raises(ValueError):
        density_matrix(np.array([2.0, 0.0], dtype=np.complex128))


def test_density_matrix_rejects_zero_vector():
    with pytest.raises(ValueError):
        density_matrix(np.array([0.0, 0.0], dtype=np.complex128))


def test_density_matrix_rejects_2d_input():
    with pytest.raises(ValueError):
        density_matrix(np.eye(2, dtype=np.complex128))


def test_tensor_product_two_qubits():
    expected = np.array([1.0, 0.0, 0.0, 0.0], dtype=np.complex128)
    np.testing.assert_allclose(tensor_product(ket_zero(), ket_zero()), expected, atol=TOL)


def test_tensor_product_dimension_grows_multiplicatively():
    out = tensor_product(ket_zero(), ket_one(), plus_state())
    assert out.shape == (8,)
    assert _is_normalized(out)


def test_tensor_product_requires_input():
    with pytest.raises(ValueError):
        tensor_product()


@pytest.mark.parametrize(
    "theta,phi",
    [
        (float("nan"), 0.0),
        (float("inf"), 0.0),
        (0.0, float("nan")),
        (0.0, float("inf")),
        (-float("inf"), 0.0),
    ],
)
def test_custom_qubit_state_rejects_non_finite(theta, phi):
    with pytest.raises(ValueError):
        custom_qubit_state(theta, phi)


def test_density_matrix_rejects_non_finite_entries():
    bad = np.array([float("nan") + 0.0j, 0.0 + 0.0j], dtype=np.complex128)
    with pytest.raises(ValueError):
        density_matrix(bad)
    bad_inf = np.array([float("inf") + 0.0j, 0.0 + 0.0j], dtype=np.complex128)
    with pytest.raises(ValueError):
        density_matrix(bad_inf)
