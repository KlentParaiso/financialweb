from typing import Optional
from pydantic import BaseModel, Field


# --- Questionnaire input schemas ---

class ProfileInput(BaseModel):
    age: int = Field(..., ge=18, le=100)
    region: Optional[str] = None
    city: Optional[str] = None
    employment_type: str = Field(..., pattern="^(stable|contractual|gig)$")
    ofw_mode: bool = False
    is_breadwinner: bool = False
    number_of_dependents: int = Field(0, ge=0, le=20)


class IncomeInput(BaseModel):
    monthly_net_income: float = Field(..., gt=0, le=1e8)
    income_variability: str = Field(..., pattern="^(stable|variable|highly_variable)$")


class ExpensesInput(BaseModel):
    rent: float = Field(0, ge=0, le=1e8)
    utilities: float = Field(0, ge=0, le=1e8)
    food: float = Field(0, ge=0, le=1e8)
    transport: float = Field(0, ge=0, le=1e8)
    subscriptions: float = Field(0, ge=0, le=1e8)
    discretionary: float = Field(0, ge=0, le=1e8)
    dependents_support: float = Field(0, ge=0, le=1e8)


class DebtItem(BaseModel):
    name: Optional[str] = None
    balance: float = Field(..., ge=0)
    interest_rate_annual: float = Field(0, ge=0, le=100)
    monthly_payment: float = Field(..., ge=0)


class DebtInput(BaseModel):
    items: list[DebtItem] = Field(default_factory=list)


class SavingsInput(BaseModel):
    emergency_fund_amount: float = Field(0, ge=0, le=1e9)
    monthly_savings: float = Field(0, ge=0, le=1e8)


class InvestingInput(BaseModel):
    investing_status: str = Field(..., pattern="^(none|exploring|active)$")
    risk_tolerance: str = Field(..., pattern="^(low|medium|high)$")


class GoalInput(BaseModel):
    goal_type: str = Field(
        ...,
        pattern="^(emergency_fund|debt_free|travel|house|tuition|retirement|other)$",
    )
    target_amount: float = Field(..., ge=0)
    target_years: float = Field(..., gt=0, le=50)


class AssessmentCreate(BaseModel):
    profile: ProfileInput
    income: IncomeInput
    expenses: ExpensesInput
    debt: DebtInput
    savings: SavingsInput
    investing: InvestingInput
    goals: list[GoalInput] = Field(default_factory=list)
    # For inflation projection user preferences
    default_inflation_rate: float = Field(3.5, ge=0, le=20)
    expected_return_profile: str = Field(
        "moderate", pattern="^(conservative|moderate|aggressive)$"
    )


# --- Analysis output schemas ---

class DimensionScore(BaseModel):
    name: str
    score: float  # 0-100
    weight: float
    weighted_score: float
    tip: str


class GoalProjectionScenario(BaseModel):
    label: str
    monthly_contribution: float
    total_contribution: float
    future_value: float
    inflation_adjusted_target: float
    shortfall_or_surplus: float


class GoalProjectionResult(BaseModel):
    goal_type: str
    target_amount_today: float
    target_years: float
    inflation_rate: float
    inflation_adjusted_target: float
    scenarios: list[GoalProjectionScenario]


class AnalysisOutput(BaseModel):
    savings_rate: float
    debt_to_income_ratio: float
    emergency_fund_months: float
    total_monthly_expenses: float
    total_monthly_debt_payments: float
    financial_health_score: float  # 0-100
    grade: str  # A-F
    dimension_scores: list[DimensionScore]
    recommendations: list[str]
    goal_projections: list[GoalProjectionResult]
    spending_breakdown: dict[str, float]


class AssessmentResponse(BaseModel):
    id: str  # public_id for anonymous retrieval
    analysis: AnalysisOutput
