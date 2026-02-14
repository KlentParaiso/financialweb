import pytest
from app.schemas.assessment import (
    AssessmentCreate,
    ProfileInput,
    IncomeInput,
    ExpensesInput,
    DebtInput,
    DebtItem,
    SavingsInput,
    InvestingInput,
    GoalInput,
)


def _expenses_for_total(expenses_total: float) -> ExpensesInput:
    if expenses_total <= 0:
        return ExpensesInput(
            rent=0, utilities=0, food=0, transport=0,
            subscriptions=0, discretionary=0, dependents_support=0,
        )
    base = 30_000
    rent, utilities, food = 12_000, 3_000, 8_000
    transport, subscriptions, discretionary = 4_000, 1_000, 2_000
    other = rent + utilities + food + transport + subscriptions + discretionary
    if expenses_total <= other:
        scale = expenses_total / other
        return ExpensesInput(
            rent=int(rent * scale),
            utilities=int(utilities * scale),
            food=int(food * scale),
            transport=int(transport * scale),
            subscriptions=int(subscriptions * scale),
            discretionary=int(discretionary * scale),
            dependents_support=max(0, expenses_total - int(rent * scale) - int(utilities * scale) - int(food * scale) - int(transport * scale) - int(subscriptions * scale) - int(discretionary * scale)),
        )
    return ExpensesInput(
        rent=rent,
        utilities=utilities,
        food=food,
        transport=transport,
        subscriptions=subscriptions,
        discretionary=discretionary,
        dependents_support=int(expenses_total - other),
    )


def _sample_assessment(
    monthly_income: float = 50_000,
    monthly_savings: float = 10_000,
    emergency_fund: float = 100_000,
    expenses_total: float = 35_000,
    debt_payments: float = 5_000,
    employment: str = "stable",
    variability: str = "stable",
    is_breadwinner: bool = False,
    ofw_mode: bool = False,
    investing: str = "active",
    risk: str = "medium",
    num_goals: int = 1,
) -> AssessmentCreate:
    return AssessmentCreate(
        profile=ProfileInput(
            age=30,
            employment_type=employment,
            ofw_mode=ofw_mode,
            is_breadwinner=is_breadwinner,
            number_of_dependents=2 if is_breadwinner else 0,
        ),
        income=IncomeInput(
            monthly_net_income=monthly_income,
            income_variability=variability,
        ),
        expenses=_expenses_for_total(expenses_total),
        debt=DebtInput(
            items=[
                DebtItem(balance=100_000, interest_rate_annual=12, monthly_payment=debt_payments),
            ]
            if debt_payments > 0
            else [],
        ),
        savings=SavingsInput(
            emergency_fund_amount=emergency_fund,
            monthly_savings=monthly_savings,
        ),
        investing=InvestingInput(investing_status=investing, risk_tolerance=risk),
        goals=[
            GoalInput(goal_type="emergency_fund", target_amount=200_000, target_years=2),
            GoalInput(goal_type="house", target_amount=2_000_000, target_years=10),
        ][:num_goals],
        default_inflation_rate=4.0,
        expected_return_profile="moderate",
    )


@pytest.fixture
def sample_assessment():
    return _sample_assessment()


@pytest.fixture
def high_saver_assessment():
    return _sample_assessment(
        monthly_income=80_000,
        monthly_savings=24_000,
        emergency_fund=300_000,
        expenses_total=50_000,
        debt_payments=0,
    )


@pytest.fixture
def breadwinner_assessment():
    return _sample_assessment(
        is_breadwinner=True,
        emergency_fund=200_000,
        expenses_total=45_000,
    )


@pytest.fixture
def ofw_assessment():
    return _sample_assessment(ofw_mode=True, monthly_income=80_000)
