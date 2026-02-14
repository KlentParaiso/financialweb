/**
 * PesoSense financial engine – single entry point.
 * Computes metrics, health score, goal projections, debt comparison, action plan.
 */

import type { AssessmentPayload, AnalysisResult } from "./types";
import { computeMetrics } from "./metrics";
import { computeHealthScore } from "./score";
import { computeGoalProjections } from "./goals";
import { simulateDebtPayoff } from "./debt-simulator";
import { generateActionPlan } from "./action-plan";

export type { AssessmentPayload, AnalysisResult } from "./types";
export { computeMetrics, getEmergencyFundTargetMonths } from "./metrics";

export function runAnalysis(payload: AssessmentPayload): AnalysisResult {
  const metrics = computeMetrics(payload);
  const healthScore = computeHealthScore(payload);
  const goalProjections = computeGoalProjections(payload);
  const debtComparison = simulateDebtPayoff(payload.debts);
  const actionPlan = generateActionPlan(
    {
      monthlyIncome: payload.monthlyIncome,
      monthlySavings: payload.monthlySavings,
      emergencyFund: payload.emergencyFund,
      expenses: payload.expenses,
      debts: payload.debts.map((d) => ({ balance: d.balance, monthlyPayment: d.monthlyPayment })),
      goals: payload.goals.map((g) => ({ targetAmountToday: g.targetAmountToday, targetDate: g.targetDate })),
      isBreadwinner: payload.isBreadwinner,
      dependentsCount: payload.dependentsCount,
    },
    {
      emergencyFundMonths: metrics.emergencyFundMonths,
      totalMonthlyExpenses: metrics.totalMonthlyExpenses,
      debtToIncomePercent: metrics.debtToIncomePercent,
    },
    { totalScore: healthScore.totalScore, grade: healthScore.grade }
  );

  const spendingBreakdown: Record<string, number> = {};
  const e = payload.expenses;
  if (e.rent > 0) spendingBreakdown["Rent"] = e.rent;
  if (e.utilities > 0) spendingBreakdown["Utilities"] = e.utilities;
  if (e.food > 0) spendingBreakdown["Food"] = e.food;
  if (e.transport > 0) spendingBreakdown["Transport"] = e.transport;
  if (e.subscriptions > 0) spendingBreakdown["Subscriptions"] = e.subscriptions;
  if (e.discretionary > 0) spendingBreakdown["Discretionary"] = e.discretionary;
  if (e.dependentsSupport > 0) spendingBreakdown["Dependents"] = e.dependentsSupport;

  return {
    metrics,
    healthScore,
    goalProjections,
    debtComparison,
    actionPlan,
    spendingBreakdown,
  };
}
