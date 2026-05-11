"""Theming: light/dark toggle, glass panels, custom cursor, soft animations.

Injection strategy:
  * Primary path: ``st.markdown("<style>...</style>", unsafe_allow_html=True)``.
    Streamlit 1.30+ bypasses sanitization with ``unsafe_allow_html=True``.
  * Belt-and-braces: a zero-size ``components.v1.html`` iframe that also
    installs the same ``<style>`` into ``window.parent.document.head``.
    If the markdown path is stripped by a future Streamlit, the iframe
    payload still wins.

All CSS rules are designed so that if any single rule fails, the page
remains usable — no rule depends on opacity-0 starting states that
"never finish" animating.
"""

from __future__ import annotations

import json
from typing import Literal
from urllib.parse import quote

import streamlit as st
import streamlit.components.v1 as components


THEME_STATE_KEY = "qnl_theme"
ThemeMode = Literal["dark", "light"]


# ---- Plotly defaults (consumed by plots.py + bloch.py) ------------------

PLOTLY_TEMPLATE_DARK = "plotly_dark"
PLOTLY_PAPER_BG_DARK = "#141a26"
PLOTLY_PLOT_BG_DARK = "#0f1421"
PLOTLY_FONT_COLOR_DARK = "#e8eaef"
PLOTLY_GRID_COLOR_DARK = "rgba(255, 255, 255, 0.06)"

PLOTLY_TEMPLATE_LIGHT = "plotly_white"
PLOTLY_PAPER_BG_LIGHT = "#ffffff"
PLOTLY_PLOT_BG_LIGHT = "#fbfcff"
PLOTLY_FONT_COLOR_LIGHT = "#1c2030"
PLOTLY_GRID_COLOR_LIGHT = "rgba(0, 0, 0, 0.06)"

# Back-compat constants (some external imports may already use these).
PLOTLY_TEMPLATE = PLOTLY_TEMPLATE_DARK
PLOTLY_PAPER_BG = PLOTLY_PAPER_BG_DARK
PLOTLY_PLOT_BG = PLOTLY_PLOT_BG_DARK
PLOTLY_FONT_COLOR = PLOTLY_FONT_COLOR_DARK
PLOTLY_GRID_COLOR = PLOTLY_GRID_COLOR_DARK


def _current_mode() -> ThemeMode:
    return st.session_state.get(THEME_STATE_KEY, "dark")


def plotly_layout_defaults() -> dict:
    """Plotly layout overrides matching the current theme. Called per chart."""
    if _current_mode() == "light":
        return dict(
            template=PLOTLY_TEMPLATE_LIGHT,
            paper_bgcolor=PLOTLY_PAPER_BG_LIGHT,
            plot_bgcolor=PLOTLY_PLOT_BG_LIGHT,
            font=dict(color=PLOTLY_FONT_COLOR_LIGHT, family="Inter, sans-serif"),
            xaxis=dict(gridcolor=PLOTLY_GRID_COLOR_LIGHT, zerolinecolor=PLOTLY_GRID_COLOR_LIGHT),
            yaxis=dict(gridcolor=PLOTLY_GRID_COLOR_LIGHT, zerolinecolor=PLOTLY_GRID_COLOR_LIGHT),
        )
    return dict(
        template=PLOTLY_TEMPLATE_DARK,
        paper_bgcolor=PLOTLY_PAPER_BG_DARK,
        plot_bgcolor=PLOTLY_PLOT_BG_DARK,
        font=dict(color=PLOTLY_FONT_COLOR_DARK, family="Inter, sans-serif"),
        xaxis=dict(gridcolor=PLOTLY_GRID_COLOR_DARK, zerolinecolor=PLOTLY_GRID_COLOR_DARK),
        yaxis=dict(gridcolor=PLOTLY_GRID_COLOR_DARK, zerolinecolor=PLOTLY_GRID_COLOR_DARK),
    )


# ---- Custom cursor (URL-encoded SVG, 36x36, accent ring + accent dot) ---


def _cursor_svg(stroke: str, fill: str) -> str:
    raw = f"""
<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'>
  <circle cx='18' cy='18' r='15' fill='none' stroke='{stroke}' stroke-opacity='0.35' stroke-width='1'/>
  <circle cx='18' cy='18' r='10' fill='none' stroke='{stroke}' stroke-opacity='0.7' stroke-width='1.4'/>
  <circle cx='18' cy='18' r='3' fill='{fill}'/>
  <line x1='18' y1='2' x2='18' y2='8' stroke='{stroke}' stroke-opacity='0.85' stroke-width='1.6'/>
  <line x1='18' y1='28' x2='18' y2='34' stroke='{stroke}' stroke-opacity='0.85' stroke-width='1.6'/>
  <line x1='2' y1='18' x2='8' y2='18' stroke='{stroke}' stroke-opacity='0.85' stroke-width='1.6'/>
  <line x1='28' y1='18' x2='34' y2='18' stroke='{stroke}' stroke-opacity='0.85' stroke-width='1.6'/>
</svg>
""".strip()
    return "data:image/svg+xml;charset=utf-8," + quote(raw, safe="")


CURSOR_DARK = _cursor_svg(stroke="#9ab8ff", fill="#7aa2ff")
CURSOR_LIGHT = _cursor_svg(stroke="#2e48aa", fill="#2e48aa")


# ---- Google Fonts link --------------------------------------------------

_FONT_HREF = (
    "https://fonts.googleapis.com/css2"
    "?family=Inter:wght@400;500;600;700"
    "&family=JetBrains+Mono:wght@400;500"
    "&family=Newsreader:ital,wght@0,500;0,600;1,500"
    "&display=swap"
)


# ---- CSS block ---------------------------------------------------------


def _palette(mode: ThemeMode) -> str:
    if mode == "light":
        return """
            --qnl-bg-1: #f5f7fb;
            --qnl-bg-2: #ecf0f8;
            --qnl-panel: rgba(255, 255, 255, 0.68);
            --qnl-border: rgba(36, 56, 110, 0.18);
            --qnl-text: #1c2030;
            --qnl-text-dim: #5a6275;
            --qnl-accent: #2e48aa;
            --qnl-accent-soft: rgba(46, 72, 170, 0.15);
            --qnl-shadow: 0 6px 28px rgba(15, 30, 80, 0.08);
            --qnl-gradient-a: rgba(122, 162, 255, 0.20);
            --qnl-gradient-b: rgba(255, 157, 77, 0.15);
            --qnl-gradient-c: rgba(81, 207, 102, 0.10);
            --qnl-base: #f5f7fb;
        """
    return """
        --qnl-bg-1: #0a0e1a;
        --qnl-bg-2: #0f1424;
        --qnl-panel: rgba(20, 26, 38, 0.55);
        --qnl-border: rgba(122, 162, 255, 0.18);
        --qnl-text: #e8eaef;
        --qnl-text-dim: #a5acbb;
        --qnl-accent: #7aa2ff;
        --qnl-accent-soft: rgba(122, 162, 255, 0.18);
        --qnl-shadow: 0 6px 28px rgba(0, 0, 0, 0.45);
        --qnl-gradient-a: rgba(122, 162, 255, 0.22);
        --qnl-gradient-b: rgba(255, 157, 77, 0.12);
        --qnl-gradient-c: rgba(81, 207, 102, 0.08);
        --qnl-base: #0a0e1a;
    """


def _css_body(mode: ThemeMode) -> str:
    cursor = CURSOR_LIGHT if mode == "light" else CURSOR_DARK
    palette = _palette(mode)
    return f"""
@import url("{_FONT_HREF}");

:root {{
    {palette}
    --qnl-cursor: url("{cursor}") 18 18, crosshair;
    --qnl-trans: 220ms cubic-bezier(.2, .8, .2, 1);
}}

/* Fonts ---------------------------------------------------------- */
html, body, [class^="st"], [class*=" st"], [data-testid] {{
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
        Helvetica, Arial, sans-serif !important;
    -webkit-font-smoothing: antialiased;
}}
h1, h2, h3, h4 {{
    font-family: "Newsreader", "Inter", Georgia, serif !important;
    font-weight: 600;
    letter-spacing: -0.012em;
}}
code, pre, .stCode {{
    font-family: "JetBrains Mono", "SF Mono", Menlo, monospace !important;
    font-size: 0.86rem !important;
}}

/* Custom cursor — applied to root and everything explicitly so it
   sticks even when Streamlit elements override their own cursors. */
html, body, .stApp, .stApp * {{
    cursor: var(--qnl-cursor) !important;
}}
button, a, summary, [role="button"], [role="slider"], [data-baseweb="select"] {{
    cursor: var(--qnl-cursor) !important;
}}

/* Soft background gradient. NO pseudo-elements — they cover the
   content in Streamlit 1.57. The background lives directly on .stApp. */
@keyframes qnl-bg-drift {{
    0%   {{ background-position: 0% 0%, 100% 100%, 50% 50%; }}
    50%  {{ background-position: 6% 4%, 94% 96%, 48% 52%; }}
    100% {{ background-position: 0% 0%, 100% 100%, 50% 50%; }}
}}
body, .stApp {{
    background-color: var(--qnl-base) !important;
    background-image:
        radial-gradient(circle at 18% 22%, var(--qnl-gradient-a) 0%, transparent 50%),
        radial-gradient(circle at 82% 78%, var(--qnl-gradient-b) 0%, transparent 55%),
        radial-gradient(circle at 50% 50%, var(--qnl-gradient-c) 0%, transparent 60%) !important;
    background-attachment: fixed !important;
    background-size: 140% 140%, 150% 150%, 170% 170% !important;
    animation: qnl-bg-drift 30s ease-in-out infinite;
    color: var(--qnl-text);
}}

/* Page mount animation — transform & opacity together, but using fade
   from 0.45 → 1 so a paused animation still leaves content readable. */
@keyframes qnl-rise {{
    0%   {{ opacity: 0.4; transform: translateY(10px); }}
    100% {{ opacity: 1; transform: none; }}
}}
[data-testid="stMainBlockContainer"],
section.main > div.block-container,
.stMainBlockContainer {{
    animation: qnl-rise 520ms cubic-bezier(.2, .8, .2, 1) both;
    padding-top: 2.4rem;
    max-width: 1340px;
}}

/* Headings ------------------------------------------------------- */
h1 {{ font-size: 2.25rem; line-height: 1.18; margin-bottom: 0.4rem; }}
h1::after {{
    content: "";
    display: block;
    width: 3.5rem;
    height: 2px;
    background: linear-gradient(90deg, var(--qnl-accent), transparent);
    margin-top: 0.6rem;
    border-radius: 2px;
}}
h2 {{ font-size: 1.55rem; margin-top: 1.8rem; }}
h3 {{ font-size: 1.18rem; }}
hr {{ border-color: var(--qnl-border) !important; opacity: 0.9; }}

/* Glass panels --------------------------------------------------- */
div[data-testid="stMetric"],
details[data-testid="stExpander"],
div[data-testid="stPlotlyChart"] {{
    background: var(--qnl-panel) !important;
    backdrop-filter: blur(16px) saturate(140%);
    -webkit-backdrop-filter: blur(16px) saturate(140%);
    border: 1px solid var(--qnl-border) !important;
    border-radius: 14px !important;
    box-shadow: var(--qnl-shadow);
    transition: transform var(--qnl-trans), border-color var(--qnl-trans), box-shadow var(--qnl-trans);
}}
div[data-testid="stMetric"] {{
    padding: 1rem 1.1rem 0.85rem !important;
    min-height: 96px;
}}
div[data-testid="stMetric"]:hover,
div[data-testid="stPlotlyChart"]:hover {{
    transform: translateY(-2px);
    border-color: var(--qnl-accent) !important;
}}
div[data-testid="stMetricValue"] {{
    font-variant-numeric: tabular-nums;
    font-weight: 600;
}}
div[data-testid="stPlotlyChart"] {{ padding: 0.45rem !important; }}

/* Expanders ------------------------------------------------------ */
details[data-testid="stExpander"] > summary {{
    padding: 0.65rem 1rem;
    font-weight: 500;
    transition: background var(--qnl-trans);
}}
details[data-testid="stExpander"] > summary:hover {{
    background: var(--qnl-accent-soft);
}}

/* Sidebar glass + accent border -------------------------------- */
section[data-testid="stSidebar"] {{
    background: var(--qnl-panel) !important;
    backdrop-filter: blur(22px) saturate(140%);
    -webkit-backdrop-filter: blur(22px) saturate(140%);
    border-right: 1px solid var(--qnl-border) !important;
}}

/* Buttons + page links ------------------------------------------ */
button[kind="primary"], button[kind="secondary"] {{
    transition: transform var(--qnl-trans), filter var(--qnl-trans);
    border-radius: 10px !important;
}}
button[kind="primary"]:hover, button[kind="secondary"]:hover {{
    transform: translateY(-1px);
    filter: brightness(1.08);
}}
a[data-testid="stPageLink-NavLink"] {{
    display: inline-flex; align-items: center;
    padding: 0.6rem 0.95rem;
    background: var(--qnl-panel);
    border: 1px solid var(--qnl-border);
    border-radius: 10px;
    color: var(--qnl-text) !important;
    text-decoration: none !important;
    transition: all var(--qnl-trans);
}}
a[data-testid="stPageLink-NavLink"]:hover {{
    border-color: var(--qnl-accent);
    background: var(--qnl-accent-soft);
    transform: translateY(-1px);
}}

/* Code blocks --------------------------------------------------- */
pre, code {{
    background: var(--qnl-bg-2) !important;
    border-radius: 8px;
    border: 1px solid var(--qnl-border);
}}

/* Scrollbar ----------------------------------------------------- */
::-webkit-scrollbar {{ width: 10px; height: 10px; }}
::-webkit-scrollbar-thumb {{ background: var(--qnl-accent-soft); border-radius: 5px; }}
::-webkit-scrollbar-thumb:hover {{ background: var(--qnl-accent); }}
"""


# ---- Injection ----------------------------------------------------------


def _inject_via_markdown(css: str) -> None:
    """Primary path: write a <style> via st.markdown with HTML allowed."""
    st.markdown(f"<style>{css}</style>", unsafe_allow_html=True)


def _inject_via_iframe(css: str, mode: str) -> None:
    """Fallback / supplemental path: append the same <style> to the parent
    document head via a zero-size components iframe."""
    script = f"""
<!doctype html>
<html><head><meta charset="utf-8"></head><body>
<script>
(function () {{
  try {{
    var doc = (window.parent && window.parent.document) || document;
    var prev = doc.getElementById('qnl-theme-style-iframe');
    if (prev) prev.parentNode.removeChild(prev);
    var s = doc.createElement('style');
    s.id = 'qnl-theme-style-iframe';
    s.setAttribute('data-mode', {json.dumps(mode)});
    s.appendChild(doc.createTextNode({json.dumps(css)}));
    doc.head.appendChild(s);
  }} catch (e) {{ /* no-op */ }}
}})();
</script>
</body></html>
"""
    components.html(script, height=0, width=0)


def _render_theme_toggle() -> None:
    current = _current_mode()
    with st.sidebar:
        choice = st.radio(
            "Appearance",
            options=["Dark", "Light"],
            index=0 if current == "dark" else 1,
            horizontal=True,
            key="qnl_theme_toggle_radio",
        )
        new_mode: ThemeMode = "dark" if choice == "Dark" else "light"
        if new_mode != current:
            st.session_state[THEME_STATE_KEY] = new_mode
            st.rerun()


def inject_styles() -> None:
    """Inject the active theme CSS and render the dark/light toggle.

    Call once per page right after :func:`st.set_page_config`.
    """
    if THEME_STATE_KEY not in st.session_state:
        st.session_state[THEME_STATE_KEY] = "dark"
    mode = _current_mode()
    css = _css_body(mode)
    _inject_via_markdown(css)
    _inject_via_iframe(css, mode)
    _render_theme_toggle()
