"""Interactive 3D Bloch sphere for single-qubit states.

The Bloch sphere maps a qubit density matrix ρ to a vector inside the unit
ball via the Pauli decomposition:

    r = (Tr(ρ X), Tr(ρ Y), Tr(ρ Z))

|r| = 1 for pure states, |r| < 1 for mixed states. The Bloch sphere is a
visualization-only layer; the math always comes from ``quantum_noise_lab``.
"""

from __future__ import annotations

import numpy as np
import plotly.graph_objects as go

from app.components.theme import plotly_layout_defaults


_PAULI_X = np.array([[0, 1], [1, 0]], dtype=np.complex128)
_PAULI_Y = np.array([[0, -1j], [1j, 0]], dtype=np.complex128)
_PAULI_Z = np.array([[1, 0], [0, -1]], dtype=np.complex128)


def bloch_vector(rho: np.ndarray) -> tuple[float, float, float]:
    """Return the Bloch vector ``(rx, ry, rz)`` for a 2×2 density matrix."""
    rho = np.asarray(rho, dtype=np.complex128)
    rx = float(np.real(np.trace(rho @ _PAULI_X)))
    ry = float(np.real(np.trace(rho @ _PAULI_Y)))
    rz = float(np.real(np.trace(rho @ _PAULI_Z)))
    return rx, ry, rz


def _sphere_surface(n: int = 36) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Return parametric (X, Y, Z) for the unit sphere surface."""
    u = np.linspace(0.0, 2.0 * np.pi, n)
    v = np.linspace(0.0, np.pi, n // 2)
    uu, vv = np.meshgrid(u, v)
    x = np.cos(uu) * np.sin(vv)
    y = np.sin(uu) * np.sin(vv)
    z = np.cos(vv)
    return x, y, z


def _equator_ring() -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    t = np.linspace(0.0, 2.0 * np.pi, 100)
    return np.cos(t), np.sin(t), np.zeros_like(t)


def bloch_sphere(
    rho: np.ndarray,
    *,
    extra_vectors: list[tuple[np.ndarray, str, str]] | None = None,
    title: str = "Bloch sphere",
    height: int = 460,
) -> go.Figure:
    """Render an interactive Bloch sphere for ``rho`` (and optional extra vectors).

    ``extra_vectors`` is a list of ``(rho_other, label, color)`` triples
    plotted as faded reference arrows (e.g. the initial state behind the
    noisy current state).
    """
    rx, ry, rz = bloch_vector(rho)
    purity_radius = float(np.sqrt(rx * rx + ry * ry + rz * rz))
    defaults = plotly_layout_defaults()
    font_color = defaults["font"]["color"]
    is_light = defaults["template"] == "plotly_white"
    axis_color = "rgba(60, 70, 95, 0.6)" if is_light else "rgba(220, 220, 220, 0.55)"
    ring_color = "rgba(60, 80, 130, 0.35)" if is_light else "rgba(150, 170, 220, 0.45)"
    ring_minor = "rgba(60, 80, 130, 0.18)" if is_light else "rgba(150, 170, 220, 0.25)"

    sx, sy, sz = _sphere_surface()
    ex, ey, ez = _equator_ring()

    fig = go.Figure()

    fig.add_surface(
        x=sx,
        y=sy,
        z=sz,
        opacity=0.06,
        showscale=False,
        colorscale=[[0, "#7aa2ff"], [1, "#7aa2ff"]],
        hoverinfo="skip",
        lighting=dict(ambient=0.7, diffuse=0.4, specular=0.2),
        contours=dict(x=dict(show=False), y=dict(show=False), z=dict(show=False)),
    )

    fig.add_trace(
        go.Scatter3d(
            x=ex, y=ey, z=ez, mode="lines",
            line=dict(color=ring_color, width=2),
            hoverinfo="skip",
            showlegend=False,
            name="equator",
        )
    )
    # great circle in X-Z plane
    fig.add_trace(
        go.Scatter3d(
            x=np.cos(np.linspace(0, 2 * np.pi, 100)),
            y=np.zeros(100),
            z=np.sin(np.linspace(0, 2 * np.pi, 100)),
            mode="lines",
            line=dict(color=ring_minor, width=1.5),
            hoverinfo="skip", showlegend=False,
        )
    )
    # great circle in Y-Z plane
    fig.add_trace(
        go.Scatter3d(
            x=np.zeros(100),
            y=np.cos(np.linspace(0, 2 * np.pi, 100)),
            z=np.sin(np.linspace(0, 2 * np.pi, 100)),
            mode="lines",
            line=dict(color=ring_minor, width=1.5),
            hoverinfo="skip", showlegend=False,
        )
    )

    # Axis lines
    for (a, b, c) in [
        ((-1.1, 1.1), (0, 0), (0, 0)),
        ((0, 0), (-1.1, 1.1), (0, 0)),
        ((0, 0), (0, 0), (-1.1, 1.1)),
    ]:
        fig.add_trace(
            go.Scatter3d(
                x=list(a), y=list(b), z=list(c), mode="lines",
                line=dict(color=axis_color, width=2),
                hoverinfo="skip", showlegend=False,
            )
        )

    # Basis state labels
    fig.add_trace(
        go.Scatter3d(
            x=[0, 0, 1.18, 0, -1.18, 0],
            y=[0, 0, 0, 1.18, 0, -1.18],
            z=[1.18, -1.18, 0, 0, 0, 0],
            mode="text",
            text=["|0⟩", "|1⟩", "+x", "+y", "−x", "−y"],
            textfont=dict(color=font_color, size=13, family="Inter, sans-serif"),
            hoverinfo="skip",
            showlegend=False,
        )
    )

    # Optional faded reference vectors
    if extra_vectors:
        for ref_rho, ref_label, ref_color in extra_vectors:
            ax, ay, az = bloch_vector(ref_rho)
            fig.add_trace(
                go.Scatter3d(
                    x=[0, ax], y=[0, ay], z=[0, az],
                    mode="lines",
                    line=dict(color=ref_color, width=5, dash="dot"),
                    name=ref_label,
                    hovertemplate=f"{ref_label}<br>r=({ax:.3f}, {ay:.3f}, {az:.3f})<br>|r|={np.sqrt(ax*ax+ay*ay+az*az):.3f}<extra></extra>",
                )
            )

    # Main Bloch vector
    main_color = "#ff9d4d"
    fig.add_trace(
        go.Scatter3d(
            x=[0, rx], y=[0, ry], z=[0, rz],
            mode="lines",
            line=dict(color=main_color, width=8),
            name="ρ",
            hoverinfo="skip",
            showlegend=False,
        )
    )
    fig.add_trace(
        go.Scatter3d(
            x=[rx], y=[ry], z=[rz],
            mode="markers",
            marker=dict(color=main_color, size=8, line=dict(color="#ffffff", width=1)),
            name="ρ",
            hovertemplate=f"ρ<br>r=({rx:.3f}, {ry:.3f}, {rz:.3f})<br>|r|={purity_radius:.3f}<extra></extra>",
            showlegend=False,
        )
    )

    plot_bg = defaults["plot_bgcolor"]
    fig.update_layout(
        title=dict(text=title, font=dict(family="Inter, sans-serif", size=15, color=font_color)),
        paper_bgcolor=defaults["paper_bgcolor"],
        plot_bgcolor=plot_bg,
        template=defaults["template"],
        font=defaults["font"],
        height=height,
        margin=dict(l=0, r=0, t=40, b=0),
        scene=dict(
            xaxis=dict(visible=False, range=[-1.3, 1.3]),
            yaxis=dict(visible=False, range=[-1.3, 1.3]),
            zaxis=dict(visible=False, range=[-1.3, 1.3]),
            bgcolor=plot_bg,
            aspectmode="cube",
            camera=dict(
                eye=dict(x=1.5, y=1.5, z=1.1),
                up=dict(x=0, y=0, z=1),
            ),
        ),
        showlegend=False,
    )
    return fig
