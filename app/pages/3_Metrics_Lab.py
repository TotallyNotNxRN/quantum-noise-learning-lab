"""Metrics Lab — fidelity, purity, eigenvalues, validity checks."""

from __future__ import annotations

import numpy as np
import streamlit as st

from app.components.explain import (
    beginner_box,
    next_module_hint,
    page_footer,
    technical_box,
)
from app.components.plots import (
    density_matrix_heatmap,
    eigenvalue_bar,
    metric_curve,
)
from app.components.theme import inject_styles
from app.components.validation import validation_pill
from quantum_noise_lab import (
    amplitude_damping_kraus,
    apply_kraus_channel,
    custom_qubit_state,
    density_matrix,
    depolarizing_kraus,
    eigenvalues,
    fidelity,
    ket_one,
    ket_zero,
    phase_damping_kraus,
    plus_state,
    purity,
    sweep_metric,
)

st.set_page_config(page_title="Metrics Lab", page_icon="📊", layout="wide")
inject_styles()
st.title("Metrics Lab — Fidelity, Purity, Eigenvalues")

st.markdown(
    "How do we quantify the damage noise does to ρ? Fidelity measures how "
    "close the noisy state is to the original; purity measures whether the "
    "state is pure or a statistical mixture; eigenvalues expose the mixture "
    "structure directly. Move the slider and watch all three respond."
)

# ---- sidebar ------------------------------------------------------------

st.sidebar.header("Initial state")
preset = st.sidebar.radio("Preset", options=["|0⟩", "|1⟩", "|+⟩", "Custom"], index=2)
if preset == "|0⟩":
    psi = ket_zero()
elif preset == "|1⟩":
    psi = ket_one()
elif preset == "|+⟩":
    psi = plus_state()
else:
    theta = st.sidebar.slider("θ", 0.0, float(np.pi), float(np.pi / 2), step=0.05)
    phi = st.sidebar.slider("φ", 0.0, float(2 * np.pi), 0.0, step=0.05)
    psi = custom_qubit_state(theta, phi)

st.sidebar.header("Noise channel")
channel_name = st.sidebar.selectbox(
    "Channel",
    options=["Amplitude damping", "Phase damping", "Depolarizing"],
)
param = st.sidebar.slider("Strength", 0.0, 1.0, 0.3, step=0.01)

channel_fns = {
    "Amplitude damping": (amplitude_damping_kraus, "γ"),
    "Phase damping": (phase_damping_kraus, "λ"),
    "Depolarizing": (depolarizing_kraus, "p"),
}
channel_fn, param_label = channel_fns[channel_name]

# ---- engine -------------------------------------------------------------

rho_initial = density_matrix(psi)
rho_noisy = apply_kraus_channel(rho_initial, channel_fn(param))
f_value = fidelity(rho_noisy, psi)
pur = purity(rho_noisy)
eigs = eigenvalues(rho_noisy)

grid = np.linspace(0.0, 1.0, 51)
fidelity_curve = sweep_metric(channel_fn, rho_initial, psi, fidelity, grid)
purity_curve = sweep_metric(channel_fn, rho_initial, psi, lambda r, _ref: purity(r), grid)
eigvals_curve = np.array(
    [eigenvalues(apply_kraus_channel(rho_initial, channel_fn(float(g)))) for g in grid]
)

# ---- layout -------------------------------------------------------------

top_left, top_right = st.columns([1.0, 1.2], gap="large")

with top_left:
    st.subheader("Current ρ at the chosen noise level")
    st.plotly_chart(density_matrix_heatmap(rho_noisy), use_container_width=True)
    metric_cols = st.columns(3)
    metric_cols[0].metric("Fidelity F", f"{f_value:.4f}")
    metric_cols[1].metric("Purity Tr(ρ²)", f"{pur:.4f}")
    metric_cols[2].metric("Smallest eigenvalue", f"{float(np.min(eigs)):.4f}")
    beginner_box(
        """
        - **Fidelity** asks: "how close is the noisy state to the original?"
          It runs from 1 (identical) down to 0 (orthogonal).
        - **Purity** asks: "is the state a pure quantum state or a mixture?"
          A pure state has purity 1; a maximally mixed qubit has purity 1/2.
        - **Eigenvalues** are the weights when ρ is written as a probabilistic
          mixture of orthogonal pure states (its *spectral decomposition*).
          A pure state has eigenvalues (1, 0); a maximally mixed state has
          (1/2, 1/2). Anything in between is partially mixed.
        """
    )
    technical_box(
        r"""
Squared Uhlmann fidelity:

$$
F(\rho, \sigma) = \left( \operatorname{Tr}\sqrt{\sqrt{\rho}\,\sigma\,\sqrt{\rho}} \right)^2.
$$

For pure reference $\sigma = |\psi\rangle\langle\psi|$:
$F = \langle\psi|\rho|\psi\rangle$.
Purity: $\operatorname{Tr}(\rho^2)$, bounded between $1/d$ and 1.
"""
    )

with top_right:
    st.subheader("Eigenvalues of ρ")
    st.plotly_chart(eigenvalue_bar(eigs), use_container_width=True)
    st.plotly_chart(
        metric_curve(
            grid,
            eigvals_curve[:, 0],
            "Smallest eigenvalue vs noise",
            f"Noise parameter {param_label}",
            "λ_min",
            y_range=(-0.05, 1.05),
        ),
        use_container_width=True,
    )

st.divider()
st.caption(
    f"Curves below compare ρ_noisy to the **initial** state |ψ⟩ selected in "
    f"the sidebar as the fidelity reference; the noise parameter sweeps "
    f"{param_label} ∈ [0, 1]."
)
curve_left, curve_right = st.columns(2, gap="large")
with curve_left:
    st.plotly_chart(
        metric_curve(grid, fidelity_curve, "Fidelity vs noise", f"Noise {param_label}", "F"),
        use_container_width=True,
    )
with curve_right:
    st.plotly_chart(
        metric_curve(
            grid,
            purity_curve,
            "Purity vs noise",
            f"Noise {param_label}",
            "Tr(ρ²)",
            y_range=(0.45, 1.05),
        ),
        use_container_width=True,
    )

st.divider()
st.subheader("Validation of the post-channel state")
validation_pill(rho_noisy)

next_module_hint(
    "Validation Lab",
    "pages/4_Validation_Lab.py",
    teaser="cross-check the simulator against closed-form analytical formulas.",
)
page_footer()
