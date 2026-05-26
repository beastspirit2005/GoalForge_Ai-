import pytest
from app.ai.prediction_engine import (
    normalize_progress_rate,
    normalize_workload_pressure,
    normalize_recency,
    compute_completion_probability,
    compute_goal_overload,
    compute_progress_pressure,
    compute_weightage_burden,
    compute_checkin_exhaustion,
    compute_risk_accumulation,
)


def test_overdue_task_penalized():
    score = normalize_progress_rate(actual=0.8, expected=1.0, is_overdue=True)
    assert score < 0.8
    # Exact ratio should be 0.8 * 0.6 = 0.48
    assert score == pytest.approx(0.48)


def test_output_never_exceeds_bounds():
    result = compute_completion_probability(1.0, 1.0, 1.0, 1.0, 1.0)
    assert 0.0 <= result <= 1.0
    assert result == 1.0

    result_low = compute_completion_probability(0.0, 0.0, 0.0, 0.0, 0.0)
    assert result_low == 0.0


def test_workload_degrades_after_six_goals():
    assert normalize_workload_pressure(6) == 1.0
    assert normalize_workload_pressure(7) < 1.0
    assert normalize_workload_pressure(100) == 0.0


def test_recency_normalization():
    assert normalize_recency(5) == 1.0
    assert normalize_recency(14) == 1.0
    assert normalize_recency(20) < 1.0
    assert normalize_recency(50) == 0.0


def test_burnout_smooth_gradients():
    # Goal Overload
    assert compute_goal_overload(1) == 0.1
    assert compute_goal_overload(2) == 0.1
    assert compute_goal_overload(5) == pytest.approx(0.55)
    assert compute_goal_overload(8) == 1.0
    assert compute_goal_overload(10) == 1.0

    # Progress Pressure
    assert compute_progress_pressure(90.0) == 0.1
    assert compute_progress_pressure(50.0) == pytest.approx(0.5)
    assert compute_progress_pressure(10.0) == 0.9

    # Weightage Burden
    assert compute_weightage_burden(70) == 0.0
    assert compute_weightage_burden(110) == pytest.approx(0.5)
    assert compute_weightage_burden(150) == 1.0
