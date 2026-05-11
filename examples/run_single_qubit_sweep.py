"""Headless example: sweep amplitude and phase damping over the |+⟩ state.

Run from the project root:

    python examples/run_single_qubit_sweep.py

Prints a small CSV table to stdout and writes the same data to
``results/data/single_qubit_sweep.csv``.
"""

from __future__ import annotations

import csv
from pathlib import Path

import numpy as np

from quantum_noise_lab import (
    amplitude_damping_kraus,
    analytical_amplitude_fidelity,
    analytical_phase_fidelity,
    apply_kraus_channel,
    density_matrix,
    fidelity,
    phase_damping_kraus,
    plus_state,
    purity,
)


def main(n_points: int = 11) -> None:
    grid = np.linspace(0.0, 1.0, n_points)
    rho_initial = density_matrix(plus_state())
    rows = []
    for param in grid:
        param = float(param)
        rho_ad = apply_kraus_channel(rho_initial, amplitude_damping_kraus(param))
        rho_pd = apply_kraus_channel(rho_initial, phase_damping_kraus(param))
        rows.append(
            {
                "param": f"{param:.3f}",
                "F_AD_numeric": f"{fidelity(rho_ad, plus_state()):.6f}",
                "F_AD_analytical": f"{analytical_amplitude_fidelity(param):.6f}",
                "purity_AD": f"{purity(rho_ad):.6f}",
                "F_PD_numeric": f"{fidelity(rho_pd, plus_state()):.6f}",
                "F_PD_analytical": f"{analytical_phase_fidelity(param):.6f}",
                "purity_PD": f"{purity(rho_pd):.6f}",
            }
        )

    fieldnames = list(rows[0].keys())
    header = ",".join(fieldnames)
    print(header)
    for row in rows:
        print(",".join(row[k] for k in fieldnames))

    out_path = Path(__file__).resolve().parents[1] / "results" / "data" / "single_qubit_sweep.csv"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"\nWrote {out_path}")


if __name__ == "__main__":
    main()
