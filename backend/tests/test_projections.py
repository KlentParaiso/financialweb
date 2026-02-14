import pytest
from app.services.projections import (
    compute_goal_projections,
    _monthly_contribution_for_target,
    _future_value_of_contributions,
)
from app.schemas.assessment import GoalInput


def test_inflation_adjusted_target():
    goals = [GoalInput(goal_type="house", target_amount=1_000_000, target_years=10)]
    results = compute_goal_projections(goals, inflation_rate_pct=4.0, return_profile="moderate")
    assert len(results) == 1
    r = results[0]
    # 1M * (1.04)^10 ≈ 1,480,244
    expected = 1_000_000 * (1.04 ** 10)
    assert abs(r.inflation_adjusted_target - expected) < 1


def test_three_scenarios_per_goal():
    goals = [GoalInput(goal_type="travel", target_amount=100_000, target_years=2)]
    results = compute_goal_projections(goals, inflation_rate_pct=3.5, return_profile="moderate")
    assert len(results[0].scenarios) == 3
    labels = {s.label for s in results[0].scenarios}
    assert "Conservative" in labels and "Moderate" in labels and "Aggressive" in labels


def test_monthly_contribution_formula():
    # FV = 100, years = 1, r = 12% annual -> monthly rate 1%
    # PMT such that FV = PMT * (((1.01)^12 - 1) / 0.01)
    fv = 100_000
    years = 1
    annual_return = 0.07
    pmt = _monthly_contribution_for_target(fv, years, annual_return)
    actual_fv = _future_value_of_contributions(pmt, years, annual_return)
    assert abs(actual_fv - fv) < 1.0


def test_zero_interest_contribution():
    pmt = _monthly_contribution_for_target(120_000, 10, 0.0)
    # 120k / 120 months = 1000
    assert abs(pmt - 1000) < 1.0
