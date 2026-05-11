"""Plotly figure factories used across the lab pages.

All scientific input arrays come from ``quantum_noise_lab``; this module
contains only display logic (sizes, titles, colorbars, hover formatting).
"""

from __future__ import annotations

from typing import Sequence

import numpy as np
import plotly.graph_objects as go


_DIVERGING_SCALE = "RdBu"
_SEQUENTIAL_SCALE = "Viridis"
_LAYOUT_MARGIN = dict(l=40, r=20, t=50, b=40)


def _basis_labels(dim: int) -> list[str]:
    if dim == 2:
        return ["|0⟩", "|1⟩"]
    return [f"|{i}⟩" for i in range(dim)]


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
    fig.update_layout(
        title=title,
        xaxis=dict(side="top", title="column"),
        yaxis=dict(autorange="reversed", title="row"),
        margin=_LAYOUT_MARGIN,
        height=360,
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
    fig.update_layout(
        title=title,
        xaxis=dict(side="top"),
        yaxis=dict(autorange="reversed"),
        margin=_LAYOUT_MARGIN,
        height=300,
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
    fig.update_layout(
        title=title,
        xaxis=dict(side="top"),
        yaxis=dict(autorange="reversed"),
        margin=_LAYOUT_MARGIN,
        height=320,
    )
    return fig


def probability_bar(probs: Sequence[float], labels: Sequence[str], title: str = "Measurement probabilities") -> go.Figure:
    fig = go.Figure(
        data=go.Bar(
            x=list(labels),
            y=list(probs),
            marker_color="#3b5bdb",
            text=[f"{p:.3f}" for p in probs],
            textposition="auto",
        )
    )
    fig.update_layout(
        title=title,
        yaxis=dict(range=[0.0, 1.0], title="Probability"),
        xaxis_title="Outcome",
        margin=_LAYOUT_MARGIN,
        height=300,
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
            line=dict(color="#3b5bdb", width=2),
        )
    )
    fig.update_layout(
        title=title,
        xaxis_title=xlabel,
        yaxis_title=ylabel,
        yaxis=dict(range=list(y_range)) if y_range else None,
        margin=_LAYOUT_MARGIN,
        height=320,
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
                line=dict(color=color, width=2),
            )
        )
    fig.update_layout(
        title=title,
        xaxis_title=xlabel,
        yaxis_title=ylabel,
        yaxis=dict(range=list(y_range)) if y_range else None,
        margin=_LAYOUT_MARGIN,
        height=340,
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
            marker_color="#2f9e44",
            text=[f"{e:.4f}" for e in eigs],
            textposition="auto",
        )
    )
    fig.update_layout(
        title=title,
        yaxis=dict(range=[-0.05, 1.05], title="Eigenvalue"),
        margin=_LAYOUT_MARGIN,
        height=280,
    )
    return fig
