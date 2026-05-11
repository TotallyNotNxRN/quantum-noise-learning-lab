"""Protection Lab — 3-repetition bit-flip protection intuition."""

from __future__ import annotations

import numpy as np
import plotly.graph_objects as go
import streamlit as st

from app.components.explain import (
    beginner_box,
    convention_callout,
    page_footer,
    technical_box,
)
from app.components.theme import inject_styles, plotly_layout_defaults
from quantum_noise_lab import (
    repetition_success_protected,
    repetition_success_unprotected,
)

st.set_page_config(page_title="Protection Lab", page_icon="🛡️", layout="wide")
inject_styles()
st.title("Protection Lab — Simple Error-Correction Intuition")

st.markdown(
    "Real quantum error correction is much richer than this module shows. "
    "This page covers the *intuition* behind redundancy and majority-vote "
    "correction using a classical-style 3-repetition code, applied to a "
    "single error type (bit flips). It is a stepping stone, not the real "
    "thing."
)
st.caption(
    "Note on notation: `p` on this page is a generic per-bit flip probability, "
    "**not** the same `p` as the depolarizing channel parameter in Noise Lab. "
    "They are different physical models even though both live in [0, 1]."
)

convention_callout(
    "This demo addresses *bit-flip* errors only. It does NOT handle phase "
    "errors, does NOT use a syndrome measurement, and the unrestricted "
    "copying it relies on is forbidden for arbitrary quantum states by the "
    "no-cloning theorem. Full quantum error correction (Shor, Steane, "
    "surface code, …) is significantly more involved."
)

# ---- sidebar ------------------------------------------------------------

p_current = st.sidebar.slider("Per-bit flip probability p", 0.0, 1.0, 0.1, step=0.01)

# ---- engine -------------------------------------------------------------

grid = np.linspace(0.0, 1.0, 101)
unprot_curve = np.array([repetition_success_unprotected(float(p)) for p in grid])
prot_curve = np.array([repetition_success_protected(float(p)) for p in grid])
unprot_now = repetition_success_unprotected(p_current)
prot_now = repetition_success_protected(p_current)

# ---- layout -------------------------------------------------------------

left, right = st.columns([1.0, 1.2], gap="large")

with left:
    st.subheader("Success probability at the chosen p")
    cols = st.columns(2)
    cols[0].metric("Unprotected", f"{unprot_now:.3f}")
    cols[1].metric("3-repetition", f"{prot_now:.3f}")
    advantage = prot_now - unprot_now
    cols[0].caption("Probability the value is read correctly with no encoding.")
    cols[1].caption("Probability the majority vote across three copies is correct.")
    st.metric(
        "Protection advantage",
        f"{advantage:+.3f}",
        delta=f"{advantage:+.3f}",
        help="Positive: redundancy is winning. Negative: noise is so heavy that majority vote is actively worse than not encoding.",
    )

    beginner_box(
        """
        Encode the value 0 as **000** and the value 1 as **111**. When noise
        flips each bit independently with probability p, the encoding still
        decodes correctly as long as *at most one* of the three bits flipped
        — the majority of two unflipped bits wins the vote.
        """
    )
    technical_box(
        r"""
$$
P_{unprot}(p) = 1 - p, \qquad
P_{prot}(p) = (1-p)^3 + 3p(1-p)^2.
$$

Below $p = 1/2$, $P_{prot} > P_{unprot}$: redundancy helps.
Above $p = 1/2$, the noise is so heavy that majority vote is
actively worse than not encoding at all.
"""
    )

with right:
    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=grid, y=unprot_curve, mode="lines", name="Unprotected (1 − p)",
            line=dict(color="#7aa2ff", width=2),
        )
    )
    fig.add_trace(
        go.Scatter(
            x=grid, y=prot_curve, mode="lines", name="3-rep majority vote",
            line=dict(color="#51cf66", width=2),
        )
    )
    fig.add_trace(
        go.Scatter(
            x=[p_current], y=[unprot_now],
            mode="markers", name="current (unprot.)",
            marker=dict(color="#7aa2ff", size=11, symbol="circle"),
            showlegend=False,
        )
    )
    fig.add_trace(
        go.Scatter(
            x=[p_current], y=[prot_now],
            mode="markers", name="current (prot.)",
            marker=dict(color="#51cf66", size=11, symbol="circle"),
            showlegend=False,
        )
    )
    fig.add_vline(x=0.5, line_dash="dot", line_color="#adb5bd",
                  annotation_text="p = 1/2", annotation_position="top right")
    fig.update_layout(
        title="Success probability vs bit-flip rate",
        xaxis_title="Per-bit flip probability p",
        yaxis_title="P(success)",
        height=420,
        legend=dict(orientation="h", yanchor="bottom", y=1.0, xanchor="right", x=1.0),
        **plotly_layout_defaults(),
    )
    fig.update_yaxes(range=[0.0, 1.05])
    st.plotly_chart(fig, use_container_width=True)

st.divider()
st.subheader("What this is — and what it isn't")
col_is, col_isnt = st.columns(2)
with col_is:
    st.markdown(
        """
        **What this *is*:**
        - A classical-style repetition code, treating the qubit as a single
          bit that flips with probability p.
        - An honest demonstration that redundancy improves reliability when
          the per-bit error rate is below 1/2.
        - A motivation for why quantum error correction *exists*: because the
          underlying physical hardware is noisy.
        """
    )
with col_isnt:
    st.markdown(
        """
        **What this *isn't*:**
        - It is **not** real quantum error correction. It only handles bit
          flips; it does nothing about phase errors.
        - It does **not** use syndrome extraction, ancilla qubits, or any
          fault-tolerant gate construction.
        - The no-cloning theorem means you cannot literally copy an unknown
          quantum state — real codes encode the state into entanglement, not
          repetition.
        """
    )

st.divider()
st.markdown(
    "**Return to** the Foundations Lab to start over, "
    "or read `docs/06_qec_intuition.md` for a longer write-up."
)
try:
    st.page_link("pages/1_Foundations_Lab.py", label="↻ Restart at Foundations Lab")
except Exception:
    pass
page_footer()
