"""Quantum Noise Learning Lab — single-qubit decoherence simulator.

The package exposes a small, deliberate scientific API used by both the
Streamlit interface and the test suite. UI and visualization libraries are
not imported here; the engine is intended to be importable in any
plain-Python environment with NumPy and SciPy.
"""

from .states import (
    basis_state,
    custom_qubit_state,
    density_matrix,
    ket_one,
    ket_zero,
    plus_state,
    tensor_product,
)
from .noise import (
    amplitude_damping_kraus,
    apply_kraus_channel,
    depolarizing_kraus,
    kraus_completeness_residual,
    phase_damping_kraus,
)
from .metrics import (
    eigenvalues,
    fidelity,
    is_hermitian,
    is_positive_semidefinite,
    is_valid_density_matrix,
    purity,
    trace_value,
)
from .analytical import (
    analytical_amplitude_density,
    analytical_amplitude_fidelity,
    analytical_phase_density,
    analytical_phase_fidelity,
)
from .qec import (
    repetition_success_protected,
    repetition_success_unprotected,
)
from .sweeps import sweep_metric, sweep_noise

__all__ = [
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
]

__version__ = "0.1.0"
