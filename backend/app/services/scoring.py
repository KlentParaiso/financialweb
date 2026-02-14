"""
Financial health scoring engine.
Weights: Savings rate 25%, Emergency fund months 20%, Debt-to-income 20%,
         Expense ratio 15%, Income stability 10%, Goal/investing 10%.
All dimension scores are 0-100; final score is weighted sum.
"""

from app.schemas.assessment import (
    AssessmentCreate,
    AnalysisOutput,
    DimensionScore,
    ExpensesInput,
    DebtInput,
)
from app.services.projections import compute_goal_projections


# Weights (must sum to 1.0)
WEIGHT_SAVINGS_RATE = 0.25
WEIGHT_EMERGENCY_FUND = 0.20
WEIGHT_DEBT_TO_INCOME = 0.20
WEIGHT_EXPENSE_RATIO = 0.15
WEIGHT_INCOME_STABILITY = 0.10
WEIGHT_GOAL_INVESTING = 0.10


def _total_expenses(e: ExpensesInput) -> float:
    return (
        e.rent + e.utilities + e.food + e.transport
        + e.subscriptions + e.discretionary + e.dependents_support
    )


def _total_debt_payments(d: DebtInput) -> float:
    return sum(item.monthly_payment for item in d.items)


def _savings_rate_score(income: float, expenses: float, savings: float) -> tuple[float, str]:
    """
    Savings rate = (savings / income) * 100.
    Score: 0% -> 0, 10% -> 50, 20%+ -> 100 (capped).
    """
    if income <= 0:
        return 0.0, "Enter a valid monthly income."
    rate = (savings / income) * 100
    # Linear scale: 0% = 0, 20% = 100; cap at 100
    score = min(100.0, rate * 5.0)
    if rate < 5:
        tip = "Aim to save at least 5-10% of your income. Start with automatic transfers."
    elif rate < 20:
        tip = "Good progress. PH guideline: aim for 20% savings rate when possible."
    else:
        tip = "Strong savings rate. Keep it up and consider investing the excess."
    return round(score, 2), tip


def _emergency_fund_score(
    emergency_amount: float,
    monthly_expenses: float,
    is_breadwinner: bool,
    ofw_mode: bool,
) -> tuple[float, float, str]:
    """
    Emergency fund months = emergency_fund_amount / monthly_expenses.
    Breadwinner/OFW: target 6-12 months; else 3-6.
    Score: 0 months -> 0, target -> 100 (scaled).
    """
    if monthly_expenses <= 0:
        return 0.0, 0.0, "Add your monthly expenses to see emergency fund coverage."
    months = emergency_amount / monthly_expenses
    target_months = 9.0 if (is_breadwinner or ofw_mode) else 6.0
    # Score: 0 months = 0, target_months = 100; cap at 100
    score = min(100.0, (months / target_months) * 100.0)
    if months < 3:
        tip = "Build 3-6 months of expenses first. For breadwinners/OFWs, aim for 6-12 months."
    elif months < target_months:
        tip = f"You're at {months:.1f} months. Target {target_months:.0f} months for better security."
    else:
        tip = "Your emergency fund coverage is solid. Keep it in a high-yield savings account."
    return round(score, 2), round(months, 2), tip


def _debt_to_income_score(
    monthly_income: float, total_debt_payments: float
) -> tuple[float, float, str]:
    """
    DTI = (monthly debt payments / monthly income) * 100.
    Score: 0% -> 100, 40%+ -> 0 (linear).
    """
    if monthly_income <= 0:
        return 0.0, 0.0, "Enter a valid monthly income."
    dti = (total_debt_payments / monthly_income) * 100
    # Lower DTI is better: 0% = 100, 40% = 0
    score = max(0.0, 100.0 - (dti * 2.5))
    if dti > 36:
        tip = "DTI above 36% is high. Focus on paying down high-interest debt first."
    elif dti > 20:
        tip = "Moderate debt load. Consider extra payments to reduce interest and term."
    else:
        tip = "Healthy debt-to-income ratio. Avoid taking on new debt unnecessarily."
    return round(score, 2), round(dti, 2), tip


def _expense_ratio_score(income: float, expenses: float) -> tuple[float, str]:
    """
    Expense ratio = expenses / income. Lower is better (more room for savings/debt).
    Ỳ 100% = 0, 70% = 100 (so 30% saved); scale linearly.
    """
    if income <= 0:
        return 0.0, "Enter a valid monthly income."
    ratio = expenses / income
    # Save rate = 1 - ratio. Score so that 30% save rate = 100
    save_rate = 1.0 - ratio
    score = min(100.0, max(0.0, save_rate * (100 / 0.30)))
    if ratio > 0.95:
        tip = "Expenses are very high relative to income. Look for areas to cut first."
    elif ratio > 0.80:
        tip = "Try to bring expenses below 80% of income to free up savings and debt paydown."
    else:
        tip = "Expense ratio looks manageable. Keep tracking to avoid lifestyle creep."
    return round(score, 2), tip


def _income_stability_score(employment_type: str, variability: str) -> tuple[float, str]:
    """
    Stable employment + stable variability = 100; gig + highly_variable = lower.
    """
    emp_scores = {"stable": 1.0, "contractual": 0.7, "gig": 0.4}
    var_scores = {"stable": 1.0, "variable": 0.7, "highly_variable": 0.4}
    e = emp_scores.get(employment_type, 0.5)
    v = var_scores.get(variability, 0.5)
    score = (e + v) / 2 * 100
    if score < 50:
        tip = "With variable income, build a larger emergency fund and prioritize fixed expenses."
    elif score < 80:
        tip = "Consider a side income or upskilling to improve income stability."
    else:
        tip = "Stable income allows consistent saving and planning. Use it to automate savings."
    return round(score, 2), tip


def _goal_investing_score(
    investing_status: str,
    risk_tolerance: str,
    has_goals: bool,
    goals_count: int,
) -> tuple[float, str]:
    """
    Active investing + goals = higher score. None + no goals = lower.
    """
    inv_scores = {"none": 0.3, "exploring": 0.6, "active": 1.0}
    risk_ok = 0.2 if risk_tolerance in ("medium", "high") else 0.1
    inv = inv_scores.get(investing_status, 0.3)
    goal_bonus = 0.3 if has_goals and goals_count > 0 else 0.0
    score = min(100.0, (inv * 70 + risk_ok * 30 + goal_bonus * 50))
    if investing_status == "none":
        tip = "Start with Pag-IBIG/SSS and a time deposit, then explore UITFs or index funds."
    elif investing_status == "exploring":
        tip = "Set a target date and amount for your top goal; use inflation-adjusted targets."
    else:
        tip = "Keep diversifying and align investments with your goals and risk tolerance."
    return round(score, 2), tip


def _score_to_grade(score: float) -> str:
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"


def _spending_breakdown(e: ExpensesInput) -> dict[str, float]:
    out = {
        "Rent": e.rent,
        "Utilities": e.utilities,
        "Food": e.food,
        "Transport": e.transport,
        "Subscriptions": e.subscriptions,
        "Discretionary": e.discretionary,
        "Dependents support": e.dependents_support,
    }
    return {k: v for k, v in out.items() if v > 0}


def _recommendations(
    data: AssessmentCreate,
    dims: list[DimensionScore],
    emergency_months: float,
    dti: float,
) -> list[str]:
    recs = []
    # PH-context
    if data.profile.is_breadwinner and emergency_months < 6:
        recs.append("As a breadwinner, aim for at least 6-12 months of expenses in your emergency fund.")
    if data.profile.ofw_mode:
        recs.append("OFW: Allocate a fixed portion of remittance to savings before spending.")
    if dti > 36:
        recs.append("Prioritize paying off high-interest debt (e.g. credit cards) to reduce DTI.")
    # Low dimension scores
    for d in dims:
        if d.score < 50 and d.name == "Savings rate":
            recs.append("Increase savings by automating a transfer right after payday.")
        if d.score < 50 and d.name == "Emergency fund":
            recs.append("Build emergency fund in a separate account; top up monthly.")
        if d.score < 50 and d.name == "Debt-to-income":
            recs.append("Avoid new debt; consider debt consolidation if you have multiple loans.")
    if not recs:
        recs.append("Keep tracking your finances and revisit goals annually.")
    return recs[:6]  # Cap so UI stays clean


def compute_analysis(data: AssessmentCreate) -> AnalysisOutput:
    income = data.income.monthly_net_income
    expenses = _total_expenses(data.expenses)
    debt_payments = _total_debt_payments(data.debt)
    savings = data.savings.monthly_savings
    emergency = data.savings.emergency_fund_amount

    savings_rate_pct = (savings / income * 100) if income > 0 else 0.0
    dti_pct = (debt_payments / income * 100) if income > 0 else 0.0
    emergency_months = emergency / expenses if expenses > 0 else 0.0

    sr_score, sr_tip = _savings_rate_score(income, expenses, savings)
    ef_score, ef_months, ef_tip = _emergency_fund_score(
        data.savings.emergency_fund_amount,
        expenses,
        data.profile.is_breadwinner,
        data.profile.ofw_mode,
    )
    dti_score, dti_val, dti_tip = _debt_to_income_score(income, debt_payments)
    exp_score, exp_tip = _expense_ratio_score(income, expenses)
    stab_score, stab_tip = _income_stability_score(
        data.profile.employment_type,
        data.income.income_variability,
    )
    goal_score, goal_tip = _goal_investing_score(
        data.investing.investing_status,
        data.investing.risk_tolerance,
        has_goals=len(data.goals) > 0,
        goals_count=len(data.goals),
    )

    dimensions = [
        DimensionScore(name="Savings rate", score=sr_score, weight=WEIGHT_SAVINGS_RATE, weighted_score=round(sr_score * WEIGHT_SAVINGS_RATE, 2), tip=sr_tip),
        DimensionScore(name="Emergency fund", score=ef_score, weight=WEIGHT_EMERGENCY_FUND, weighted_score=round(ef_score * WEIGHT_EMERGENCY_FUND, 2), tip=ef_tip),
        DimensionScore(name="Debt-to-income", score=dti_score, weight=WEIGHT_DEBT_TO_INCOME, weighted_score=round(dti_score * WEIGHT_DEBT_TO_INCOME, 2), tip=dti_tip),
        DimensionScore(name="Expense ratio", score=exp_score, weight=WEIGHT_EXPENSE_RATIO, weighted_score=round(exp_score * WEIGHT_EXPENSE_RATIO, 2), tip=exp_tip),
        DimensionScore(name="Income stability", score=stab_score, weight=WEIGHT_INCOME_STABILITY, weighted_score=round(stab_score * WEIGHT_INCOME_STABILITY, 2), tip=stab_tip),
        DimensionScore(name="Goal & investing", score=goal_score, weight=WEIGHT_GOAL_INVESTING, weighted_score=round(goal_score * WEIGHT_GOAL_INVESTING, 2), tip=goal_tip),
    ]
    total_score = sum(d.weighted_score for d in dimensions)
    total_score = round(min(100.0, total_score), 2)
    grade = _score_to_grade(total_score)

    goal_projections = compute_goal_projections(
        data.goals,
        data.default_inflation_rate,
        data.expected_return_profile,
    )

    recs = _recommendations(data, dimensions, ef_months, dti_val)
    spending = _spending_breakdown(data.expenses)

    return AnalysisOutput(
        savings_rate=savings_rate_pct,
        debt_to_income_ratio=dti_val,
        emergency_fund_months=round(ef_months, 2),
        total_monthly_expenses=round(expenses, 2),
        total_monthly_debt_payments=round(debt_payments, 2),
        financial_health_score=total_score,
        grade=grade,
        dimension_scores=dimensions,
        recommendations=recs,
        goal_projections=goal_projections,
        spending_breakdown=spending,
    )
