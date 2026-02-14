/**
 * Core metrics: savings rate, expense ratio, DTI, emergency fund months.
 * PH rules: breadwinner or dependents >= 2 → emergency target 6–12 months; else 3–6.
 */

import type { AssessmentPayload, ComputedMetrics, ExpenseBreakdown } from "./types";

export function totalExpenses(expenses: ExpenseBreakdown): number {
  return (
    expenses.rent +
    expenses.utilities +
    expenses.food +
    expenses.transport +
    expenses.subscriptions +
    expenses.discretionary +
    expenses.dependentsSupport
  );
}

export function totalDebtPayments(debts: { monthlyPayment: number }[]): number {
  return debts.reduce((sum, d) => sum + d.monthlyPayment, 0);
}

export function computeMetrics(payload: AssessmentPayload): ComputedMetrics {
  const income = payload.monthlyIncome;
  const expenses = totalExpenses(payload.expenses);
  const debtPayments = totalDebtPayments(payload.debts);

  const savingsRatePercent = income > 0 ? (payload.monthlySavings / income) * 100 : 0;
  const expenseRatio = income > 0 ? expenses / income : 0;
  const debtToIncomePercent = income > 0 ? (debtPayments / income) * 100 : 0;
  const emergencyFundMonths = expenses > 0 ? payload.emergencyFund / expenses : 0;

  return {
    savingsRatePercent: round(savingsRatePercent, 2),
    expenseRatio: round(expenseRatio, 4),
    debtToIncomePercent: round(debtToIncomePercent, 2),
    emergencyFundMonths: round(emergencyFundMonths, 2),
    totalMonthlyExpenses: round(expenses, 2),
    totalDebtPayments: round(debtPayments, 2),
  };
}

/**
 * PH rule: emergency fund target months.
 * Breadwinner OR dependents >= 2 → 6–12 months (we use 9 as target for scoring).
 * Else → 3–6 months (we use 6 as target).
 */
export function getEmergencyFundTargetMonths(payload: AssessmentPayload): number {
  if (payload.isBreadwinner || payload.dependentsCount >= 2) return 9;
  return 6;
}

function round(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
