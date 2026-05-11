"""Generate static portfolio figures with matplotlib.

Run from the project root:

    python examples/generate_all_figures.py

Saves PNGs to ``results/figures/``.
"""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

from quantum_noise_lab import (
    amplitude_damping_kraus,
    analytical_amplitude_fidelity,
    analytical_phase_fidelity,
    apply_kraus_channel,
    density_matrix,
    depolarizing_kraus,
    fidelity,
    phase_damping_kraus,
    plus_state,
    purity,
    repetition_success_protected,
    repetition_success_unprotected,
    sweep_metric,
)

FIG_DIR = Path(__file__).resolve().parents[1] / "results" / "figures"


def _save(fig, name: str) -> Path:
    FIG_DIR.mkdir(parents=True, exist_ok=True)
    out_path = FIG_DIR / name
    fig.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    return out_path


def figure_fidelity_curves() -> Path:
    grid = np.linspace(0.0, 1.0, 51)
    rho_initial = density_matrix(plus_state())
    ad = sweep_metric(amplitude_damping_kraus, rho_initial, plus_state(), fidelity, grid)
    pd = sweep_metric(phase_damping_kraus, rho_initial, plus_state(), fidelity, grid)
    dp = sweep_metric(depolarizing_kraus, rho_initial, plus_state(), fidelity, grid)

    fig, ax = plt.subplots(figsize=(6.5, 4.0))
    ax.plot(grid, ad, label="amplitude damping", linewidth=2)
    ax.plot(grid, pd, label="phase damping", linewidth=2)
    ax.plot(grid, dp, label="depolarizing", linewidth=2)
    ax.set_xlabel("noise parameter")
    ax.set_ylabel("fidelity F(ρ, |+⟩)")
    ax.set_title("Fidelity of |+⟩ vs noise across three channels")
    ax.set_ylim(0.0, 1.05)
    ax.grid(alpha=0.3)
    ax.legend()
    return _save(fig, "fidelity_curves.png")


def figure_purity_curves() -> Path:
    grid = np.linspace(0.0, 1.0, 51)
    rho_initial = density_matrix(plus_state())
    ad = sweep_metric(amplitude_damping_kraus, rho_initial, plus_state(), lambda r, _: purity(r), grid)
    pd = sweep_metric(phase_damping_kraus, rho_initial, plus_state(), lambda r, _: purity(r), grid)
    dp = sweep_metric(depolarizing_kraus, rho_initial, plus_state(), lambda r, _: purity(r), grid)

    fig, ax = plt.subplots(figsize=(6.5, 4.0))
    ax.plot(grid, ad, label="amplitude damping", linewidth=2)
    ax.plot(grid, pd, label="phase damping", linewidth=2)
    ax.plot(grid, dp, label="depolarizing", linewidth=2)
    ax.set_xlabel("noise parameter")
    ax.set_ylabel("purity Tr(ρ²)")
    ax.set_title("Purity of |+⟩ vs noise across three channels")
    ax.set_ylim(0.45, 1.05)
    ax.grid(alpha=0.3)
    ax.legend()
    return _save(fig, "purity_curves.png")


def figure_validation_overlay() -> Path:
    grid = np.linspace(0.0, 1.0, 51)
    rho_initial = density_matrix(plus_state())
    f_ad_num = sweep_metric(amplitude_damping_kraus, rho_initial, plus_state(), fidelity, grid)
    f_ad_ana = np.array([analytical_amplitude_fidelity(float(g)) for g in grid])
    f_pd_num = sweep_metric(phase_damping_kraus, rho_initial, plus_state(), fidelity, grid)
    f_pd_ana = np.array([analytical_phase_fidelity(float(g)) for g in grid])

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4))
    ax1.plot(grid, f_ad_num, label="simulated", linewidth=2)
    ax1.plot(grid, f_ad_ana, label="analytical", linewidth=2, linestyle="--")
    ax1.set_title("Amplitude damping — simulated vs analytical")
    ax1.set_xlabel("γ"); ax1.set_ylabel("fidelity"); ax1.set_ylim(0.0, 1.05)
    ax1.grid(alpha=0.3); ax1.legend()

    ax2.plot(grid, f_pd_num, label="simulated", linewidth=2)
    ax2.plot(grid, f_pd_ana, label="analytical", linewidth=2, linestyle="--")
    ax2.set_title("Phase damping — simulated vs analytical")
    ax2.set_xlabel("λ"); ax2.set_ylabel("fidelity"); ax2.set_ylim(0.0, 1.05)
    ax2.grid(alpha=0.3); ax2.legend()

    fig.tight_layout()
    return _save(fig, "validation_overlay.png")


def figure_qec_curves() -> Path:
    grid = np.linspace(0.0, 1.0, 101)
    unprot = np.array([repetition_success_unprotected(float(p)) for p in grid])
    prot = np.array([repetition_success_protected(float(p)) for p in grid])

    fig, ax = plt.subplots(figsize=(6.5, 4.0))
    ax.plot(grid, unprot, label="unprotected (1 − p)", linewidth=2)
    ax.plot(grid, prot, label="3-rep majority vote", linewidth=2)
    ax.axvline(0.5, color="gray", linestyle=":", label="p = 1/2 break-even")
    ax.set_xlabel("per-bit flip probability p")
    ax.set_ylabel("P(success)")
    ax.set_title("Classical-style repetition code success vs noise")
    ax.set_ylim(0.0, 1.05)
    ax.grid(alpha=0.3); ax.legend()
    return _save(fig, "qec_curves.png")


def main() -> None:
    paths = [
        figure_fidelity_curves(),
        figure_purity_curves(),
        figure_validation_overlay(),
        figure_qec_curves(),
    ]
    print("Wrote:")
    for p in paths:
        print(f"  {p}")


if __name__ == "__main__":
    main()
