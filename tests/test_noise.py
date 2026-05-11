"""Tests for Kraus channel construction and application."""

from __future__ import annotations

import numpy as np
import pytest

from quantum_noise_lab.noise import (
    amplitude_damping_kraus,
    apply_kraus_channel,
    depolarizing_kraus,
    kraus_completeness_residual,
    phase_damping_kraus,
)
from quantum_noise_lab.states import density_matrix, ket_one, ket_zero, plus_state


TOL = 1e-12
COMPLETENESS_TOL = 1e-10
PARAM_GRID = [0.0, 0.25, 0.5, 0.75, 1.0]


def _rho(psi):
    return density_matrix(psi)


# ---- amplitude damping --------------------------------------------------


def test_amplitude_damping_at_gamma_zero_is_identity():
    rho = _rho(plus_state())
    out = apply_kraus_channel(rho, amplitude_damping_kraus(0.0))
    np.testing.assert_allclose(out, rho, atol=TOL)


def test_amplitude_damping_at_gamma_one_collapses_to_ground():
    expected = _rho(ket_zero())
    for psi in (ket_zero(), ket_one(), plus_state()):
        out = apply_kraus_channel(_rho(psi), amplitude_damping_kraus(1.0))
        np.testing.assert_allclose(out, expected, atol=TOL)


@pytest.mark.parametrize("gamma", PARAM_GRID)
def test_amplitude_damping_preserves_trace(gamma):
    out = apply_kraus_channel(_rho(plus_state()), amplitude_damping_kraus(gamma))
    assert abs(complex(np.trace(out)) - 1.0) <= 1e-12


@pytest.mark.parametrize("gamma", PARAM_GRID)
def test_amplitude_damping_kraus_completeness(gamma):
    res = kraus_completeness_residual(amplitude_damping_kraus(gamma))
    assert res < COMPLETENESS_TOL


@pytest.mark.parametrize("gamma", [-0.1, 1.1, float("nan"), float("inf")])
def test_amplitude_damping_rejects_out_of_range(gamma):
    with pytest.raises(ValueError):
        amplitude_damping_kraus(gamma)


# ---- phase damping ------------------------------------------------------


def test_phase_damping_at_lambda_zero_is_identity():
    rho = _rho(plus_state())
    out = apply_kraus_channel(rho, phase_damping_kraus(0.0))
    np.testing.assert_allclose(out, rho, atol=TOL)


def test_phase_damping_at_lambda_one_kills_off_diagonals():
    rho = _rho(plus_state())
    out = apply_kraus_channel(rho, phase_damping_kraus(1.0))
    expected = np.array([[0.5, 0.0], [0.0, 0.5]], dtype=np.complex128)
    np.testing.assert_allclose(out, expected, atol=TOL)


def test_phase_damping_preserves_populations():
    rho = _rho(plus_state())
    for lam in PARAM_GRID:
        out = apply_kraus_channel(rho, phase_damping_kraus(lam))
        assert abs(out[0, 0] - 0.5) <= TOL
        assert abs(out[1, 1] - 0.5) <= TOL


@pytest.mark.parametrize("lam", PARAM_GRID)
def test_phase_damping_kraus_completeness(lam):
    assert kraus_completeness_residual(phase_damping_kraus(lam)) < COMPLETENESS_TOL


@pytest.mark.parametrize("lam", [-0.0001, 1.0001])
def test_phase_damping_rejects_out_of_range(lam):
    with pytest.raises(ValueError):
        phase_damping_kraus(lam)


# ---- depolarizing -------------------------------------------------------


def test_depolarizing_at_p_zero_is_identity():
    rho = _rho(plus_state())
    out = apply_kraus_channel(rho, depolarizing_kraus(0.0))
    np.testing.assert_allclose(out, rho, atol=TOL)


def test_depolarizing_at_p_one_maps_any_state_to_maximally_mixed():
    expected = 0.5 * np.eye(2, dtype=np.complex128)
    for psi in (ket_zero(), ket_one(), plus_state()):
        out = apply_kraus_channel(_rho(psi), depolarizing_kraus(1.0))
        np.testing.assert_allclose(out, expected, atol=TOL)


@pytest.mark.parametrize("p", [0.25, 0.5, 0.75])
def test_depolarizing_matches_convex_combination(p):
    """``D(rho) = (1-p) rho + p I/2`` for any input state."""
    rho = _rho(plus_state())
    out = apply_kraus_channel(rho, depolarizing_kraus(p))
    expected = (1.0 - p) * rho + p * 0.5 * np.eye(2, dtype=np.complex128)
    np.testing.assert_allclose(out, expected, atol=1e-12)


@pytest.mark.parametrize("p", PARAM_GRID)
def test_depolarizing_kraus_completeness(p):
    assert kraus_completeness_residual(depolarizing_kraus(p)) < COMPLETENESS_TOL


@pytest.mark.parametrize("p", [-1e-9, 1.0 + 1e-9])
def test_depolarizing_rejects_out_of_range(p):
    with pytest.raises(ValueError):
        depolarizing_kraus(p)


# ---- apply_kraus_channel error paths ------------------------------------


def test_apply_kraus_channel_rejects_non_square_rho():
    with pytest.raises(ValueError):
        apply_kraus_channel(np.zeros((2, 3), dtype=np.complex128), amplitude_damping_kraus(0.5))


def test_apply_kraus_channel_rejects_non_hermitian_rho():
    bad = np.array([[1.0, 1.0], [0.0, 0.0]], dtype=np.complex128)
    with pytest.raises(ValueError):
        apply_kraus_channel(bad, amplitude_damping_kraus(0.5))


def test_apply_kraus_channel_rejects_empty_kraus_list():
    rho = _rho(plus_state())
    with pytest.raises(ValueError):
        apply_kraus_channel(rho, [])


def test_apply_kraus_channel_rejects_dimension_mismatch():
    rho = _rho(plus_state())
    bad_kraus = [np.eye(3, dtype=np.complex128)]
    with pytest.raises(ValueError):
        apply_kraus_channel(rho, bad_kraus)


def test_apply_kraus_channel_rejects_non_finite_rho():
    nan_rho = np.array([[float("nan"), 0.0], [0.0, 1.0]], dtype=np.complex128)
    with pytest.raises(ValueError):
        apply_kraus_channel(nan_rho, amplitude_damping_kraus(0.5))
    inf_rho = np.array([[float("inf"), 0.0], [0.0, 0.0]], dtype=np.complex128)
    with pytest.raises(ValueError):
        apply_kraus_channel(inf_rho, amplitude_damping_kraus(0.5))


def test_apply_kraus_channel_rejects_non_psd_rho():
    bad = np.array([[2.0, 0.0], [0.0, -1.0]], dtype=np.complex128)
    with pytest.raises(ValueError):
        apply_kraus_channel(bad, amplitude_damping_kraus(0.5))


def test_apply_kraus_channel_rejects_wrong_trace():
    bad = np.array([[0.5, 0.0], [0.0, 0.0]], dtype=np.complex128)  # trace = 0.5
    with pytest.raises(ValueError):
        apply_kraus_channel(bad, amplitude_damping_kraus(0.5))


def test_apply_kraus_channel_rejects_non_finite_kraus_op():
    rho = _rho(plus_state())
    bad_kraus = [
        np.eye(2, dtype=np.complex128),
        np.array([[float("nan"), 0.0], [0.0, 0.0]], dtype=np.complex128),
    ]
    with pytest.raises(ValueError):
        apply_kraus_channel(rho, bad_kraus)


def test_apply_kraus_channel_rejects_incomplete_kraus_set():
    """A single operator 0.5 * I violates completeness; channel must refuse."""
    rho = _rho(plus_state())
    bad_kraus = [0.5 * np.eye(2, dtype=np.complex128)]
    with pytest.raises(ValueError):
        apply_kraus_channel(rho, bad_kraus)


def test_apply_kraus_channel_rejects_trace_amplifying_kraus_set():
    rho = _rho(plus_state())
    bad_kraus = [np.sqrt(2.0) * np.eye(2, dtype=np.complex128)]
    with pytest.raises(ValueError):
        apply_kraus_channel(rho, bad_kraus)


def test_kraus_completeness_residual_rejects_non_finite():
    bad_kraus = [
        np.eye(2, dtype=np.complex128),
        np.array([[float("inf"), 0.0], [0.0, 0.0]], dtype=np.complex128),
    ]
    with pytest.raises(ValueError):
        kraus_completeness_residual(bad_kraus)


def test_kraus_completeness_residual_rejects_non_square_op():
    bad_kraus = [np.zeros((2, 3), dtype=np.complex128)]
    with pytest.raises(ValueError):
        kraus_completeness_residual(bad_kraus)
