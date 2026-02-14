const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type ProfileInput = {
  age: number;
  region?: string;
  city?: string;
  employment_type: "stable" | "contractual" | "gig";
  ofw_mode: boolean;
  is_breadwinner: boolean;
  number_of_dependents: number;
};

export type IncomeInput = {
  monthly_net_income: number;
  income_variability: "stable" | "variable" | "highly_variable";
};

export type ExpensesInput = {
  rent: number;
  utilities: number;
  food: number;
  transport: number;
  subscriptions: number;
  discretionary: number;
  dependents_support: number;
};

export type DebtItem = {
  name?: string;
  balance: number;
  interest_rate_annual: number;
  monthly_payment: number;
};

export type DebtInput = { items: DebtItem[] };

export type SavingsInput = {
  emergency_fund_amount: number;
  monthly_savings: number;
};

export type InvestingInput = {
  investing_status: "none" | "exploring" | "active";
  risk_tolerance: "low" | "medium" | "high";
};

export type GoalInput = {
  goal_type: "emergency_fund" | "debt_free" | "travel" | "house" | "tuition" | "retirement" | "other";
  target_amount: number;
  target_years: number;
};

export type AssessmentCreate = {
  profile: ProfileInput;
  income: IncomeInput;
  expenses: ExpensesInput;
  debt: DebtInput;
  savings: SavingsInput;
  investing: InvestingInput;
  goals: GoalInput[];
  default_inflation_rate: number;
  expected_return_profile: "conservative" | "moderate" | "aggressive";
};

export type DimensionScore = {
  name: string;
  score: number;
  weight: number;
  weighted_score: number;
  tip: string;
};

export type GoalProjectionScenario = {
  label: string;
  monthly_contribution: number;
  total_contribution: number;
  future_value: number;
  inflation_adjusted_target: number;
  shortfall_or_surplus: number;
};

export type GoalProjectionResult = {
  goal_type: string;
  target_amount_today: number;
  target_years: number;
  inflation_rate: number;
  inflation_adjusted_target: number;
  scenarios: GoalProjectionScenario[];
};

export type AnalysisOutput = {
  savings_rate: number;
  debt_to_income_ratio: number;
  emergency_fund_months: number;
  total_monthly_expenses: number;
  total_monthly_debt_payments: number;
  financial_health_score: number;
  grade: string;
  dimension_scores: DimensionScore[];
  recommendations: string[];
  goal_projections: GoalProjectionResult[];
  spending_breakdown: Record<string, number>;
};

export type AssessmentResponse = {
  id: string;
  analysis: AnalysisOutput;
};

export async function createAssessment(
  payload: AssessmentCreate
): Promise<AssessmentResponse> {
  const res = await fetch(`${API_URL}/api/assessments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to create assessment");
  }
  return res.json();
}

export async function getAssessment(id: string): Promise<AssessmentResponse> {
  const res = await fetch(`${API_URL}/api/assessments/${id}`);
  if (!res.ok) throw new Error("Assessment not found");
  return res.json();
}
