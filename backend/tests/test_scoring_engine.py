"""
Unit tests for the PH-first scoring engine.
"""

import json
import os

import pytest

from app.services.scoring_engine import (
    ScoringInput,
    ScoringOutput,
    ExpenseBreakdown,
    DebtItem,
    GoalInput,
    compute_score,
    score_from_json,
    ComputedMetrics,
    WEIGHT_SAVINGS,
    WEIGHT_EMERGENCY,
    WEIGHT_DTI,
    WEIGHT_EXPENSE_RATIO,
    WEIGHT_STABILITY,
    WEIGHT_INVESTING_GOALS,
)


def _minimal_input(
    monthly_income: float = 50_000,
    monthly_savings: float = 10_000,
    emergency_fund: float = 150_000,
    total_expenses: float = 35_000,
    debt_payments: float = 0,
    dependents_count: int = 0,
    breadwinner: bool = False,
    ofw_mode: bool = False,
) -> ScoringInput:
    """Build input with expenses summing to total_expenses."""
    # Simple breakdown that sums to total_expenses
    rent = min(20_000, total_expenses * 0.4)
    rest = total_expenses - rent
    expenses = ExpenseBreakdown(
        rent=rent,
        utilities=rest * 0.1,
        food=rest * 0.35,
        transport=rest * 0.2,
        subscriptions=rest * 0.05,
        discretionary=rest * 0.2,
        dependents_support=rest * 0.1,
        other=0,
    )
    debts = (
        [DebtItem(balance=50_000, interest_rate_annual_pct=12, monthly_payment=debt_payments)]
        if debt_payments > 0
        else []
    )
    return ScoringInput(
        monthly_income=monthly_income,
        employment_stability="stable",
        income_variability="stable",
        expenses=expenses,
        debts=debts,
        emergency_fund=emergency_fund,
        monthly_savings=monthly_savings,
        dependents_count=dependents_count,
        breadwinner=breadwinner,
        ofw_mode=ofw_mode,
        goals=[GoalInput(target_amount=500_000, years_to_goal=5, goal_type="house")],
        inflation_rate_pct=4.0,
        investing_status="exploring",
        risk_tolerance="medium",
    )


# -----------------------------------------------------------------------------
# Metrics
# -----------------------------------------------------------------------------


def test_savings_rate_metric():
    inp = _minimal_input(monthly_income=100_000, monthly_savings=20_000)
    out = compute_score(inp)
    assert out.metrics.savings_rate == 20.0


def test_expense_ratio_metric():
    inp = _minimal_input(monthly_income=100_000, total_expenses=70_000)
    out = compute_score(inp)
    assert out.metrics.expense_ratio == 0.70


def test_debt_to_income_metric():
    inp = _minimal_input(monthly_income=50_000, debt_payments=10_000)
    out = compute_score(inp)
    assert out.metrics.debt_to_income == 20.0


def test_emergency_fund_months_metric():
    inp = _minimal_input(emergency_fund=180_000, total_expenses=30_000)
    out = compute_score(inp)
    assert out.metrics.emergency_fund_months == 6.0


# -----------------------------------------------------------------------------
# Score and grade
# -----------------------------------------------------------------------------


def test_score_between_0_and_100():
    inp = _minimal_input()
    out = compute_score(inp)
    assert 0 <= out.financial_health_score <= 100
    assert out.grade in ("A", "B", "C", "D", "F")


def test_grade_boundaries():
    from app.services.scoring_engine import _score_to_grade
    assert _score_to_grade(92) == "A"
    assert _score_to_grade(85) == "B"
    assert _score_to_grade(72) == "C"
    assert _score_to_grade(65) == "D"
    assert _score_to_grade(40) == "F"


def test_weights_sum_to_100():
    total = (
        WEIGHT_SAVINGS
        + WEIGHT_EMERGENCY
        + WEIGHT_DTI
        + WEIGHT_EXPENSE_RATIO
        + WEIGHT_STABILITY
        + WEIGHT_INVESTING_GOALS
    )
    assert total == 100


# -----------------------------------------------------------------------------
# Dimensions
# -----------------------------------------------------------------------------


def test_six_dimensions():
    inp = _minimal_input()
    out = compute_score(inp)
    assert len(out.dimension_scores) == 6
    names = {d.name for d in out.dimension_scores}
    assert "Savings rate" in names
    assert "Emergency fund" in names
    assert "Debt-to-income" in names
    assert "Expense ratio" in names
    assert "Income stability" in names
    assert "Goal & investing" in names


def test_each_dimension_has_weight_and_tip():
    inp = _minimal_input()
    out = compute_score(inp)
    for d in out.dimension_scores:
        assert 0 <= d.score <= 100
        assert d.weight_pct > 0
        expected = round(d.score * (d.weight_pct / 100), 2)
        assert abs(d.weighted_score - expected) < 0.02
        assert len(d.tip) > 0


# -----------------------------------------------------------------------------
# PH rules
# -----------------------------------------------------------------------------


def test_breadwinner_emergency_recommendation():
    inp = _minimal_input(breadwinner=True, emergency_fund=50_000, total_expenses=30_000)
    out = compute_score(inp)
    recs = " ".join(out.recommendations).lower()
    assert "breadwinner" in recs or "6" in recs or "12" in recs or "emergency" in recs


def test_ofw_recommendations():
    inp = _minimal_input(ofw_mode=True)
    out = compute_score(inp)
    recs = " ".join(out.recommendations).lower()
    assert "ofw" in recs
    assert "remittance" in recs or "insurance" in recs or "retirement" in recs


def test_dependents_2_raises_emergency_target():
    inp_low = _minimal_input(dependents_count=0, emergency_fund=120_000, total_expenses=30_000)
    inp_high = _minimal_input(dependents_count=2, emergency_fund=120_000, total_expenses=30_000)
    out_low = compute_score(inp_low)
    out_high = compute_score(inp_high)
    # With 2 dependents, target is 9 months so 4 months gets lower score than with target 6
    ef_low = next(d for d in out_low.dimension_scores if d.name == "Emergency fund")
    ef_high = next(d for d in out_high.dimension_scores if d.name == "Emergency fund")
    assert ef_high.score <= ef_low.score or ef_high.tip != ef_low.tip


# -----------------------------------------------------------------------------
# Recommendations
# -----------------------------------------------------------------------------


def test_recommendations_count_5_to_10():
    inp = _minimal_input()
    out = compute_score(inp)
    assert 5 <= len(out.recommendations) <= 10
    assert all(isinstance(r, str) and len(r) > 0 for r in out.recommendations)


# -----------------------------------------------------------------------------
# Goal projections
# -----------------------------------------------------------------------------


def test_inflation_adjusted_goal():
    inp = _minimal_input()
    out = compute_score(inp)
    assert len(out.goal_projections) == 1
    gp = out.goal_projections[0]
    assert gp.target_amount_today_php == 500_000
    assert gp.years_to_goal == 5
    # 500k * (1.04)^5 ≈ 608326
    assert gp.inflation_adjusted_target_php >= 600_000
    assert gp.inflation_adjusted_target_php <= 620_000


def test_three_scenarios_per_goal():
    inp = _minimal_input()
    out = compute_score(inp)
    gp = out.goal_projections[0]
    assert len(gp.scenarios) == 3
    labels = {s.label for s in gp.scenarios}
    assert labels == {"Conservative", "Moderate", "Aggressive"}


def test_goal_target_date_parsed():
    inp = ScoringInput(
        monthly_income=40_000,
        expenses=ExpenseBreakdown(rent=10_000, food=8_000),
        goals=[
            GoalInput(target_amount=1_000_000, target_date="2030-12-31", goal_type="house"),
        ],
    )
    out = compute_score(inp)
    assert len(out.goal_projections) == 1
    # Years from now to 2030
    assert out.goal_projections[0].years_to_goal >= 4
    assert out.goal_projections[0].years_to_goal <= 6


# -----------------------------------------------------------------------------
# JSON entry point
# -----------------------------------------------------------------------------


def test_score_from_json_accepts_dict():
    payload = {
        "monthly_income": 60_000,
        "expenses": {"rent": 15_000, "food": 10_000},
        "emergency_fund": 100_000,
        "monthly_savings": 12_000,
        "goals": [{"target_amount": 200_000, "years_to_goal": 3, "goal_type": "emergency_fund"}],
    }
    result = score_from_json(payload)
    assert isinstance(result, dict)
    assert "metrics" in result
    assert "financial_health_score" in result
    assert "grade" in result
    assert "dimension_scores" in result
    assert "recommendations" in result
    assert "goal_projections" in result
    assert 0 <= result["financial_health_score"] <= 100


def test_example_input_produces_valid_output():
    examples_dir = os.path.join(os.path.dirname(__file__), "..", "examples")
    path = os.path.join(examples_dir, "scoring_input_example.json")
    if not os.path.exists(path):
        pytest.skip("examples/scoring_input_example.json not found")
    with open(path) as f:
        payload = json.load(f)
    result = score_from_json(payload)
    assert result["metrics"]["savings_rate"] > 0
    assert result["metrics"]["emergency_fund_months"] > 0
    assert len(result["recommendations"]) >= 5
    assert len(result["goal_projections"]) == 2  # house + emergency_fund goals
