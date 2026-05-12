"""Emit `web/__tests__/parity_fixtures.json` from the Python reference engine.

Run from repo root:

    python tests/generate_parity_fixtures.py

The TypeScript port (in `web/lib`) is gated against this file by Vitest:
every TS engine output must match the Python reference to 1e-12 absolute
error, both real and imaginary parts. The Python engine therefore remains
the single source of numerical truth even when the user-facing app is
fully static.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from quantum_noise_lab import (
    amplitude_damping_kraus,
    analytical_amplitude_density,
    analytical_amplitude_fidelity,
    analytical_phase_density,
    analytical_phase_fidelity,
    apply_kraus_channel,
    density_matrix,
    depolarizing_kraus,
    eigenvalues,
    fidelity,
    ket_one,
    ket_zero,
    kraus_completeness_residual,
    phase_damping_kraus,
    plus_state,
    purity,
    repetition_success_protected,
    repetition_success_unprotected,
)


PARAM_GRID = [0.0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0]
DENSE_GRID = list(np.linspace(0.0, 1.0, 11))


def _mat(m: np.ndarray) -> list[list[list[float]]]:
    """Serialize a complex matrix as nested [re, im] pairs."""
    out: list[list[list[float]]] = []
    for i in range(m.shape[0]):
        row: list[list[float]] = []
        for j in range(m.shape[1]):
            row.append([float(np.real(m[i, j])), float(np.imag(m[i, j]))])
        out.append(row)
    return out


def _vec(v: np.ndarray) -> list[list[float]]:
    return [[float(np.real(z)), float(np.imag(z))] for z in v]


STATE_NAMES = {"ket0": ket_zero(), "ket1": ket_one(), "plus": plus_state()}


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    out_path = repo_root / "web" / "__tests__" / "parity_fixtures.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    fixtures: dict = {
        "schema_version": 1,
        "tolerance": 1e-12,
        "states": {name: _vec(psi) for name, psi in STATE_NAMES.items()},
        "density_matrices": {name: _mat(density_matrix(psi)) for name, psi in STATE_NAMES.items()},
        "channels": {},
        "fidelity_vs_plus": {},
        "purity_curves": {},
        "eigenvalue_grids": {},
        "analytical": {
            "rho_AD": [{"gamma": float(g), "rho": _mat(analytical_amplitude_density(float(g)))} for g in DENSE_GRID],
            "rho_PD": [{"lambda": float(lam), "rho": _mat(analytical_phase_density(float(lam)))} for lam in DENSE_GRID],
            "F_AD": [{"gamma": float(g), "F": float(analytical_amplitude_fidelity(float(g)))} for g in DENSE_GRID],
            "F_PD": [{"lambda": float(lam), "F": float(analytical_phase_fidelity(float(lam)))} for lam in DENSE_GRID],
        },
        "qec": [
            {"p": float(p), "unprot": float(repetition_success_unprotected(float(p))), "prot": float(repetition_success_protected(float(p)))}
            for p in DENSE_GRID
        ],
    }

    channel_table = {
        "amplitude_damping": amplitude_damping_kraus,
        "phase_damping": phase_damping_kraus,
        "depolarizing": depolarizing_kraus,
    }

    for ch_name, kraus_fn in channel_table.items():
        per_channel = []
        for param in PARAM_GRID:
            ops = kraus_fn(float(param))
            residual = float(kraus_completeness_residual(ops))
            outputs: dict[str, list[list[list[float]]]] = {}
            for state_name, psi in STATE_NAMES.items():
                rho0 = density_matrix(psi)
                outputs[state_name] = _mat(apply_kraus_channel(rho0, ops))
            per_channel.append(
                {
                    "param": float(param),
                    "kraus": [_mat(np.asarray(k)) for k in ops],
                    "completeness_residual": residual,
                    "applied_to": outputs,
                }
            )
        fixtures["channels"][ch_name] = per_channel

    # Fidelity vs |+> across the dense grid for all three channels.
    for ch_name, kraus_fn in channel_table.items():
        rho_plus = density_matrix(plus_state())
        fid_curve = []
        purity_curve = []
        eig_grid = []
        for param in DENSE_GRID:
            ops = kraus_fn(float(param))
            rho_t = apply_kraus_channel(rho_plus, ops)
            fid_curve.append({"param": float(param), "F": float(fidelity(rho_t, plus_state()))})
            purity_curve.append({"param": float(param), "P": float(purity(rho_t))})
            eigs = eigenvalues(rho_t).tolist()
            eig_grid.append({"param": float(param), "eigs": [float(e) for e in eigs]})
        fixtures["fidelity_vs_plus"][ch_name] = fid_curve
        fixtures["purity_curves"][ch_name] = purity_curve
        fixtures["eigenvalue_grids"][ch_name] = eig_grid

    out_path.write_text(json.dumps(fixtures, indent=2))
    print(f"Wrote {out_path} ({out_path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
