"""Global theming helpers: dark CSS polish, fade-in, hover transitions, custom cursors.

Call :func:`inject_styles` once near the top of every page. The CSS is
intentionally restrained — no decorative backgrounds, no particle effects,
no fake holograms. Just smoother interactions on top of Streamlit's
built-in dark theme.
"""

from __future__ import annotations

import streamlit as st

_STYLE_BLOCK = """
<style>
:root {
    --qnl-bg: #0b0e14;
    --qnl-panel: #141a26;
    --qnl-panel-2: #1a2233;
    --qnl-border: #243047;
    --qnl-text: #e8eaef;
    --qnl-text-dim: #a5acbb;
    --qnl-accent: #7aa2ff;
    --qnl-accent-soft: #3b5bdb;
    --qnl-good: #51cf66;
    --qnl-warn: #ffd43b;
    --qnl-bad: #ff6b6b;
    --qnl-radius: 10px;
    --qnl-transition: 180ms cubic-bezier(.2, .8, .2, 1);
}

/* Smooth page fade-in --------------------------------------------------- */
@keyframes qnl-fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: none; }
}
section.main > div.block-container {
    animation: qnl-fade-in 320ms ease-out both;
    padding-top: 2.2rem;
    max-width: 1280px;
}

/* Typography refinements ------------------------------------------------ */
h1, h2, h3 {
    letter-spacing: -0.01em;
    font-weight: 600;
}
h1 { font-size: 2.1rem; }
h2 { font-size: 1.45rem; margin-top: 1.4rem; }
h3 { font-size: 1.15rem; }
hr { border-color: var(--qnl-border) !important; opacity: 0.7; }

/* Metric cards ---------------------------------------------------------- */
div[data-testid="stMetric"] {
    background: var(--qnl-panel);
    border: 1px solid var(--qnl-border);
    border-radius: var(--qnl-radius);
    padding: 0.85rem 1rem 0.7rem;
    min-height: 92px;
    transition: transform var(--qnl-transition), border-color var(--qnl-transition), box-shadow var(--qnl-transition);
}
div[data-testid="stMetric"]:hover {
    transform: translateY(-1px);
    border-color: var(--qnl-accent);
    box-shadow: 0 4px 18px rgba(122, 162, 255, 0.08);
}
div[data-testid="stMetricValue"] {
    font-variant-numeric: tabular-nums;
}

/* Expanders ------------------------------------------------------------- */
details[data-testid="stExpander"] {
    background: var(--qnl-panel);
    border: 1px solid var(--qnl-border);
    border-radius: var(--qnl-radius);
    transition: border-color var(--qnl-transition);
    overflow: hidden;
}
details[data-testid="stExpander"]:hover {
    border-color: rgba(122, 162, 255, 0.6);
}
details[data-testid="stExpander"] > summary {
    cursor: pointer;
    padding: 0.55rem 0.9rem;
    font-weight: 500;
}

/* Sidebar --------------------------------------------------------------- */
section[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #0d1320 0%, #0b0e14 100%);
    border-right: 1px solid var(--qnl-border);
}
section[data-testid="stSidebar"] h2,
section[data-testid="stSidebar"] h3 {
    color: var(--qnl-text);
    margin-top: 0.8rem;
}

/* Sliders --------------------------------------------------------------- */
div[data-baseweb="slider"] > div { transition: background var(--qnl-transition); }
div[data-baseweb="slider"] [role="slider"] { cursor: ew-resize; }

/* Buttons --------------------------------------------------------------- */
button[kind="primary"],
button[kind="secondary"] {
    transition: transform var(--qnl-transition), filter var(--qnl-transition);
    border-radius: 8px;
}
button[kind="primary"]:hover,
button[kind="secondary"]:hover {
    transform: translateY(-1px);
    filter: brightness(1.06);
}

/* Page links / next module nav ------------------------------------------ */
a[data-testid="stPageLink-NavLink"] {
    display: inline-flex;
    align-items: center;
    padding: 0.55rem 0.85rem;
    border: 1px solid var(--qnl-border);
    border-radius: 8px;
    transition: border-color var(--qnl-transition), background var(--qnl-transition);
    color: var(--qnl-text) !important;
    text-decoration: none !important;
}
a[data-testid="stPageLink-NavLink"]:hover {
    border-color: var(--qnl-accent);
    background: rgba(122, 162, 255, 0.06);
}

/* Code blocks ----------------------------------------------------------- */
pre, code {
    background: var(--qnl-panel-2) !important;
    border-radius: 6px;
}

/* Alert variants -------------------------------------------------------- */
div[data-baseweb="notification"] {
    border-radius: var(--qnl-radius);
}

/* Plotly chart container ------------------------------------------------ */
div[data-testid="stPlotlyChart"] {
    background: var(--qnl-panel);
    border: 1px solid var(--qnl-border);
    border-radius: var(--qnl-radius);
    padding: 0.4rem;
    transition: border-color var(--qnl-transition);
}
div[data-testid="stPlotlyChart"]:hover { border-color: rgba(122, 162, 255, 0.45); }

/* Validation pill rows -------------------------------------------------- */
div[data-testid="stMarkdownContainer"] span[title] {
    cursor: help;
}

/* Tooltips on hover ----------------------------------------------------- */
[title] { transition: opacity var(--qnl-transition); }

/* Reduce default scrollbar weight (Webkit) ------------------------------ */
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-thumb { background: #2a3346; border-radius: 5px; }
::-webkit-scrollbar-thumb:hover { background: var(--qnl-accent-soft); }
</style>
"""


def inject_styles() -> None:
    """Inject the global dark-theme CSS for the lab. Idempotent per page."""
    st.markdown(_STYLE_BLOCK, unsafe_allow_html=True)


PLOTLY_TEMPLATE = "plotly_dark"
PLOTLY_PAPER_BG = "#141a26"
PLOTLY_PLOT_BG = "#0f1421"
PLOTLY_FONT_COLOR = "#e8eaef"
PLOTLY_GRID_COLOR = "rgba(255, 255, 255, 0.06)"


def plotly_layout_defaults() -> dict:
    """Return common Plotly layout overrides for the dark theme."""
    return dict(
        template=PLOTLY_TEMPLATE,
        paper_bgcolor=PLOTLY_PAPER_BG,
        plot_bgcolor=PLOTLY_PLOT_BG,
        font=dict(color=PLOTLY_FONT_COLOR, family="serif"),
        xaxis=dict(gridcolor=PLOTLY_GRID_COLOR, zerolinecolor=PLOTLY_GRID_COLOR),
        yaxis=dict(gridcolor=PLOTLY_GRID_COLOR, zerolinecolor=PLOTLY_GRID_COLOR),
    )
