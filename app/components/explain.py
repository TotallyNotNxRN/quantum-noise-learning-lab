"""Reusable explainer + navigation widgets for module pages."""

from __future__ import annotations

import streamlit as st


def page_footer() -> None:
    """Compact attribution + limitations link rendered at the bottom of every page."""
    st.divider()
    st.caption(
        "Quantum Noise Learning Lab · single-qubit educational simulator · "
        "engine: NumPy + SciPy · UI: Streamlit + Plotly · "
        "see `docs/limitations.md` for what this lab does and does not model."
    )


def beginner_box(content: str, *, expanded: bool = True) -> None:
    """Plain-language explanation collapsible block."""
    with st.expander("📘 Beginner explanation", expanded=expanded):
        st.markdown(content)


def technical_box(content: str, *, expanded: bool = False) -> None:
    """Equation-heavy explanation collapsible block."""
    with st.expander("🧪 Technical explanation", expanded=expanded):
        st.markdown(content)


def convention_callout(text: str) -> None:
    """Yellow callout used to pin the project's chosen mathematical convention."""
    st.warning(text, icon="ℹ️")


def next_module_hint(
    target_label: str,
    page_relative_path: str,
    *,
    teaser: str | None = None,
) -> None:
    """Inline 'Next:' continuity hint at the bottom of each module page.

    ``teaser`` is an optional one-line preview of what the next module
    covers — helps the narrative flow between pages.
    """
    st.divider()
    if teaser:
        st.markdown(f"**Next →** {target_label} · _{teaser}_")
    else:
        st.markdown(f"**Next →** {target_label}")
    try:
        st.page_link(page_relative_path, label=f"Continue to {target_label}")
    except Exception:
        # Older Streamlit versions don't have st.page_link; show plain text fallback.
        st.markdown(f"Continue to `{target_label}` — see the sidebar.")
