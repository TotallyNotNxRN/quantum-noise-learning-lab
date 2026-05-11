"""Validation Lab — analytical vs simulated decoherence for |+⟩."""

from __future__ import annotations

import numpy as np
import streamlit as st

from app.components.explain import (
    beginner_box,
    convention_callout,
    next_module_hint,
    page_footer,
    technical_box,
)
from app.components.plots import (
    density_matrix_heatmap,
    difference_matrix_heatmap,
    overlay_curves,
)
from app.components.bloch import bloch_sphere
from app.components.theme import inject_styles
from app.components.validation import validation_pill
from quantum_noise_lab import (
    amplitude_damping_kraus,
    analytical_amplitude_density,
    analytical_amplitude_fidelity,
    analytical_phase_density,
    analytical_phase_fidelity,
    apply_kraus_channel,
    density_matrix,
    fidelity,
    phase_damping_kraus,
    plus_state,
    sweep_metric,
)

st.set_page_config(page_title="Validation Lab", page_icon="✅", layout="wide")
inject_styles()
st.title("Validation Lab — Analytical vs Simulated Decoherence")

st.markdown(
    "The simulator is only useful if its numbers match the math. This module "
    "compares the post-channel density matrix and fidelity that the engine "
    "computes numerically against closed-form analytical expressions for "
    "the |+⟩ initial state."
)
st.caption(
    "**Simulated** = engine applies the Kraus map ρ ↦ Σ Eᵢ ρ Eᵢ† via "
    "`apply_kraus_channel`. **Analytical** = the closed-form expression in "
    "`quantum_noise_lab.analytical` (derived by hand for the |+⟩ initial state)."
)

convention_callout(
    "All formulas on this page assume the initial state |+⟩ = (|0⟩+|1⟩)/√2, "
    "and the phase damping convention used here scales the off-diagonals of "
    "ρ by exactly (1 − λ)."
)

# ---- sidebar ------------------------------------------------------------

channel = st.sidebar.selectbox("Channel", options=["Amplitude damping", "Phase damping"])
param = st.sidebar.slider(
    "γ" if channel == "Amplitude damping" else "λ", 0.0, 1.0, 0.3, step=0.01
)

if channel == "Amplitude damping":
    kraus_fn = amplitude_damping_kraus
    analytical_rho_fn = analytical_amplitude_density
    analytical_fid_fn = analytical_amplitude_fidelity
    param_label = "γ"
    formula_text = r"""
$$
\rho_{AD}(\gamma) = \begin{pmatrix}
(1+\gamma)/2 & \sqrt{1-\gamma}/2 \\
\sqrt{1-\gamma}/2 & (1-\gamma)/2
\end{pmatrix},\quad
F_{AD}(\gamma) = \frac{1+\sqrt{1-\gamma}}{2}.
$$
"""
else:
    kraus_fn = phase_damping_kraus
    analytical_rho_fn = analytical_phase_density
    analytical_fid_fn = analytical_phase_fidelity
    param_label = "λ"
    formula_text = r"""
$$
\rho_{PD}(\lambda) = \begin{pmatrix}
1/2 & (1-\lambda)/2 \\
(1-\lambda)/2 & 1/2
\end{pmatrix},\quad
F_{PD}(\lambda) = 1 - \lambda/2.
$$
"""

# ---- engine -------------------------------------------------------------

rho_initial = density_matrix(plus_state())
rho_sim = apply_kraus_channel(rho_initial, kraus_fn(param))
rho_ana = analytical_rho_fn(param)
err = rho_sim - rho_ana

grid = np.linspace(0.0, 1.0, 51)
fid_sim = sweep_metric(kraus_fn, rho_initial, plus_state(), fidelity, grid)
fid_ana = np.array([analytical_fid_fn(float(g)) for g in grid])

# ---- layout -------------------------------------------------------------

top_left, top_right = st.columns([1, 1.2], gap="large")
with top_left:
    st.subheader(f"{channel} — formulas")
    technical_box(formula_text, expanded=True)
    beginner_box(
        "The panels on the right show the simulator and the closed-form "
        "formulas side by side. If everything is implemented correctly, the "
        "two density matrices are visually identical, the absolute-error "
        "matrix is all zeros to within floating-point noise, and the simulated "
        "and analytical fidelity curves below overlap exactly."
    )
    st.markdown("**Bloch sphere**")
    st.plotly_chart(
        bloch_sphere(
            rho_sim,
            extra_vectors=[(rho_initial, "ρ_0 (|+⟩)", "rgba(170, 170, 200, 0.8)")],
            title="Solid: simulated · dashed: |+⟩ initial",
            height=420,
        ),
        use_container_width=True,
    )

with top_right:
    side_left, side_right = st.columns(2, gap="small")
    with side_left:
        st.markdown("**Simulated ρ**")
        st.plotly_chart(density_matrix_heatmap(rho_sim, "Simulated"), use_container_width=True)
    with side_right:
        st.markdown("**Analytical ρ**")
        st.plotly_chart(density_matrix_heatmap(rho_ana, "Analytical"), use_container_width=True)
    st.markdown("**Absolute error |ρ_sim − ρ_ana|**")
    st.plotly_chart(difference_matrix_heatmap(err, "Error"), use_container_width=True)
    abs_max = float(np.max(np.abs(err)))
    frob = float(np.linalg.norm(err))
    cols = st.columns(2)
    cols[0].metric("max |Δρ|", f"{abs_max:.2e}")
    cols[1].metric("‖Δρ‖_F", f"{frob:.2e}")
    if abs_max < 1e-10:
        st.caption(
            "Error is at floating-point noise level (~1e-15). The heatmap is "
            "rescaled to that range, so any visible color is numerical dust, "
            "not a discrepancy."
        )

st.divider()
st.subheader("Fidelity vs noise — simulated vs analytical")
st.plotly_chart(
    overlay_curves(
        grid,
        [
            ("simulated", fid_sim, "#3b5bdb"),
            ("analytical", fid_ana, "#fd7e14"),
        ],
        title=f"F vs {param_label}",
        xlabel=f"Noise parameter {param_label}",
        ylabel="Fidelity F",
    ),
    use_container_width=True,
)
st.caption(
    f"Maximum |F_sim − F_ana| across the grid = "
    f"{float(np.max(np.abs(fid_sim - fid_ana))):.2e}."
)

st.divider()
st.subheader("Validation of the simulated state")
validation_pill(rho_sim)

next_module_hint(
    "Protection Lab",
    "pages/5_Protection_Lab.py",
    teaser="why redundancy helps — and what it does not address.",
)
page_footer()
