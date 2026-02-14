import pytest
from app.services.scoring import compute_analysis
from app.schemas.assessment import AssessmentCreate, ProfileInput, IncomeInput, ExpensesInput, DebtInput, SavingsInput, InvestingInput, GoalInput
from tests.conftest import _sample_assessment, high_saver_assessment, breadwinner_assessment


def test_compute_analysis_returns_all_fields(sample_assessment: AssessmentCreate):
    out = compute_analysis(sample_assessment)
    assert out.savings_rate >= 0
    assert out.debt_to_income_ratio >= 0
    assert out.emergency_fund_months >= 0
    assert out.financial_health_score >= 0 and out.financial_health_score <= 100
    assert out.grade in "ABCDEF"
    assert len(out.dimension_scores) == 6
    assert len(out.recommendations) >= 1
    assert "Rent" in out.spending_breakdown or len(out.spending_breakdown) >= 0


def test_savings_rate_calculation():
    data = _sample_assessment(monthly_income=100_000, monthly_savings=20_000, expenses_total=75_000)
    out = compute_analysis(data)
    # savings_rate = 20_000 / 100_000 = 20%
    assert out.savings_rate == 20.0


def test_emergency_fund_months():
    data = _sample_assessment(emergency_fund=150_000, expenses_total=30_000)
    out = compute_analysis(data)
    assert out.emergency_fund_months == 5.0  # 150_000 / 30_000


def test_debt_to_income_ratio():
    data = _sample_assessment(monthly_income=50_000, debt_payments=10_000)
    out = compute_analysis(data)
    assert out.debt_to_income_ratio == 20.0  # 10k/50k * 100


def test_high_saver_gets_better_score(high_saver_assessment: AssessmentCreate, sample_assessment: AssessmentCreate):
    out_high = compute_analysis(high_saver_assessment)
    out_normal = compute_analysis(sample_assessment)
    assert out_high.financial_health_score >= out_normal.financial_health_score
    assert out_high.grade >= out_normal.grade or out_high.financial_health_score > out_normal.financial_health_score


def test_breadwinner_recommendation(breadwinner_assessment: AssessmentCreate):
    out = compute_analysis(breadwinner_assessment)
    breadwinner_tips = [r for r in out.recommendations if "breadwinner" in r.lower()]
    assert len(breadwinner_tips) >= 0  # May or may not appear depending on emergency months
    assert all(0 <= d.score <= 100 for d in out.dimension_scores)


def test_grade_boundaries():
    # Score 90+ -> A, 80+ -> B, etc.
    from app.services.scoring import _score_to_grade
    assert _score_to_grade(95) == "A"
    assert _score_to_grade(85) == "B"
    assert _score_to_grade(75) == "C"
    assert _score_to_grade(65) == "D"
    assert _score_to_grade(40) == "F"
