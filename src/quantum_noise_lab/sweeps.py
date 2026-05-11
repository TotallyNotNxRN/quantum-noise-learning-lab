"""Parameter sweeps over noise channels.

These helpers run the engine across a parameter grid and return either a
list of post-channel density matrices or a NumPy array of metric values.
"""

from __future__ import annotations

from typing import Callable, Iterable, List

import numpy as np

from .noise import apply_kraus_channel


def sweep_noise(
    channel_kraus_fn: Callable[[float], List[np.ndarray]],
    rho_initial: np.ndarray,
    param_grid: Iterable[float],
) -> List[np.ndarray]:
    """Apply ``channel_kraus_fn(p)`` to ``rho_initial`` for each ``p`` in the grid.

    Returns one post-channel density matrix per grid point, in order.
    """
    grid = np.asarray(list(param_grid), dtype=np.float64)
    if grid.ndim != 1:
        raise ValueError(f"param_grid must be 1-D, got shape {grid.shape}")
    return [apply_kraus_channel(rho_initial, channel_kraus_fn(float(p))) for p in grid]


def sweep_metric(
    channel_kraus_fn: Callable[[float], List[np.ndarray]],
    rho_initial: np.ndarray,
    reference: np.ndarray,
    metric_fn: Callable[[np.ndarray, np.ndarray], float],
    param_grid: Iterable[float],
) -> np.ndarray:
    """Compute ``metric_fn(rho_p, reference)`` along the parameter grid.

    Returns a 1-D ``np.ndarray[float64]`` of the same length as ``param_grid``.
    """
    grid = np.asarray(list(param_grid), dtype=np.float64)
    if grid.ndim != 1:
        raise ValueError(f"param_grid must be 1-D, got shape {grid.shape}")
    out = np.empty(grid.shape[0], dtype=np.float64)
    for idx, p in enumerate(grid):
        rho_p = apply_kraus_channel(rho_initial, channel_kraus_fn(float(p)))
        out[idx] = float(metric_fn(rho_p, reference))
    return out
