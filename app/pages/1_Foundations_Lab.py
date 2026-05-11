"""Foundations Lab — state vectors, probabilities, density matrices."""

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
    imag_part_heatmap,
    probability_bar,
)
from app.components.validation import validation_pill
from quantum_noise_lab import (
    custom_qubit_state,
    density_matrix,
    ket_one,
    ket_zero,
    plus_state,
)

st.set_page_config(page_title="Foundations Lab", page_icon="🧱", layout="wide")
st.title("Foundations Lab — State Vectors and Density Matrices")

st.markdown(
    "Pick a single-qubit state and inspect its state vector, measurement "
    "probabilities, and density matrix. The density matrix is the object the "
    "rest of the lab will deform with noise — building it carefully here is "
    "the whole point of this module."
)

st.sidebar.header("Choose a state")
preset = st.sidebar.radio(
    "Preset",
    options=["|0⟩", "|1⟩", "|+⟩", "Custom |ψ⟩"],
    index=2,
)

if preset == "|0⟩":
    psi = ket_zero()
elif preset == "|1⟩":
    psi = ket_one()
elif preset == "|+⟩":
    psi = plus_state()
else:
    theta = st.sidebar.slider("θ (polar angle)", 0.0, float(np.pi), float(np.pi / 2), step=0.05)
    phi = st.sidebar.slider("φ (azimuthal angle)", 0.0, float(2 * np.pi), 0.0, step=0.05)
    psi = custom_qubit_state(theta, phi)

rho = density_matrix(psi)
probabilities = np.real(np.array([psi[0] * np.conjugate(psi[0]), psi[1] * np.conjugate(psi[1])]))

left, right = st.columns([1.0, 1.2], gap="large")

with left:
    st.subheader("State vector |ψ⟩")
    st.latex(
        r"|\psi\rangle = \alpha\,|0\rangle + \beta\,|1\rangle, \quad "
        r"\alpha = \cos(\theta/2), \; \beta = e^{i\varphi}\sin(\theta/2)"
    )
    def _fmt(z: complex) -> str:
        if abs(z.imag) < 1e-10:
            return f"{z.real:+.4f}"
        return f"{z.real:+.4f} {z.imag:+.4f}j"

    st.code(
        f"α = {_fmt(psi[0])}\nβ = {_fmt(psi[1])}",
        language="text",
    )

    beginner_box(
        """
        A qubit's state is a tiny vector of two complex numbers, the
        *amplitudes* α and β. Their squared magnitudes give the
        probabilities of measuring 0 or 1, and they always sum to 1
        because the qubit has to come out as *something*.
        """
    )

    technical_box(
        r"""
        For a pure state \(|\psi\rangle\) the density matrix is the outer
        product

        $$
        \rho = |\psi\rangle\langle\psi| = \begin{pmatrix}
        |\alpha|^2 & \alpha\beta^* \\
        \alpha^*\beta & |\beta|^2
        \end{pmatrix}.
        $$

        Diagonal entries are populations (measurement probabilities) and
        off-diagonal entries are *coherences* — the quantum phase
        information that noise will destroy first.
        """
    )

with right:
    st.subheader("Density matrix ρ")
    st.plotly_chart(density_matrix_heatmap(rho), use_container_width=True)
    if np.max(np.abs(np.imag(rho))) > 1e-8:
        st.plotly_chart(imag_part_heatmap(rho), use_container_width=True)
    st.subheader("Measurement probabilities")
    st.plotly_chart(
        probability_bar(probabilities, ["|0⟩", "|1⟩"]),
        use_container_width=True,
    )

st.divider()
st.subheader("Why density matrices? (bridge to Noise Lab)")
st.markdown(
    """
    A *pure* state can be written as a single ket |ψ⟩. The instant noise enters
    the picture, the system is no longer in one definite state — it is a
    *statistical mixture* of possible outcomes. There is no ket that
    represents "70 % |0⟩ and 30 % |1⟩"; you need a density matrix ρ for that.

    From the next module on, every state is a density matrix. The noise
    channels in Noise Lab act on ρ directly — they cannot act on |ψ⟩, because
    after noise there is no |ψ⟩ to act on.
    """
)

st.divider()
st.subheader("Validation")
st.caption(
    "Hover any pill to see the active tolerance and the measured deviation."
)
validation_pill(rho)

next_module_hint(
    "Noise Lab",
    "pages/2_Noise_Lab.py",
    teaser="watch ρ deform under amplitude damping, phase damping, and depolarizing noise.",
)
page_footer()
