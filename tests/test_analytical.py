"""Validation Lab tests: numerical channel output matches closed-form expressions."""

from __future__ import annotations

import numpy as np
import pytest

from quantum_noise_lab.analytical import (
    analytical_amplitude_density,
    analytical_amplitude_fidelity,
    analytical_phase_density,
    analytical_phase_fidelity,
)
from quantum_noise_lab.metrics import fidelity
from quantum_noise_lab.noise import (
    amplitude_damping_kraus,
    apply_kraus_channel,
    phase_damping_kraus,
)
from quantum_noise_lab.states import density_matrix, plus_state


AGREEMENT_TOL = 1e-12
GRID = np.linspace(0.0, 1.0, 11)


@pytest.mark.parametrize("gamma", GRID)
def test_simulated_amplitude_damping_matches_analytical_density(gamma):
    rho_initial = density_matrix(plus_state())
    sim = apply_kraus_channel(rho_initial, amplitude_damping_kraus(float(gamma)))
    closed = analytical_amplitude_density(float(gamma))
    np.testing.assert_allclose(sim, closed, atol=AGREEMENT_TOL)


@pytest.mark.parametrize("lam", GRID)
def test_simulated_phase_damping_matches_analytical_density(lam):
    rho_initial = density_matrix(plus_state())
    sim = apply_kraus_channel(rho_initial, phase_damping_kraus(float(lam)))
    closed = analytical_phase_density(float(lam))
    np.testing.assert_allclose(sim, closed, atol=AGREEMENT_TOL)


@pytest.mark.parametrize("gamma", GRID)
def test_amplitude_fidelity_formula_matches_numeric(gamma):
    rho_initial = density_matrix(plus_state())
    rho_t = apply_kraus_channel(rho_initial, amplitude_damping_kraus(float(gamma)))
    f_numeric = fidelity(rho_t, plus_state())
    f_closed = analytical_amplitude_fidelity(float(gamma))
    assert abs(f_numeric - f_closed) <= 1e-12


@pytest.mark.parametrize("lam", GRID)
def test_phase_fidelity_formula_matches_numeric(lam):
    rho_initial = density_matrix(plus_state())
    rho_t = apply_kraus_channel(rho_initial, phase_damping_kraus(float(lam)))
    f_numeric = fidelity(rho_t, plus_state())
    f_closed = analytical_phase_fidelity(float(lam))
    assert abs(f_numeric - f_closed) <= 1e-12


def test_analytical_amplitude_density_endpoints():
    np.testing.assert_allclose(
        analytical_amplitude_density(0.0),
        np.array([[0.5, 0.5], [0.5, 0.5]], dtype=np.complex128),
        atol=AGREEMENT_TOL,
    )
    np.testing.assert_allclose(
        analytical_amplitude_density(1.0),
        np.array([[1.0, 0.0], [0.0, 0.0]], dtype=np.complex128),
        atol=AGREEMENT_TOL,
    )


def test_analytical_phase_density_endpoints():
    np.testing.assert_allclose(
        analytical_phase_density(0.0),
        np.array([[0.5, 0.5], [0.5, 0.5]], dtype=np.complex128),
        atol=AGREEMENT_TOL,
    )
    np.testing.assert_allclose(
        analytical_phase_density(1.0),
        np.array([[0.5, 0.0], [0.0, 0.5]], dtype=np.complex128),
        atol=AGREEMENT_TOL,
    )


@pytest.mark.parametrize("bad", [-0.01, 1.01])
def test_analytical_rejects_out_of_range(bad):
    with pytest.raises(ValueError):
        analytical_amplitude_density(bad)
    with pytest.raises(ValueError):
        analytical_phase_density(bad)
    with pytest.raises(ValueError):
        analytical_amplitude_fidelity(bad)
    with pytest.raises(ValueError):
        analytical_phase_fidelity(bad)
