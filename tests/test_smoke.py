"""Clean-clone smoke test: exercises the public API end-to-end."""

from __future__ import annotations

import numpy as np

import quantum_noise_lab as qnl


def test_public_api_is_exposed():
    expected = {
        "basis_state",
        "ket_zero",
        "ket_one",
        "plus_state",
        "custom_qubit_state",
        "density_matrix",
        "tensor_product",
        "amplitude_damping_kraus",
        "phase_damping_kraus",
        "depolarizing_kraus",
        "apply_kraus_channel",
        "kraus_completeness_residual",
        "fidelity",
        "purity",
        "eigenvalues",
        "trace_value",
        "is_hermitian",
        "is_positive_semidefinite",
        "is_valid_density_matrix",
        "analytical_amplitude_density",
        "analytical_phase_density",
        "analytical_amplitude_fidelity",
        "analytical_phase_fidelity",
        "repetition_success_unprotected",
        "repetition_success_protected",
        "sweep_noise",
        "sweep_metric",
    }
    assert expected.issubset(set(dir(qnl)))


def test_end_to_end_amplitude_damping_sweep():
    rho_initial = qnl.density_matrix(qnl.plus_state())
    grid = np.linspace(0.0, 1.0, 5)
    fidelities = qnl.sweep_metric(
        qnl.amplitude_damping_kraus,
        rho_initial,
        qnl.plus_state(),
        qnl.fidelity,
        grid,
    )
    assert fidelities.shape == grid.shape
    assert abs(fidelities[0] - 1.0) <= 1e-12
    assert abs(fidelities[-1] - 0.5) <= 1e-12  # F_AD(1) = (1 + 0)/2


def test_end_to_end_purity_sweep():
    rho_initial = qnl.density_matrix(qnl.plus_state())
    grid = np.array([0.0, 0.5, 1.0])
    rhos = qnl.sweep_noise(qnl.depolarizing_kraus, rho_initial, grid)
    purities = np.array([qnl.purity(r) for r in rhos])
    assert abs(purities[0] - 1.0) <= 1e-12
    assert abs(purities[-1] - 0.5) <= 1e-12
    assert purities[0] > purities[1] > purities[-1]


def test_qec_intuition_curve_endpoints():
    assert qnl.repetition_success_unprotected(0.0) == 1.0
    assert qnl.repetition_success_protected(0.0) == 1.0
    assert qnl.repetition_success_unprotected(1.0) == 0.0
    assert qnl.repetition_success_protected(1.0) == 0.0
