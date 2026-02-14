"""
PH-first financial health scoring engine.

Input: JSON with income, expenses breakdown, debts, savings, employment stability,
       dependents, OFW mode, goals (amount + target date).
Output: Computed metrics, financial health score (0-100), grade, per-dimension
        sub-scores, 5-10 personalized recommendations, inflation-adjusted goal
        projections with 3 return scenarios.

Weights: savings 25%, emergency 20%, DTI 20%, expense ratio 15%,
         stability 10%, investing/goals 10%.
"""

from __future__ import annotations

from datetime import date
from typing import Any, Literal

from pydantic import BaseModel, Field, computed_field


# -----------------------------------------------------------------------------
# Input models (JSON-friendly)
# -----------------------------------------------------------------------------


class ExpenseBreakdown(BaseModel):
    """Monthly expenses by category (PHP)."""

    rent: float = Field(0, ge=0, description="Rent or mortgage")
    utilities: float = Field(0, ge=0)
    food: float = Field(0, ge=0)
    transport: float = Field(0, ge=0)
    subscriptions: float = Field(0, ge=0)
    discretionary: float = Field(0, ge=0)
    dependents_support: float = Field(0, ge=0)
    other: float = Field(0, ge=0)

    @computed_field
    @property
    def total(self) -> float:
        return (
            self.rent
            + self.utilities
            + self.food
            + self.transport
            + self.subscriptions
            + self.discretionary
            + self.dependents_support
            + self.other
        )


class DebtItem(BaseModel):
    """Single debt: balance, interest rate, monthly payment."""

    balance: float = Field(..., ge=0)
    interest_rate_annual_pct: float = Field(0, ge=0, le=100)
    monthly_payment: float = Field(..., ge=0)
    name: str | None = None


class GoalInput(BaseModel):
    """Goal with target amount and either target_date or years_to_goal."""

    target_amount: float = Field(..., ge=0)
    target_date: str | None = Field(
        None,
        description="Target date YYYY-MM-DD; used to compute years if years_to_goal not set",
    )
    years_to_goal: float | None = Field(None, ge=0.1, le=50)
    goal_type: str = "other"

    def get_years(self, reference_date: date | None = None) -> float:
        ref = reference_date or date.today()
        if self.years_to_goal is not None:
            return self.years_to_goal
        if self.target_date:
            try:
                t = date.fromisoformat(self.target_date)
                delta = t - ref
                return max(0.5, delta.days / 365.25)
            except (ValueError, TypeError):
                pass
        return 5.0  # default


class ScoringInput(BaseModel):
    """Full input for the scoring engine (JSON-serializable)."""

    # Income & employment
    monthly_income: float = Field(..., gt=0, description="Net monthly income (PHP)")
    employment_stability: Literal["stable", "contractual", "gig"] = "stable"
    income_variability: Literal["stable", "variable", "highly_variable"] = "stable"

    # Expenses
    expenses: ExpenseBreakdown = Field(default_factory=ExpenseBreakdown)

    # Debt
    debts: list[DebtItem] = Field(default_factory=list)

    # Savings
    emergency_fund: float = Field(0, ge=0, description="Current emergency fund balance (PHP)")
    monthly_savings: float = Field(0, ge=0)

    # PH context
    dependents_count: int = Field(0, ge=0, le=20)
    breadwinner: bool = False
    ofw_mode: bool = False
    remittance_allocation_pct: float | None = Field(
        None,
        ge=0,
        le=100,
        description="For OFW: % of remittance allocated to savings; optional",
    )

    # Goals & projection params
    goals: list[GoalInput] = Field(default_factory=list)
    inflation_rate_pct: float = Field(4.0, ge=0, le=20)
    expected_return_profile: Literal["conservative", "moderate", "aggressive"] = "moderate"

    # Investing habit (for dimension score)
    investing_status: Literal["none", "exploring", "active"] = "none"
    risk_tolerance: Literal["low", "medium", "high"] = "medium"


# -----------------------------------------------------------------------------
# Output models
# -----------------------------------------------------------------------------

# Return scenario assumptions (annual)
CONSERVATIVE_RETURN = 0.04
MODERATE_RETURN = 0.07
AGGRESSIVE_RETURN = 0.10


class ComputedMetrics(BaseModel):
    """Core metrics derived from input."""

    savings_rate: float = Field(..., description="monthly_savings / monthly_income")
    expense_ratio: float = Field(..., description="total_expenses / monthly_income")
    debt_to_income: float = Field(..., description="total_debt_payments / monthly_income")
    emergency_fund_months: float = Field(
        ...,
        description="emergency_fund / total_monthly_expenses",
    )
    total_monthly_expenses: float = 0.0
    total_monthly_debt_payments: float = 0.0


class DimensionScore(BaseModel):
    """Single dimension: name, 0-100 score, weight, weighted score, tip."""

    name: str
    score: float = Field(..., ge=0, le=100)
    weight_pct: float  # e.g. 25 for savings
    weighted_score: float
    tip: str


class GoalScenario(BaseModel):
    """One return scenario for a goal: monthly contribution, FV, shortfall/surplus."""

    label: Literal["Conservative", "Moderate", "Aggressive"]
    monthly_contribution_php: float
    total_contribution_php: float
    future_value_php: float
    inflation_adjusted_target_php: float
    shortfall_or_surplus_php: float


class GoalProjection(BaseModel):
    """Inflation-adjusted goal with 3 return scenarios."""

    goal_type: str
    target_amount_today_php: float
    years_to_goal: float
    inflation_rate_pct: float
    inflation_adjusted_target_php: float
    scenarios: list[GoalScenario]


class ScoringOutput(BaseModel):
    """Full output: metrics, score, grade, dimensions, recommendations, projections."""

    metrics: ComputedMetrics
    financial_health_score: float = Field(..., ge=0, le=100)
    grade: Literal["A", "B", "C", "D", "F"]
    dimension_scores: list[DimensionScore]
    recommendations: list[str] = Field(..., min_length=5, max_length=10)
    goal_projections: list[GoalProjection] = Field(default_factory=list)


# -----------------------------------------------------------------------------
# Weights (must sum to 100)
# -----------------------------------------------------------------------------
WEIGHT_SAVINGS = 25
WEIGHT_EMERGENCY = 20
WEIGHT_DTI = 20
WEIGHT_EXPENSE_RATIO = 15
WEIGHT_STABILITY = 10
WEIGHT_INVESTING_GOALS = 10


def _savings_rate_score(income: float, monthly_savings: float) -> tuple[float, str]:
    """Score 0-100: 0% -> 0, 20%+ -> 100."""
    if income <= 0:
        return 0.0, "Enter a valid monthly income."
    rate_pct = (monthly_savings / income) * 100
    score = min(100.0, rate_pct * 5.0)
    if rate_pct < 5:
        tip = "Aim to save at least 5-10% of income. Start with automatic transfers on payday."
    elif rate_pct < 20:
        tip = "Good progress. PH guideline: aim for 20% savings rate when possible."
    else:
        tip = "Strong savings rate. Consider investing the excess (e.g. Pag-IBIG MP2, UITF)."
    return round(score, 2), tip


def _emergency_fund_score(
    emergency_fund: float,
    total_expenses: float,
    dependents_count: int,
    breadwinner: bool,
    ofw_mode: bool,
) -> tuple[float, float, str]:
    """
    PH rule: if dependents >= 2 or breadwinner, target 6-12 months; else 3-6.
    Score: months / target_months * 100, cap 100.
    """
    if total_expenses <= 0:
        return 0.0, 0.0, "Add monthly expenses to see emergency fund coverage."
    months = emergency_fund / total_expenses
    need_high = (dependents_count >= 2) or breadwinner or ofw_mode
    target_months = 9.0 if need_high else 6.0
    score = min(100.0, (months / target_months) * 100.0)
    if months < 3:
        tip = "Build 3-6 months of expenses first. For breadwinners/OFWs, aim for 6-12 months."
    elif months < target_months:
        tip = f"You're at {months:.1f} months. Target {target_months:.0f} months for better security."
    else:
        tip = "Emergency fund coverage is solid. Keep it in a high-yield savings account."
    return round(score, 2), round(months, 2), tip


def _dti_score(income: float, debt_payments: float) -> tuple[float, float, str]:
    """DTI = debt_payments / income. Score: 0% -> 100, 40%+ -> 0."""
    if income <= 0:
        return 0.0, 0.0, "Enter a valid monthly income."
    dti_pct = (debt_payments / income) * 100
    score = max(0.0, 100.0 - (dti_pct * 2.5))
    if dti_pct > 36:
        tip = "DTI above 36% is high. Focus on paying down high-interest debt first."
    elif dti_pct > 20:
        tip = "Moderate debt load. Consider extra payments to reduce interest and term."
    else:
        tip = "Healthy debt-to-income ratio. Avoid taking on new debt unnecessarily."
    return round(score, 2), round(dti_pct, 2), tip


def _expense_ratio_score(income: float, expenses: float) -> tuple[float, str]:
    """Lower expense ratio is better. Score so that 70% ratio -> ~100 (30% saved)."""
    if income <= 0:
        return 0.0, "Enter a valid monthly income."
    ratio = expenses / income
    save_rate = 1.0 - ratio
    score = min(100.0, max(0.0, save_rate * (100 / 0.30)))
    if ratio > 0.95:
        tip = "Expenses are very high relative to income. Look for areas to cut first."
    elif ratio > 0.80:
        tip = "Try to bring expenses below 80% of income to free up savings and debt paydown."
    else:
        tip = "Expense ratio looks manageable. Keep tracking to avoid lifestyle creep."
    return round(score, 2), tip


def _stability_score(
    employment_stability: str,
    income_variability: str,
) -> tuple[float, str]:
    """Stable employment + stable variability -> 100."""
    emp = {"stable": 1.0, "contractual": 0.7, "gig": 0.4}.get(employment_stability, 0.5)
    var = {"stable": 1.0, "variable": 0.7, "highly_variable": 0.4}.get(
        income_variability, 0.5
    )
    score = (emp + var) / 2 * 100
    if score < 50:
        tip = "With variable income, build a larger emergency fund and prioritize fixed expenses."
    elif score < 80:
        tip = "Consider a side income or upskilling to improve income stability."
    else:
        tip = "Stable income allows consistent saving. Use it to automate savings."
    return round(score, 2), tip


def _investing_goals_score(
    investing_status: str,
    risk_tolerance: str,
    has_goals: bool,
    goals_count: int,
) -> tuple[float, str]:
    """None + no goals -> lower; active + goals -> higher."""
    inv = {"none": 0.3, "exploring": 0.6, "active": 1.0}.get(investing_status, 0.3)
    risk_ok = 0.2 if risk_tolerance in ("medium", "high") else 0.1
    goal_bonus = 0.3 if (has_goals and goals_count > 0) else 0.0
    score = min(100.0, (inv * 70 + risk_ok * 30 + goal_bonus * 50))
    if investing_status == "none":
        tip = "Start with Pag-IBIG/SSS and a time deposit, then explore UITFs or index funds."
    elif investing_status == "exploring":
        tip = "Set a target date and amount for your top goal; use inflation-adjusted targets."
    else:
        tip = "Keep diversifying and align investments with your goals and risk tolerance."
    return round(score, 2), tip


def _score_to_grade(score: float) -> Literal["A", "B", "C", "D", "F"]:
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"


def _monthly_contribution_for_fv(
    future_value: float,
    years: float,
    annual_return: float,
) -> float:
    """PMT such that FV of annuity equals future_value. FV = PMT * (((1+r)^n - 1) / r)."""
    n = max(1, int(years * 12))
    r = annual_return / 12.0
    if r <= 0:
        return future_value / n
    factor = (1 + r) ** n - 1
    return future_value * r / factor if factor > 0 else future_value / n


def _future_value_annuity(pmt: float, years: float, annual_return: float) -> float:
    n = max(1, int(years * 12))
    r = annual_return / 12.0
    if r <= 0:
        return pmt * n
    return pmt * (((1 + r) ** n - 1) / r)


def _build_recommendations(
    inp: ScoringInput,
    metrics: ComputedMetrics,
    dimension_scores: list[DimensionScore],
) -> list[str]:
    """Generate 5-10 PH-contextual recommendations."""
    recs: list[str] = []

    # PH: breadwinner / dependents -> emergency fund
    if (inp.dependents_count >= 2 or inp.breadwinner) and metrics.emergency_fund_months < 6:
        recs.append(
            "As a breadwinner or with 2+ dependents, aim for 6-12 months of expenses in your emergency fund."
        )

    # PH: OFW
    if inp.ofw_mode:
        if inp.remittance_allocation_pct is None or inp.remittance_allocation_pct < 10:
            recs.append(
                "OFW: Allocate a fixed portion of remittance to savings first (e.g. 20-30%) before spending."
            )
        recs.append(
            "OFW: Consider life and medical insurance to protect dependents and yourself."
        )
        recs.append(
            "OFW: Plan for retirement and repatriation; diversify savings in PHP and foreign currency."
        )

    # DTI
    if metrics.debt_to_income > 36:
        recs.append(
            "Prioritize paying off high-interest debt (e.g. credit cards) to reduce debt-to-income."
        )
    elif metrics.debt_to_income > 20:
        recs.append(
            "Consider extra debt payments to shorten term and reduce total interest."
        )

    # Low dimension scores
    for d in dimension_scores:
        if d.score < 50:
            if d.name == "Savings rate":
                recs.append("Increase savings by automating a transfer right after payday.")
            elif d.name == "Emergency fund":
                recs.append("Build emergency fund in a separate account; top up monthly.")
            elif d.name == "Debt-to-income":
                recs.append(
                    "Avoid new debt; consider debt consolidation if you have multiple loans."
                )
            elif d.name == "Expense ratio":
                recs.append("Review spending by category and cut non-essentials first.")
            elif d.name == "Income stability":
                recs.append("With variable income, keep a larger buffer and avoid lifestyle creep.")
            elif d.name == "Goal & investing":
                recs.append("Set at least one concrete goal with a target amount and date.")

    # Goals
    if not inp.goals and len(recs) < 10:
        recs.append("Define 1-2 financial goals (e.g. emergency fund, house down payment) with target dates.")

    # Cap and ensure at least 5
    if len(recs) < 5:
        recs.append("Keep tracking your finances and revisit your plan annually.")
        recs.append("Consider speaking to a licensed financial advisor for a tailored plan.")
    return recs[:10]  # max 10, ensure 5-10 in output by padding below if needed


def _compute_goal_projections(inp: ScoringInput) -> list[GoalProjection]:
    """Inflation-adjusted target and 3 scenarios (conservative, moderate, aggressive)."""
    results: list[GoalProjection] = []
    inf = inp.inflation_rate_pct / 100.0
    for g in inp.goals:
        years = g.get_years()
        target_today = g.target_amount
        target_future = target_today * ((1 + inf) ** years)
        scenarios: list[GoalScenario] = []
        for label, ret in [
            ("Conservative", CONSERVATIVE_RETURN),
            ("Moderate", MODERATE_RETURN),
            ("Aggressive", AGGRESSIVE_RETURN),
        ]:
            pmt = _monthly_contribution_for_fv(target_future, years, ret)
            fv = _future_value_annuity(pmt, years, ret)
            scenarios.append(
                GoalScenario(
                    label=label,
                    monthly_contribution_php=round(pmt, 2),
                    total_contribution_php=round(pmt * years * 12, 2),
                    future_value_php=round(fv, 2),
                    inflation_adjusted_target_php=round(target_future, 2),
                    shortfall_or_surplus_php=round(target_future - fv, 2),
                )
            )
        results.append(
            GoalProjection(
                goal_type=g.goal_type,
                target_amount_today_php=target_today,
                years_to_goal=years,
                inflation_rate_pct=inp.inflation_rate_pct,
                inflation_adjusted_target_php=round(target_future, 2),
                scenarios=scenarios,
            )
        )
    return results


def compute_score(inp: ScoringInput) -> ScoringOutput:
    """
    Compute metrics, dimension scores, financial health score, grade,
    recommendations, and goal projections.
    """
    income = inp.monthly_income
    total_expenses = inp.expenses.total
    total_debt = sum(d.monthly_payment for d in inp.debts)

    # Metrics
    savings_rate_pct = (inp.monthly_savings / income * 100) if income > 0 else 0.0
    expense_ratio = (total_expenses / income) if income > 0 else 0.0
    dti_pct = (total_debt / income * 100) if income > 0 else 0.0
    ef_months = (inp.emergency_fund / total_expenses) if total_expenses > 0 else 0.0

    metrics = ComputedMetrics(
        savings_rate=savings_rate_pct,
        expense_ratio=expense_ratio,
        debt_to_income=dti_pct,
        emergency_fund_months=round(ef_months, 2),
        total_monthly_expenses=round(total_expenses, 2),
        total_monthly_debt_payments=round(total_debt, 2),
    )

    # Dimension scores (weights in %)
    w_s = WEIGHT_SAVINGS / 100.0
    w_e = WEIGHT_EMERGENCY / 100.0
    w_d = WEIGHT_DTI / 100.0
    w_x = WEIGHT_EXPENSE_RATIO / 100.0
    w_st = WEIGHT_STABILITY / 100.0
    w_g = WEIGHT_INVESTING_GOALS / 100.0

    sr_score, sr_tip = _savings_rate_score(income, inp.monthly_savings)
    ef_score, _, ef_tip = _emergency_fund_score(
        inp.emergency_fund,
        total_expenses,
        inp.dependents_count,
        inp.breadwinner,
        inp.ofw_mode,
    )
    dti_score, _, dti_tip = _dti_score(income, total_debt)
    exp_score, exp_tip = _expense_ratio_score(income, total_expenses)
    stab_score, stab_tip = _stability_score(
        inp.employment_stability,
        inp.income_variability,
    )
    goal_score, goal_tip = _investing_goals_score(
        inp.investing_status,
        inp.risk_tolerance,
        has_goals=len(inp.goals) > 0,
        goals_count=len(inp.goals),
    )

    dimensions = [
        DimensionScore(
            name="Savings rate",
            score=sr_score,
            weight_pct=WEIGHT_SAVINGS,
            weighted_score=round(sr_score * w_s, 2),
            tip=sr_tip,
        ),
        DimensionScore(
            name="Emergency fund",
            score=ef_score,
            weight_pct=WEIGHT_EMERGENCY,
            weighted_score=round(ef_score * w_e, 2),
            tip=ef_tip,
        ),
        DimensionScore(
            name="Debt-to-income",
            score=dti_score,
            weight_pct=WEIGHT_DTI,
            weighted_score=round(dti_score * w_d, 2),
            tip=dti_tip,
        ),
        DimensionScore(
            name="Expense ratio",
            score=exp_score,
            weight_pct=WEIGHT_EXPENSE_RATIO,
            weighted_score=round(exp_score * w_x, 2),
            tip=exp_tip,
        ),
        DimensionScore(
            name="Income stability",
            score=stab_score,
            weight_pct=WEIGHT_STABILITY,
            weighted_score=round(stab_score * w_st, 2),
            tip=stab_tip,
        ),
        DimensionScore(
            name="Goal & investing",
            score=goal_score,
            weight_pct=WEIGHT_INVESTING_GOALS,
            weighted_score=round(goal_score * w_g, 2),
            tip=goal_tip,
        ),
    ]

    total_score = sum(d.weighted_score for d in dimensions)
    total_score = round(min(100.0, total_score), 2)
    grade = _score_to_grade(total_score)

    recommendations = _build_recommendations(inp, metrics, dimensions)
    while len(recommendations) < 5:
        recommendations.append("Revisit your budget and goals quarterly.")
    recommendations = recommendations[:10]

    goal_projections = _compute_goal_projections(inp)

    return ScoringOutput(
        metrics=metrics,
        financial_health_score=total_score,
        grade=grade,
        dimension_scores=dimensions,
        recommendations=recommendations,
        goal_projections=goal_projections,
    )


def score_from_json(payload: dict[str, Any]) -> dict[str, Any]:
    """
    JSON in -> JSON out. Validates input with Pydantic, runs compute_score,
    returns output as a dict (e.g. for APIs).
    """
    inp = ScoringInput.model_validate(payload)
    out = compute_score(inp)
    return out.model_dump(mode="json")
