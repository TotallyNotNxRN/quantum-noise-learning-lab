"""Tests for fidelity, purity, eigenvalues, and validity checks."""

from __future__ import annotations

import numpy as np
import pytest

from quantum_noise_lab.metrics import (
    eigenvalues,
    fidelity,
    is_hermitian,
    is_positive_semidefinite,
    is_valid_density_matrix,
    purity,
    trace_value,
)
from quantum_noise_lab.noise import (
    amplitude_damping_kraus,
    apply_kraus_channel,
    depolarizing_kraus,
    phase_damping_kraus,
)
from quantum_noise_lab.states import density_matrix, ket_one, ket_zero, plus_state


TOL = 1e-12
PARAM_GRID = [0.0, 0.25, 0.5, 0.75, 1.0]


def _rho(psi):
    return density_matrix(psi)


def test_pure_state_fidelity_with_self_is_one():
    for psi in (ket_zero(), ket_one(), plus_state()):
        assert abs(fidelity(_rho(psi), _rho(psi)) - 1.0) <= TOL


def test_orthogonal_pure_states_have_zero_fidelity():
    assert fidelity(_rho(ket_zero()), _rho(ket_one())) <= TOL


def test_fidelity_against_pure_ket_matches_against_pure_density_matrix():
    for psi in (ket_zero(), plus_state()):
        rho = _rho(plus_state())
        f_ket = fidelity(rho, psi)
        f_dm = fidelity(rho, density_matrix(psi))
        assert abs(f_ket - f_dm) <= 1e-12


@pytest.mark.parametrize(
    "channel_fn",
    [amplitude_damping_kraus, phase_damping_kraus, depolarizing_kraus],
)
@pytest.mark.parametrize("p", PARAM_GRID)
def test_fidelity_in_unit_interval_for_all_channels(channel_fn, p):
    rho = apply_kraus_channel(_rho(plus_state()), channel_fn(p))
    f = fidelity(rho, plus_state())
    assert 0.0 - 1e-12 <= f <= 1.0 + 1e-12


def test_purity_of_pure_state_is_one():
    for psi in (ket_zero(), ket_one(), plus_state()):
        assert abs(purity(_rho(psi)) - 1.0) <= TOL


def test_purity_of_maximally_mixed_state_is_one_over_d():
    rho = 0.5 * np.eye(2, dtype=np.complex128)
    assert abs(purity(rho) - 0.5) <= TOL


@pytest.mark.parametrize(
    "channel_fn",
    [amplitude_damping_kraus, phase_damping_kraus, depolarizing_kraus],
)
@pytest.mark.parametrize("p", PARAM_GRID)
def test_purity_in_bounds_for_all_channels(channel_fn, p):
    rho = apply_kraus_channel(_rho(plus_state()), channel_fn(p))
    pur = purity(rho)
    assert 0.5 - 1e-12 <= pur <= 1.0 + 1e-12


def test_eigenvalues_of_pure_state_are_zero_and_one():
    eigs = eigenvalues(_rho(plus_state()))
    np.testing.assert_allclose(np.sort(eigs), [0.0, 1.0], atol=1e-12)


def test_eigenvalues_sum_to_trace_for_density_matrix():
    rho = _rho(plus_state())
    assert abs(float(np.sum(eigenvalues(rho))) - 1.0) <= TOL


def test_eigenvalues_real_and_in_unit_interval_after_channel():
    for channel in (
        amplitude_damping_kraus(0.3),
        phase_damping_kraus(0.7),
        depolarizing_kraus(0.5),
    ):
        rho = apply_kraus_channel(_rho(plus_state()), channel)
        eigs = eigenvalues(rho)
        assert eigs.dtype == np.float64
        assert float(np.min(eigs)) >= -1e-12
        assert float(np.max(eigs)) <= 1.0 + 1e-12


def test_trace_value_of_pure_state_is_one():
    val = trace_value(_rho(plus_state()))
    assert abs(val - 1.0) <= TOL


def test_is_hermitian_accepts_hermitian_and_rejects_non_hermitian():
    assert is_hermitian(_rho(plus_state()))
    bad = np.array([[1.0, 1.0], [0.0, 0.0]], dtype=np.complex128)
    assert not is_hermitian(bad)


def test_is_psd_rejects_negative_eigenvalues():
    bad = np.array([[2.0, 0.0], [0.0, -1.0]], dtype=np.complex128)
    assert not is_positive_semidefinite(bad)


def test_is_valid_density_matrix_accepts_pure_state():
    assert is_valid_density_matrix(_rho(plus_state()))


def test_is_valid_density_matrix_rejects_wrong_trace():
    rho = _rho(plus_state()) * 1.5
    assert not is_valid_density_matrix(rho)


def test_is_valid_density_matrix_rejects_non_square():
    assert not is_valid_density_matrix(np.zeros((2, 3), dtype=np.complex128))


def test_is_valid_density_matrix_rejects_non_hermitian():
    bad = np.array([[0.5, 0.5], [0.0, 0.5]], dtype=np.complex128)
    assert not is_valid_density_matrix(bad)


@pytest.mark.parametrize(
    "channel_fn",
    [amplitude_damping_kraus, phase_damping_kraus, depolarizing_kraus],
)
@pytest.mark.parametrize("p", PARAM_GRID)
def test_trace_preserved_under_channels(channel_fn, p):
    rho = apply_kraus_channel(_rho(plus_state()), channel_fn(p))
    assert abs(complex(np.trace(rho)) - 1.0) <= 1e-12


def test_fidelity_against_mixed_reference_uses_general_path():
    rho = _rho(plus_state())
    sigma = 0.5 * np.eye(2, dtype=np.complex128)
    f = fidelity(rho, sigma)
    # F(|+><+|, I/2) = <+| I/2 |+> = 1/2
    assert abs(f - 0.5) <= 1e-10


def test_fidelity_rejects_non_finite_rho():
    bad = np.array([[float("nan"), 0.0], [0.0, 1.0]], dtype=np.complex128)
    with pytest.raises(ValueError):
        fidelity(bad, plus_state())


def test_fidelity_rejects_non_normalized_ket_reference():
    rho = _rho(plus_state())
    bad_ket = np.array([2.0, 0.0], dtype=np.complex128)
    with pytest.raises(ValueError):
        fidelity(rho, bad_ket)


def test_fidelity_rejects_non_finite_reference():
    rho = _rho(plus_state())
    bad = np.array([float("nan") + 0.0j, 0.0 + 0.0j], dtype=np.complex128)
    with pytest.raises(ValueError):
        fidelity(rho, bad)


def test_fidelity_rejects_non_psd_reference_matrix():
    rho = _rho(plus_state())
    bad_ref = np.array([[2.0, 0.0], [0.0, -1.0]], dtype=np.complex128)
    with pytest.raises(ValueError):
        fidelity(rho, bad_ref)


def test_fidelity_raises_when_rho_trace_too_high():
    rho = _rho(plus_state()) * 1.5  # trace 1.5, far outside CLIP_TOL
    with pytest.raises(ValueError):
        fidelity(rho, plus_state())


def test_fidelity_rejects_non_hermitian_rho():
    bad = np.array([[0.5, 0.5], [0.0, 0.5]], dtype=np.complex128)
    with pytest.raises(ValueError):
        fidelity(bad, plus_state())


def test_fidelity_rejects_non_psd_rho():
    bad = np.array([[2.0, 0.0], [0.0, -1.0]], dtype=np.complex128)
    with pytest.raises(ValueError):
        fidelity(bad, plus_state())


def test_fidelity_rejects_non_hermitian_matrix_reference():
    rho = _rho(plus_state())
    bad_ref = np.array([[0.5, 0.5], [0.0, 0.5]], dtype=np.complex128)
    with pytest.raises(ValueError):
        fidelity(rho, bad_ref)


def test_fidelity_rejects_wrong_trace_matrix_reference():
    rho = _rho(plus_state())
    bad_ref = 2.0 * np.array([[0.5, 0.0], [0.0, 0.5]], dtype=np.complex128)  # trace 2
    with pytest.raises(ValueError):
        fidelity(rho, bad_ref)
