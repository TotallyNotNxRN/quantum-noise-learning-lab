"""Architecture / import-boundary tests.

Enforces the locked separation between the scientific engine (``src/``) and
the UI layer (``app/``):

* ``src/`` may not import any UI / plotting library.
* ``app/`` pages and components may not redefine channel, metric, or
  density-matrix mathematics; they must call into ``quantum_noise_lab``.
"""

from __future__ import annotations

import ast
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]
SRC_ROOT = REPO_ROOT / "src" / "quantum_noise_lab"
APP_ROOT = REPO_ROOT / "app"

FORBIDDEN_IN_SRC = {"streamlit", "plotly", "matplotlib", "dash"}

FORBIDDEN_IN_APP_NAMES = {
    "amplitude_damping_kraus",
    "phase_damping_kraus",
    "depolarizing_kraus",
    "apply_kraus_channel",
    "fidelity",
    "purity",
    "density_matrix",
    "analytical_amplitude_density",
    "analytical_phase_density",
}


def _python_files(root: Path) -> list[Path]:
    if not root.exists():
        return []
    return [p for p in root.rglob("*.py") if "__pycache__" not in p.parts]


def _imported_module_root(node: ast.AST) -> str | None:
    if isinstance(node, ast.Import):
        if node.names:
            return node.names[0].name.split(".")[0]
    if isinstance(node, ast.ImportFrom) and node.module:
        return node.module.split(".")[0]
    return None


def test_src_does_not_import_ui_or_plotting_libraries():
    offenders = []
    for path in _python_files(SRC_ROOT):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            root = _imported_module_root(node)
            if root in FORBIDDEN_IN_SRC:
                offenders.append(f"{path.relative_to(REPO_ROOT)}: imports {root!r}")
    assert not offenders, "Forbidden UI/plot imports in src:\n" + "\n".join(offenders)


def test_app_does_not_redefine_engine_math():
    if not APP_ROOT.exists():
        pytest.skip("app/ does not exist yet")
    offenders = []
    app_python_files = _python_files(APP_ROOT)
    if not app_python_files:
        pytest.skip("no python files in app/")
    for path in app_python_files:
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) and node.name in FORBIDDEN_IN_APP_NAMES:
                offenders.append(
                    f"{path.relative_to(REPO_ROOT)}:{node.lineno}: redefines engine function {node.name!r}"
                )
    assert not offenders, (
        "app/ must call into quantum_noise_lab; engine math reimplemented here:\n"
        + "\n".join(offenders)
    )


def test_app_imports_engine_when_present():
    """If app/ exists with python files, at least one must import the engine."""
    if not APP_ROOT.exists():
        pytest.skip("app/ does not exist yet")
    app_python_files = _python_files(APP_ROOT)
    if not app_python_files:
        pytest.skip("no python files in app/")
    importing = []
    for path in app_python_files:
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if isinstance(node, (ast.Import, ast.ImportFrom)):
                root = _imported_module_root(node)
                if root == "quantum_noise_lab":
                    importing.append(path.name)
                    break
    assert importing, "expected at least one app/ file to import quantum_noise_lab"
