"""Noise Lab — Kraus channels and decoherence."""

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
)
from app.components.theme import inject_styles
from app.components.validation import validation_pill
from quantum_noise_lab import (
    amplitude_damping_kraus,
    apply_kraus_channel,
    custom_qubit_state,
    density_matrix,
    depolarizing_kraus,
    ket_one,
    ket_zero,
    kraus_completeness_residual,
    phase_damping_kraus,
    plus_state,
)

st.set_page_config(page_title="Noise Lab", page_icon="🌫️", layout="wide")
inject_styles()
st.title("Noise Lab — Kraus Channels and Decoherence")

st.markdown(
    "Pick a starting state and a noise channel, then watch ρ deform. Each "
    "channel's Kraus operators are shown in full and the difference matrix "
    "Δρ = ρ_noisy − ρ tells you exactly what the channel changed."
)

# ---- sidebar controls ---------------------------------------------------

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

# ---- engine call --------------------------------------------------------

if channel_name == "Amplitude damping":
    kraus_label = "γ"
    kraus_ops = amplitude_damping_kraus(param)
    operator_roles = [
        "E₀ — *survival operator*: nothing decayed.",
        "E₁ — *decay event*: a quantum of energy was emitted; |1⟩ → |0⟩.",
    ]
    channel_intro_beginner = (
        "Amplitude damping is *energy relaxation*. The excited state |1⟩ "
        "spontaneously slides toward the ground state |0⟩, like a tiny "
        "battery discharging. γ is the probability that this decay happens."
    )
    channel_intro_technical = r"""
$$
E_0 = \begin{pmatrix}1 & 0 \\ 0 & \sqrt{1-\gamma}\end{pmatrix},
\qquad
E_1 = \begin{pmatrix}0 & \sqrt{\gamma} \\ 0 & 0\end{pmatrix}.
$$

The map $\mathcal{E}(\rho) = E_0 \rho E_0^\dagger + E_1 \rho E_1^\dagger$
shrinks the |1⟩ population by $\gamma$ and the off-diagonals by $\sqrt{1-\gamma}$.
"""
elif channel_name == "Phase damping":
    kraus_label = "λ"
    kraus_ops = phase_damping_kraus(param)
    operator_roles = [
        "E₀ — *no phase kick* (proportional to I).",
        "E₁ — *random Z phase kick*: flips the sign of the |1⟩ amplitude.",
    ]
    channel_intro_beginner = (
        "Phase damping destroys *quantum phase* without changing the "
        "populations. The probabilities of measuring 0 or 1 stay the same, "
        "but the coherence (off-diagonal entries of ρ) gets washed out."
    )
    channel_intro_technical = r"""
Random-Z form:

$$
E_0 = \sqrt{1-\lambda/2}\;I,\qquad
E_1 = \sqrt{\lambda/2}\;Z.
$$

This scales the off-diagonals of $\rho$ by exactly $(1-\lambda)$ and
leaves diagonals untouched. *Convention note:* some textbooks parameterize
phase damping so off-diagonals decay by $\sqrt{1-\lambda}$ instead.
"""
else:
    kraus_label = "p"
    kraus_ops = depolarizing_kraus(param)
    operator_roles = [
        "E₀ — *no kick* (proportional to I).",
        "E₁, E₂, E₃ — random X, Y, Z Pauli kick.",
    ]
    channel_intro_beginner = (
        "The depolarizing channel mixes ρ toward the maximally mixed state "
        "I/2. With probability p the qubit is replaced by I/2 — pure noise — "
        "and with probability 1−p it is left alone."
    )
    channel_intro_technical = r"""
$$
\mathcal{D}(\rho) = (1-p)\,\rho + p\,\tfrac{I}{2},\qquad
E_0 = \sqrt{1-3p/4}\,I,\;
E_1=\sqrt{p/4}\,X,\;
E_2=\sqrt{p/4}\,Y,\;
E_3=\sqrt{p/4}\,Z.
$$
    """

rho_initial = density_matrix(psi)
rho_noisy = apply_kraus_channel(rho_initial, kraus_ops)
diff = rho_noisy - rho_initial
frob_norm = float(np.linalg.norm(diff))
trace_distance = 0.5 * float(np.sum(np.abs(np.linalg.eigvalsh(0.5 * (diff + diff.conj().T)))))
completeness = kraus_completeness_residual(kraus_ops)

# ---- layout -------------------------------------------------------------

left, right = st.columns([1.0, 1.4], gap="large")

with left:
    st.subheader(f"{channel_name} channel")
    st.caption(f"Parameter {kraus_label} = {param:.3f}")
    beginner_box(
        channel_intro_beginner
        + "\n\n_Why multiple Kraus operators?_ Each operator captures one "
        "possible outcome the environment could inflict; together they sum to "
        "the full statistical channel."
    )
    technical_box(channel_intro_technical)
    convention_callout(
        "Channel applied as ρ ↦ Σᵢ Eᵢ ρ Eᵢ†. Kraus operators must satisfy "
        "Σᵢ Eᵢ†Eᵢ = I; current residual = "
        f"{completeness:.2e}."
    )

    st.subheader("Kraus operators")
    st.caption(
        "Each operator represents a different physical outcome the environment "
        "could enact on the qubit; the channel sums their contributions."
    )

    def _latex_2x2(matrix: np.ndarray) -> str:
        def _cell(z: complex) -> str:
            if abs(z.imag) < 1e-10:
                return f"{z.real:.3f}"
            return f"({z.real:.3f}{z.imag:+.3f}i)"
        return (
            r"\begin{pmatrix}"
            f"{_cell(matrix[0,0])} & {_cell(matrix[0,1])} \\\\ "
            f"{_cell(matrix[1,0])} & {_cell(matrix[1,1])}"
            r"\end{pmatrix}"
        )

    for idx, (op_array, role) in enumerate(zip(kraus_ops, operator_roles)):
        st.markdown(f"- **E_{idx}** — {role}")
        st.latex(f"E_{idx} = {_latex_2x2(op_array)}")

with right:
    st.subheader("ρ before noise")
    st.plotly_chart(density_matrix_heatmap(rho_initial, "Initial ρ"), use_container_width=True)
    st.subheader("ρ after noise")
    st.plotly_chart(density_matrix_heatmap(rho_noisy, "Noisy ρ"), use_container_width=True)
    st.subheader("Difference Δρ = ρ_noisy − ρ")
    st.plotly_chart(difference_matrix_heatmap(diff), use_container_width=True)
    metric_cols = st.columns(2)
    metric_cols[0].metric(
        "‖Δρ‖_F (Frobenius norm)",
        f"{frob_norm:.4f}",
        help="Total entry-by-entry magnitude of the change in ρ. 0 means the channel did nothing.",
    )
    metric_cols[1].metric(
        "½‖Δρ‖₁ (trace distance)",
        f"{trace_distance:.4f}",
        help="Half the sum of |eigenvalues(Δρ)|; measures how distinguishable the two states are by any measurement.",
    )

st.divider()
st.subheader("Validation of the post-channel state")
validation_pill(rho_noisy)

next_module_hint(
    "Metrics Lab",
    "pages/3_Metrics_Lab.py",
    teaser="quantify the deformation with fidelity, purity, and eigenvalues.",
)
page_footer()
