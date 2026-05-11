"""Plotly figure factories used across the lab pages.

All scientific input arrays come from ``quantum_noise_lab``; this module
contains only display logic (sizes, titles, colorbars, hover formatting).

Figures use a dark template that matches the rest of the app's theme.
"""

from __future__ import annotations

from typing import Sequence

import numpy as np
import plotly.graph_objects as go

from app.components.theme import plotly_layout_defaults


_DIVERGING_SCALE = "RdBu"
_LAYOUT_MARGIN = dict(l=40, r=20, t=50, b=40)
_ACCENT = "#7aa2ff"
_ACCENT_SOFT = "#3b5bdb"
_GOOD = "#51cf66"
_WARN = "#fcc419"
_BAD = "#ff6b6b"


def _basis_labels(dim: int) -> list[str]:
    if dim == 2:
        return ["|0⟩", "|1⟩"]
    return [f"|{i}⟩" for i in range(dim)]


def _apply_dark_defaults(fig: go.Figure, *, height: int) -> go.Figure:
    fig.update_layout(margin=_LAYOUT_MARGIN, height=height, **plotly_layout_defaults())
    return fig


def density_matrix_heatmap(rho: np.ndarray, title: str = "Density matrix ρ") -> go.Figure:
    """Real-part heatmap of ρ with hovertext showing real and imaginary parts."""
    rho = np.asarray(rho, dtype=np.complex128)
    dim = rho.shape[0]
    labels = _basis_labels(dim)
    real = np.real(rho)
    imag = np.imag(rho)
    hovertext = [
        [f"Re = {real[i, j]: .4f}<br>Im = {imag[i, j]: .4f}" for j in range(dim)]
        for i in range(dim)
    ]
    fig = go.Figure(
        data=go.Heatmap(
            z=real,
            x=labels,
            y=labels,
            text=[[f"{real[i, j]:.3f}" for j in range(dim)] for i in range(dim)],
            texttemplate="%{text}",
            zmin=-1.0,
            zmax=1.0,
            colorscale=_DIVERGING_SCALE,
            hoverinfo="text",
            hovertext=hovertext,
            colorbar=dict(title="Re(ρ)"),
        )
    )
    _apply_dark_defaults(fig, height=360)
    fig.update_layout(
        title=title,
        xaxis=dict(side="top", title="column"),
        yaxis=dict(autorange="reversed", title="row"),
    )
    return fig


def imag_part_heatmap(rho: np.ndarray, title: str = "Im(ρ)") -> go.Figure:
    rho = np.asarray(rho, dtype=np.complex128)
    dim = rho.shape[0]
    labels = _basis_labels(dim)
    imag = np.imag(rho)
    fig = go.Figure(
        data=go.Heatmap(
            z=imag,
            x=labels,
            y=labels,
            text=[[f"{imag[i, j]:.3f}" for j in range(dim)] for i in range(dim)],
            texttemplate="%{text}",
            zmin=-1.0,
            zmax=1.0,
            colorscale=_DIVERGING_SCALE,
            colorbar=dict(title="Im(ρ)"),
        )
    )
    _apply_dark_defaults(fig, height=300)
    fig.update_layout(
        title=title,
        xaxis=dict(side="top"),
        yaxis=dict(autorange="reversed"),
    )
    return fig


def difference_matrix_heatmap(diff: np.ndarray, title: str = "Δρ = ρ_noisy − ρ") -> go.Figure:
    diff = np.asarray(diff, dtype=np.complex128)
    dim = diff.shape[0]
    labels = _basis_labels(dim)
    real = np.real(diff)
    span = float(max(np.abs(real).max(), 1e-12))
    fig = go.Figure(
        data=go.Heatmap(
            z=real,
            x=labels,
            y=labels,
            text=[[f"{real[i, j]:+.3f}" for j in range(dim)] for i in range(dim)],
            texttemplate="%{text}",
            zmin=-span,
            zmax=span,
            colorscale=_DIVERGING_SCALE,
            colorbar=dict(title="Re(Δρ)"),
        )
    )
    _apply_dark_defaults(fig, height=320)
    fig.update_layout(
        title=title,
        xaxis=dict(side="top"),
        yaxis=dict(autorange="reversed"),
    )
    return fig


def probability_bar(probs: Sequence[float], labels: Sequence[str], title: str = "Measurement probabilities") -> go.Figure:
    fig = go.Figure(
        data=go.Bar(
            x=list(labels),
            y=list(probs),
            marker_color=_ACCENT,
            marker_line_color=_ACCENT_SOFT,
            marker_line_width=1,
            text=[f"{p:.3f}" for p in probs],
            textposition="auto",
        )
    )
    _apply_dark_defaults(fig, height=300)
    fig.update_layout(
        title=title,
        yaxis=dict(range=[0.0, 1.0], title="Probability"),
        xaxis_title="Outcome",
    )
    return fig


def metric_curve(
    x: Sequence[float],
    y: Sequence[float],
    title: str,
    xlabel: str,
    ylabel: str,
    *,
    name: str = "simulated",
    y_range: tuple[float, float] | None = (0.0, 1.0),
) -> go.Figure:
    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=list(x),
            y=list(y),
            mode="lines+markers",
            name=name,
            line=dict(color=_ACCENT, width=2.5),
            marker=dict(size=6),
        )
    )
    _apply_dark_defaults(fig, height=320)
    fig.update_layout(
        title=title,
        xaxis_title=xlabel,
        yaxis_title=ylabel,
        yaxis=dict(range=list(y_range)) if y_range else None,
        legend=dict(orientation="h", yanchor="bottom", y=1.0, xanchor="right", x=1.0),
    )
    return fig


def overlay_curves(
    x: Sequence[float],
    series: list[tuple[str, Sequence[float], str]],
    title: str,
    xlabel: str,
    ylabel: str,
    *,
    y_range: tuple[float, float] | None = (0.0, 1.0),
) -> go.Figure:
    """Plot several labeled (name, y, color) lines on the same axes."""
    fig = go.Figure()
    for name, y, color in series:
        fig.add_trace(
            go.Scatter(
                x=list(x),
                y=list(y),
                mode="lines+markers",
                name=name,
                line=dict(color=color, width=2.5),
                marker=dict(size=6),
            )
        )
    _apply_dark_defaults(fig, height=340)
    fig.update_layout(
        title=title,
        xaxis_title=xlabel,
        yaxis_title=ylabel,
        yaxis=dict(range=list(y_range)) if y_range else None,
        legend=dict(orientation="h", yanchor="bottom", y=1.0, xanchor="right", x=1.0),
    )
    return fig


def eigenvalue_bar(eigs: Sequence[float], title: str = "Eigenvalues of ρ") -> go.Figure:
    eigs = list(eigs)
    labels = [f"λ_{i}" for i in range(len(eigs))]
    fig = go.Figure(
        data=go.Bar(
            x=labels,
            y=eigs,
            marker_color=_GOOD,
            marker_line_color="#2f9e44",
            marker_line_width=1,
            text=[f"{e:.4f}" for e in eigs],
            textposition="auto",
        )
    )
    _apply_dark_defaults(fig, height=280)
    fig.update_layout(
        title=title,
        yaxis=dict(range=[-0.05, 1.05], title="Eigenvalue"),
    )
    return fig
