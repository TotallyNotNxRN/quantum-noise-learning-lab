"""Global theming: glass panels, light/dark toggle, animated background, custom cursor.

The toggle lives in the sidebar of every page. The chosen mode is stored in
``st.session_state["qnl_theme"]`` and the CSS rendered on every render of
every page.

CSS is injected into the parent document via a zero-height ``components.v1``
iframe that runs a tiny script. ``st.markdown(unsafe_allow_html=True)`` and
``st.html`` both lose the ``<style>`` tag in recent Streamlit versions
(DOMPurify sanitization); the iframe trick is the supported, robust path.
"""

from __future__ import annotations

import json
from typing import Literal

import streamlit as st
import streamlit.components.v1 as components


THEME_STATE_KEY = "qnl_theme"
ThemeMode = Literal["dark", "light"]


# Plotly defaults — referenced by both plots.py and bloch.py.
PLOTLY_TEMPLATE = "plotly_dark"
PLOTLY_PAPER_BG = "#141a26"
PLOTLY_PLOT_BG = "#0f1421"
PLOTLY_FONT_COLOR = "#e8eaef"
PLOTLY_GRID_COLOR = "rgba(255, 255, 255, 0.06)"

PLOTLY_TEMPLATE_LIGHT = "plotly_white"
PLOTLY_PAPER_BG_LIGHT = "#ffffff"
PLOTLY_PLOT_BG_LIGHT = "#fbfcff"
PLOTLY_FONT_COLOR_LIGHT = "#1c2030"
PLOTLY_GRID_COLOR_LIGHT = "rgba(0, 0, 0, 0.06)"


def _current_mode() -> ThemeMode:
    return st.session_state.get(THEME_STATE_KEY, "dark")


def plotly_layout_defaults() -> dict:
    """Plotly layout overrides matching the current theme. Used by all charts."""
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
        template=PLOTLY_TEMPLATE,
        paper_bgcolor=PLOTLY_PAPER_BG,
        plot_bgcolor=PLOTLY_PLOT_BG,
        font=dict(color=PLOTLY_FONT_COLOR, family="Inter, sans-serif"),
        xaxis=dict(gridcolor=PLOTLY_GRID_COLOR, zerolinecolor=PLOTLY_GRID_COLOR),
        yaxis=dict(gridcolor=PLOTLY_GRID_COLOR, zerolinecolor=PLOTLY_GRID_COLOR),
    )


_FONT_HREF = (
    "https://fonts.googleapis.com/css2"
    "?family=Inter:wght@400;500;600;700"
    "&family=JetBrains+Mono:wght@400;500"
    "&family=Newsreader:ital,wght@0,500;0,600;1,500"
    "&display=swap"
)


# SVG cursor (24x24, halo + dot — visible on light and dark surfaces).
_CURSOR_SVG_DARK = (
    "data:image/svg+xml;utf8,"
    "<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'>"
    "<circle cx='14' cy='14' r='10' fill='none' stroke='rgba(122,162,255,0.45)' stroke-width='1.4'/>"
    "<circle cx='14' cy='14' r='2.4' fill='%237aa2ff'/>"
    "<line x1='14' y1='2' x2='14' y2='8' stroke='rgba(122,162,255,0.7)' stroke-width='1.4'/>"
    "<line x1='14' y1='20' x2='14' y2='26' stroke='rgba(122,162,255,0.7)' stroke-width='1.4'/>"
    "<line x1='2' y1='14' x2='8' y2='14' stroke='rgba(122,162,255,0.7)' stroke-width='1.4'/>"
    "<line x1='20' y1='14' x2='26' y2='14' stroke='rgba(122,162,255,0.7)' stroke-width='1.4'/>"
    "</svg>"
)
_CURSOR_SVG_LIGHT = (
    "data:image/svg+xml;utf8,"
    "<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'>"
    "<circle cx='14' cy='14' r='10' fill='none' stroke='rgba(46,72,170,0.55)' stroke-width='1.4'/>"
    "<circle cx='14' cy='14' r='2.4' fill='%232e48aa'/>"
    "<line x1='14' y1='2' x2='14' y2='8' stroke='rgba(46,72,170,0.7)' stroke-width='1.4'/>"
    "<line x1='14' y1='20' x2='14' y2='26' stroke='rgba(46,72,170,0.7)' stroke-width='1.4'/>"
    "<line x1='2' y1='14' x2='8' y2='14' stroke='rgba(46,72,170,0.7)' stroke-width='1.4'/>"
    "<line x1='20' y1='14' x2='26' y2='14' stroke='rgba(46,72,170,0.7)' stroke-width='1.4'/>"
    "</svg>"
)


def _css_block(mode: ThemeMode) -> str:
    """Return the full CSS block for ``mode``."""

    if mode == "light":
        palette = """
            --qnl-bg: #f5f7fb;
            --qnl-bg-2: #ecf0f8;
            --qnl-panel: rgba(255, 255, 255, 0.62);
            --qnl-panel-solid: #ffffff;
            --qnl-border: rgba(36, 56, 110, 0.14);
            --qnl-text: #1c2030;
            --qnl-text-dim: #5a6275;
            --qnl-accent: #2e48aa;
            --qnl-accent-2: #6a8bff;
            --qnl-accent-soft: rgba(46, 72, 170, 0.18);
            --qnl-good: #2f9e44;
            --qnl-warn: #f08c00;
            --qnl-bad: #e03131;
            --qnl-shadow-1: 0 4px 24px rgba(15, 30, 80, 0.06);
            --qnl-shadow-2: 0 10px 40px rgba(15, 30, 80, 0.08);
            --qnl-noise-opacity: 0.04;
        """
        cursor_url = _CURSOR_SVG_LIGHT
        animated_bg = """
            background:
                radial-gradient(circle at 18% 20%, rgba(122,162,255,0.18) 0%, transparent 45%),
                radial-gradient(circle at 82% 78%, rgba(255,157,77,0.13) 0%, transparent 55%),
                radial-gradient(circle at 52% 50%, rgba(81,207,102,0.08) 0%, transparent 60%),
                linear-gradient(180deg, #f5f7fb 0%, #ecf0f8 100%);
        """
    else:
        palette = """
            --qnl-bg: #060912;
            --qnl-bg-2: #0b101c;
            --qnl-panel: rgba(20, 26, 38, 0.55);
            --qnl-panel-solid: #141a26;
            --qnl-border: rgba(122, 162, 255, 0.16);
            --qnl-text: #e8eaef;
            --qnl-text-dim: #a5acbb;
            --qnl-accent: #7aa2ff;
            --qnl-accent-2: #9ab8ff;
            --qnl-accent-soft: rgba(122, 162, 255, 0.18);
            --qnl-good: #51cf66;
            --qnl-warn: #ffd43b;
            --qnl-bad: #ff6b6b;
            --qnl-shadow-1: 0 4px 24px rgba(0, 0, 0, 0.35);
            --qnl-shadow-2: 0 10px 40px rgba(0, 0, 0, 0.45);
            --qnl-noise-opacity: 0.08;
        """
        cursor_url = _CURSOR_SVG_DARK
        animated_bg = """
            background:
                radial-gradient(circle at 18% 20%, rgba(122,162,255,0.18) 0%, transparent 50%),
                radial-gradient(circle at 82% 78%, rgba(255,157,77,0.10) 0%, transparent 55%),
                radial-gradient(circle at 50% 50%, rgba(81,207,102,0.05) 0%, transparent 60%),
                linear-gradient(180deg, #060912 0%, #090e1b 100%);
        """

    return f"""
:root {{
    {palette}
    --qnl-radius: 14px;
    --qnl-radius-lg: 18px;
    --qnl-transition: 220ms cubic-bezier(.2, .8, .2, 1);
    --qnl-glass-blur: 18px;
    --qnl-cursor: url("{cursor_url}") 14 14, crosshair;
}}

/* Fonts ------------------------------------------------------------- */
html, body, [class*="css"], [data-testid] {{
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
        Helvetica, Arial, sans-serif !important;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    cursor: var(--qnl-cursor);
}}
h1, h2, h3, h4 {{
    font-family: "Newsreader", "Inter", Georgia, serif !important;
    font-weight: 600;
    letter-spacing: -0.012em;
}}
code, pre, .stCode, [class*="monospace"] {{
    font-family: "JetBrains Mono", "SF Mono", Menlo, monospace !important;
    font-size: 0.86rem !important;
}}

/* Animated layered background ------------------------------------- */
@keyframes qnl-bg-shift {{
    0%   {{ transform: translate3d(0%, 0%, 0); }}
    50%  {{ transform: translate3d(-1.6%, 1.2%, 0); }}
    100% {{ transform: translate3d(0%, 0%, 0); }}
}}
.stApp {{
    {animated_bg}
    background-attachment: fixed;
    position: relative;
    overflow-x: hidden;
}}
.stApp::before {{
    content: "";
    position: fixed;
    inset: -8% -8%;
    z-index: 0;
    pointer-events: none;
    {animated_bg}
    animation: qnl-bg-shift 24s ease-in-out infinite;
    opacity: 0.55;
}}
.stApp::after {{
    content: "";
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background-image:
        url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.6'/></svg>");
    opacity: var(--qnl-noise-opacity);
    mix-blend-mode: overlay;
}}
section.main > div.block-container {{
    position: relative;
    z-index: 1;
    padding-top: 2.2rem;
    max-width: 1340px;
}}

/* Page mount animation -------------------------------------------- */
@keyframes qnl-rise {{
    0%   {{ opacity: 0; transform: translateY(14px) scale(0.995); filter: blur(4px); }}
    100% {{ opacity: 1; transform: none; filter: blur(0); }}
}}
section.main > div.block-container > div:first-child {{
    animation: qnl-rise 520ms cubic-bezier(.2, .8, .2, 1) both;
}}
section.main > div.block-container > div:nth-child(n+2) {{
    animation: qnl-rise 620ms cubic-bezier(.2, .8, .2, 1) both;
    animation-delay: 80ms;
}}

/* Headings -------------------------------------------------------- */
h1 {{ font-size: 2.25rem; line-height: 1.18; }}
h1::after {{
    content: "";
    display: block;
    width: 3.4rem;
    height: 2px;
    background: linear-gradient(90deg, var(--qnl-accent), transparent);
    margin-top: 0.5rem;
    border-radius: 2px;
}}
h2 {{ font-size: 1.5rem; margin-top: 1.6rem; }}
h3 {{ font-size: 1.15rem; }}
hr {{ border-color: var(--qnl-border) !important; opacity: 0.9; }}

/* Glass panels for metrics, expanders, charts --------------------- */
div[data-testid="stMetric"],
details[data-testid="stExpander"],
div[data-testid="stPlotlyChart"] {{
    background: var(--qnl-panel);
    backdrop-filter: blur(var(--qnl-glass-blur)) saturate(140%);
    -webkit-backdrop-filter: blur(var(--qnl-glass-blur)) saturate(140%);
    border: 1px solid var(--qnl-border);
    border-radius: var(--qnl-radius);
    box-shadow: var(--qnl-shadow-1);
    transition: transform var(--qnl-transition),
                border-color var(--qnl-transition),
                box-shadow var(--qnl-transition);
}}
div[data-testid="stMetric"] {{
    padding: 0.95rem 1.1rem 0.85rem;
    min-height: 96px;
}}
div[data-testid="stMetric"]:hover,
div[data-testid="stPlotlyChart"]:hover {{
    transform: translateY(-2px);
    border-color: var(--qnl-accent);
    box-shadow: var(--qnl-shadow-2);
}}
div[data-testid="stMetricValue"] {{
    font-variant-numeric: tabular-nums;
    font-weight: 600;
}}
div[data-testid="stPlotlyChart"] {{ padding: 0.5rem; }}
details[data-testid="stExpander"] {{ overflow: hidden; }}
details[data-testid="stExpander"] > summary {{
    padding: 0.65rem 1rem;
    font-weight: 500;
    transition: background var(--qnl-transition);
}}
details[data-testid="stExpander"] > summary:hover {{
    background: var(--qnl-accent-soft);
}}

/* Sidebar glass --------------------------------------------------- */
section[data-testid="stSidebar"] {{
    background: var(--qnl-panel) !important;
    backdrop-filter: blur(22px) saturate(140%);
    -webkit-backdrop-filter: blur(22px) saturate(140%);
    border-right: 1px solid var(--qnl-border);
}}
section[data-testid="stSidebar"] h2,
section[data-testid="stSidebar"] h3 {{
    color: var(--qnl-text);
    margin-top: 0.8rem;
}}

/* Sliders --------------------------------------------------------- */
div[data-baseweb="slider"] > div {{ transition: background var(--qnl-transition); }}
div[data-baseweb="slider"] [role="slider"] {{ cursor: var(--qnl-cursor); }}

/* Buttons --------------------------------------------------------- */
button[kind="primary"],
button[kind="secondary"] {{
    transition: transform var(--qnl-transition), filter var(--qnl-transition), box-shadow var(--qnl-transition);
    border-radius: 10px;
}}
button[kind="primary"]:hover,
button[kind="secondary"]:hover {{
    transform: translateY(-1px);
    filter: brightness(1.08);
    box-shadow: 0 6px 18px var(--qnl-accent-soft);
}}

/* Page links ------------------------------------------------------ */
a[data-testid="stPageLink-NavLink"] {{
    display: inline-flex;
    align-items: center;
    padding: 0.6rem 0.95rem;
    background: var(--qnl-panel);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid var(--qnl-border);
    border-radius: 10px;
    color: var(--qnl-text) !important;
    text-decoration: none !important;
    transition: border-color var(--qnl-transition), background var(--qnl-transition), transform var(--qnl-transition);
}}
a[data-testid="stPageLink-NavLink"]:hover {{
    border-color: var(--qnl-accent);
    background: var(--qnl-accent-soft);
    transform: translateY(-1px);
}}

/* Code blocks ----------------------------------------------------- */
pre, code {{
    background: var(--qnl-bg-2) !important;
    border-radius: 8px;
    border: 1px solid var(--qnl-border);
}}

/* Validation pill tooltips --------------------------------------- */
div[data-testid="stMarkdownContainer"] span[title] {{ cursor: help; }}
[title] {{ transition: opacity var(--qnl-transition); }}

/* Scrollbar ------------------------------------------------------- */
::-webkit-scrollbar {{ width: 10px; height: 10px; }}
::-webkit-scrollbar-thumb {{
    background: var(--qnl-accent-soft);
    border-radius: 5px;
}}
::-webkit-scrollbar-thumb:hover {{ background: var(--qnl-accent); }}

/* Theme toggle look ---------------------------------------------- */
div[data-testid="stToggle"] label {{
    font-size: 0.85rem;
    color: var(--qnl-text-dim);
}}

/* Reduce loud emoji presence on h1 -------------------------------- */
h1 .emoji {{ font-size: 0.8em; opacity: 0.7; margin-right: 0.2em; }}
"""


def _render_theme_toggle() -> None:
    """Render the light/dark toggle in the sidebar and update session state."""
    current = _current_mode()
    with st.sidebar:
        st.html(
            '<div style="margin-top:0.6rem;margin-bottom:0.4rem;'
            'font-size:0.78rem;color:var(--qnl-text-dim);letter-spacing:0.06em;'
            'text-transform:uppercase;">Appearance</div>'
        )
        choice = st.radio(
            "Theme",
            options=["Dark", "Light"],
            index=0 if current == "dark" else 1,
            horizontal=True,
            label_visibility="collapsed",
            key="qnl_theme_toggle_radio",
        )
        new_mode: ThemeMode = "dark" if choice == "Dark" else "light"
        if new_mode != current:
            st.session_state[THEME_STATE_KEY] = new_mode
            st.rerun()


def _inject_via_iframe(css: str, mode: str) -> None:
    """Inject CSS into the *parent* document via a zero-height iframe.

    Both ``st.markdown(..., unsafe_allow_html=True)`` and ``st.html`` lose
    ``<style>`` blocks to DOMPurify in current Streamlit. Running a tiny
    JS payload inside ``components.v1.html`` lets us reach
    ``window.parent.document.head`` and append a real ``<style>``.
    """
    css_literal = json.dumps(css)
    href_literal = json.dumps(_FONT_HREF)
    mode_literal = json.dumps(mode)
    script = f"""
<!doctype html>
<html><head><meta charset="utf-8"></head><body>
<script>
(function () {{
  try {{
    var doc = (window.parent && window.parent.document) || document;
    // Fonts (preconnect + stylesheet) — install once.
    if (!doc.getElementById('qnl-fonts-preconnect-1')) {{
      var pc1 = doc.createElement('link');
      pc1.id = 'qnl-fonts-preconnect-1';
      pc1.rel = 'preconnect';
      pc1.href = 'https://fonts.googleapis.com';
      doc.head.appendChild(pc1);
      var pc2 = doc.createElement('link');
      pc2.id = 'qnl-fonts-preconnect-2';
      pc2.rel = 'preconnect';
      pc2.href = 'https://fonts.gstatic.com';
      pc2.setAttribute('crossorigin', '');
      doc.head.appendChild(pc2);
    }}
    if (!doc.getElementById('qnl-fonts-link')) {{
      var fl = doc.createElement('link');
      fl.id = 'qnl-fonts-link';
      fl.rel = 'stylesheet';
      fl.href = {href_literal};
      doc.head.appendChild(fl);
    }}
    // Replace prior theme style, if any, then install current mode.
    var old = doc.getElementById('qnl-theme-style');
    if (old) old.parentNode.removeChild(old);
    var style = doc.createElement('style');
    style.id = 'qnl-theme-style';
    style.setAttribute('data-mode', {mode_literal});
    style.appendChild(doc.createTextNode({css_literal}));
    doc.head.appendChild(style);
  }} catch (err) {{
    // No-op — Streamlit will still render with its default theme.
    console && console.warn && console.warn('qnl theme inject failed', err);
  }}
}})();
</script>
</body></html>
"""
    components.html(script, height=0, width=0)


def inject_styles() -> None:
    """Inject the active theme CSS + the sidebar theme toggle.

    Call once per page right after :func:`st.set_page_config`.
    """
    if THEME_STATE_KEY not in st.session_state:
        st.session_state[THEME_STATE_KEY] = "dark"
    mode = _current_mode()
    _inject_via_iframe(_css_block(mode), mode)
    _render_theme_toggle()
