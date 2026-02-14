/**
 * Shared types for the financial engine.
 * No PII; only amounts, ratios, and categories.
 */

export interface ExpenseBreakdown {
  rent: number;
  utilities: number;
  food: number;
  transport: number;
  subscriptions: number;
  discretionary: number;
  dependentsSupport: number;
}

export interface DebtItem {
  balance: number;
  interestRateAnnual: number;
  monthlyPayment: number;
  name?: string;
}

export interface GoalInput {
  goalType: string;
  targetAmountToday: number;
  targetDate: string; // YYYY-MM-DD
  inflationRatePercent?: number;
}

export interface AssessmentPayload {
  monthlyIncome: number;
  employmentStability: "stable" | "contractual" | "gig";
  incomeVariability: "stable" | "variable" | "highly_variable";
  expenses: ExpenseBreakdown;
  debts: DebtItem[];
  emergencyFund: number;
  monthlySavings: number;
  dependentsCount: number;
  isBreadwinner: boolean;
  goals: GoalInput[];
  investingStatus: "none" | "exploring" | "active";
  riskTolerance: "low" | "medium" | "high";
}

export interface ComputedMetrics {
  savingsRatePercent: number;
  expenseRatio: number;
  debtToIncomePercent: number;
  emergencyFundMonths: number;
  totalMonthlyExpenses: number;
  totalDebtPayments: number;
}

export interface DimensionScore {
  name: string;
  score: number;
  weightPercent: number;
  weightedScore: number;
  tip: string;
}

export interface HealthScoreResult {
  totalScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  dimensionScores: DimensionScore[];
  shortExplanation: string;
}

export interface GoalScenario {
  label: "Conservative" | "Moderate" | "Aggressive";
  monthlyContribution: number;
  totalContribution: number;
  futureValue: number;
  inflationAdjustedTarget: number;
  shortfallOrSurplus: number;
}

export interface GoalProjection {
  goalType: string;
  targetAmountToday: number;
  yearsToGoal: number;
  inflationRatePercent: number;
  inflationAdjustedTarget: number;
  scenarios: GoalScenario[];
  chartData: { year: number; value: number }[];
}

export interface DebtSimResult {
  method: "avalanche" | "snowball";
  monthsToDebtFree: number;
  totalInterestPaid: number;
  monthlyBreakdown: { month: number; balance: number; interestPaid: number }[];
}

export interface DebtComparison {
  avalanche: DebtSimResult;
  snowball: DebtSimResult;
  summary: {
    avalancheMonths: number;
    snowballMonths: number;
    avalancheInterest: number;
    snowballInterest: number;
    recommended: "avalanche" | "snowball";
    reason: string;
  };
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  timeframe: "this_week" | "this_month" | "next_3_months";
  numericTarget?: string;
}

export interface ActionPlan {
  thisWeek: ActionItem[];
  thisMonth: ActionItem[];
  next3Months: ActionItem[];
}

export interface AnalysisResult {
  metrics: ComputedMetrics;
  healthScore: HealthScoreResult;
  goalProjections: GoalProjection[];
  debtComparison: DebtComparison | null;
  actionPlan: ActionPlan;
  spendingBreakdown: Record<string, number>;
}
