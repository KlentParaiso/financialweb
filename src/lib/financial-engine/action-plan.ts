/**
 * 90-day action plan: This Week, This Month, Next 3 Months.
 * Personalized with computed numeric targets.
 */

import type { ActionPlan, ActionItem, AnalysisResult } from "./types";
import { nanoid } from "nanoid";

export function generateActionPlan(
  payload: { monthlyIncome: number; monthlySavings: number; emergencyFund: number; expenses: { rent: number; utilities: number; food: number; transport: number; subscriptions: number; discretionary: number; dependentsSupport: number }; debts: { balance: number; monthlyPayment: number }[]; goals: { targetAmountToday: number; targetDate: string }[]; isBreadwinner: boolean; dependentsCount: number },
  metrics: { emergencyFundMonths: number; totalMonthlyExpenses: number; debtToIncomePercent: number },
  healthScore: { totalScore: number; grade: string }
): ActionPlan {
  const totalExpenses =
    payload.expenses.rent +
    payload.expenses.utilities +
    payload.expenses.food +
    payload.expenses.transport +
    payload.expenses.subscriptions +
    payload.expenses.discretionary +
    payload.expenses.dependentsSupport;
  const targetMonths = payload.isBreadwinner || payload.dependentsCount >= 2 ? 9 : 6;
  const gap = targetMonths * totalExpenses - payload.emergencyFund;
  const monthsToSave = Math.max(1, Math.ceil(gap / Math.max(1, payload.monthlySavings)));
  const suggestedMonthly = gap > 0 ? Math.ceil(gap / 12) : 0;

  const thisWeek: ActionItem[] = [];
  const thisMonth: ActionItem[] = [];
  const next3Months: ActionItem[] = [];

  if (metrics.emergencyFundMonths < 3) {
    thisMonth.push({
      id: nanoid(),
      title: "Start or boost emergency fund",
      description: "Open a separate savings account and set up an automatic transfer.",
      timeframe: "this_month",
      numericTarget:
        suggestedMonthly > 0
          ? `To reach ${formatPhp(targetMonths * totalExpenses)} (${targetMonths} months), save ${formatPhp(suggestedMonthly)}/month for ${monthsToSave} months.`
          : undefined,
    });
  }

  if (metrics.debtToIncomePercent > 20 && payload.debts.length > 0) {
    thisWeek.push({
      id: nanoid(),
      title: "List all debts and interest rates",
      description: "Know exactly what you owe and which has the highest rate (avalanche) or smallest balance (snowball).",
      timeframe: "this_week",
    });
    thisMonth.push({
      id: nanoid(),
      title: "Pay more than minimum on one debt",
      description: "Put any extra toward the chosen debt (avalanche or snowball).",
      timeframe: "this_month",
    });
  }

  if (healthScore.totalScore < 70) {
    next3Months.push({
      id: nanoid(),
      title: "Track spending for 30 days",
      description: "Use a simple spreadsheet or app to see where money goes.",
      timeframe: "next_3_months",
    });
  }

  if (payload.goals.length > 0) {
    const g = payload.goals[0];
    next3Months.push({
      id: nanoid(),
      title: `Work toward goal: ${g.targetAmountToday ? formatPhp(g.targetAmountToday) : "your target"}`,
      description: "Set a monthly contribution and automate it.",
      timeframe: "next_3_months",
      numericTarget: `Target: ${formatPhp(g.targetAmountToday)} by ${g.targetDate}.`,
    });
  }

  if (thisWeek.length === 0 && thisMonth.length === 0 && next3Months.length === 0) {
    thisMonth.push({
      id: nanoid(),
      title: "Review your budget",
      description: "Revisit expenses and savings rate next month.",
      timeframe: "this_month",
    });
    next3Months.push({
      id: nanoid(),
      title: "Keep building habits",
      description: "Consistency beats intensity. Re-run your assessment in 90 days.",
      timeframe: "next_3_months",
    });
  }

  return {
    thisWeek: thisWeek.slice(0, 5),
    thisMonth: thisMonth.slice(0, 5),
    next3Months: next3Months.slice(0, 5),
  };
}

function formatPhp(n: number): string {
  return "₱" + n.toLocaleString("en-PH", { maximumFractionDigits: 0 });
}
