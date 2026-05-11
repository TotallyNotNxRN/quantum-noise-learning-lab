"""Validation status pill widget for module pages."""

from __future__ import annotations

import numpy as np
import streamlit as st

from quantum_noise_lab.metrics import (
    is_hermitian,
    is_positive_semidefinite,
    is_valid_density_matrix,
    trace_value,
)


def validation_pill(rho: np.ndarray, *, atol: float = 1e-10) -> None:
    """Render a green/red pill summarizing whether ρ is a valid density matrix.

    The tooltip on each indicator shows the active absolute tolerance and the
    measured deviation, so the user knows what threshold the check used.
    """
    rho = np.asarray(rho, dtype=np.complex128)
    trace = trace_value(rho)
    trace_err = abs(complex(trace) - 1.0)
    asym = float(np.linalg.norm(rho - rho.conj().T))
    eigs = np.linalg.eigvalsh(0.5 * (rho + rho.conj().T))
    min_eig = float(np.min(eigs))

    herm_ok = is_hermitian(rho, atol=atol)
    psd_ok = is_positive_semidefinite(rho, atol=atol)
    trace_ok = trace_err <= atol
    valid = is_valid_density_matrix(rho, atol=atol)

    def _badge(label: str, ok: bool, help_text: str) -> None:
        icon = "✅" if ok else "❌"
        st.markdown(
            f"<span title='{help_text}' style='font-size:0.95rem'>{icon} <strong>{label}</strong></span>",
            unsafe_allow_html=True,
        )

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        _badge(
            "Trace = 1",
            trace_ok,
            f"|Tr(ρ) − 1| = {trace_err:.2e}, tolerance = {atol:.0e}",
        )
    with col2:
        _badge(
            "Hermitian",
            herm_ok,
            f"||ρ − ρ†||_F = {asym:.2e}, tolerance = {atol:.0e}",
        )
    with col3:
        _badge(
            "Positive semidefinite",
            psd_ok,
            f"min eigenvalue = {min_eig:.2e}, tolerance = −{atol:.0e}",
        )
    with col4:
        _badge(
            "Valid density matrix",
            valid,
            "All three checks above pass within tolerance.",
        )
