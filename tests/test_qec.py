"""Tests for the 3-repetition bit-flip success formulas."""

from __future__ import annotations

import numpy as np
import pytest

from quantum_noise_lab.qec import (
    repetition_success_protected,
    repetition_success_unprotected,
)


GRID = np.linspace(0.0, 1.0, 11)


def test_unprotected_matches_one_minus_p():
    for p in GRID:
        assert abs(repetition_success_unprotected(float(p)) - (1.0 - float(p))) <= 1e-15


def test_protected_matches_closed_form():
    for p in GRID:
        pp = float(p)
        expected = (1.0 - pp) ** 3 + 3.0 * pp * (1.0 - pp) ** 2
        assert abs(repetition_success_protected(pp) - expected) <= 1e-15


def test_boundary_values():
    assert repetition_success_unprotected(0.0) == 1.0
    assert repetition_success_unprotected(1.0) == 0.0
    assert repetition_success_protected(0.0) == 1.0
    assert repetition_success_protected(1.0) == 0.0


def test_protected_equals_unprotected_at_one_half():
    p = 0.5
    assert abs(repetition_success_protected(p) - repetition_success_unprotected(p)) <= 1e-15


def test_protected_strictly_better_in_low_noise_regime():
    for p in (0.05, 0.1, 0.2, 0.4, 0.49):
        assert repetition_success_protected(p) > repetition_success_unprotected(p)


def test_protected_worse_above_one_half():
    for p in (0.51, 0.6, 0.75, 0.9):
        assert repetition_success_protected(p) < repetition_success_unprotected(p)


@pytest.mark.parametrize("bad", [-0.001, 1.001, float("nan"), float("inf")])
def test_qec_rejects_out_of_range(bad):
    with pytest.raises(ValueError):
        repetition_success_unprotected(bad)
    with pytest.raises(ValueError):
        repetition_success_protected(bad)
