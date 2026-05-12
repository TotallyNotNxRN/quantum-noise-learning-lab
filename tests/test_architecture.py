"""Architecture / import-boundary tests for the Python reference engine.

The Python engine in ``src/quantum_noise_lab`` is the canonical numerical
reference; the user-facing app now lives in ``web/`` (Next.js + TypeScript)
and is gated against the Python output via Vitest parity tests.

This test pins one invariant for the reference engine: it must not pull in
any plotting / UI library. The engine has to remain importable in a
plain-Python environment with only NumPy + SciPy.
"""

from __future__ import annotations

import ast
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
SRC_ROOT = REPO_ROOT / "src" / "quantum_noise_lab"

FORBIDDEN_IN_SRC = {"streamlit", "plotly", "matplotlib", "dash"}


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


def test_src_does_not_import_ui_or_plotting_libraries() -> None:
    offenders: list[str] = []
    for path in _python_files(SRC_ROOT):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            root = _imported_module_root(node)
            if root in FORBIDDEN_IN_SRC:
                offenders.append(f"{path.relative_to(REPO_ROOT)}: imports {root!r}")
    assert not offenders, "Forbidden UI/plot imports in src:\n" + "\n".join(offenders)
