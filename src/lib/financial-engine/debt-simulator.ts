/**
 * Debt payoff simulator: Avalanche (highest interest first) vs Snowball (smallest balance first).
 * Returns months to debt-free, total interest paid, and comparison.
 */

import type { DebtItem, DebtComparison, DebtSimResult } from "./types";

export function simulateDebtPayoff(debts: DebtItem[]): DebtComparison | null {
  if (debts.length === 0) return null;

  const avalanche = runAvalanche([...debts]);
  const snowball = runSnowball([...debts]);

  const recommended =
    avalanche.totalInterestPaid <= snowball.totalInterestPaid ? "avalanche" : "snowball";
  const reason =
    recommended === "avalanche"
      ? "Avalanche saves more on interest by paying highest-rate debt first."
      : "Snowball may feel motivating by clearing small balances first; Avalanche saves more interest.";

  return {
    avalanche,
    snowball,
    summary: {
      avalancheMonths: avalanche.monthsToDebtFree,
      snowballMonths: snowball.monthsToDebtFree,
      avalancheInterest: round(avalanche.totalInterestPaid, 2),
      snowballInterest: round(snowball.totalInterestPaid, 2),
      recommended,
      reason,
    },
  };
}

interface DebtState {
  balance: number;
  rate: number;
  payment: number;
  name?: string;
}

function runAvalanche(debts: DebtItem[]): DebtSimResult {
  const state: DebtState[] = debts.map((d) => ({
    balance: d.balance,
    rate: d.interestRateAnnual / 12 / 100,
    payment: d.monthlyPayment,
    name: d.name,
  }));

  let month = 0;
  let totalInterest = 0;
  const monthlyBreakdown: { month: number; balance: number; interestPaid: number }[] = [];

  while (state.some((s) => s.balance > 0)) {
    const totalBalance = state.reduce((s, x) => s + x.balance, 0);
    if (totalBalance <= 0) break;

    // Sort by rate descending (avalanche: highest first)
    const sorted = [...state].sort((a, b) => b.rate - a.rate);
    let extra = 0;

    for (const s of sorted) {
      if (s.balance <= 0) continue;
      const interest = s.balance * s.rate;
      totalInterest += interest;
      const towardPrincipal = Math.min(s.balance, s.payment + extra - interest);
      if (towardPrincipal > 0) {
        s.balance -= towardPrincipal;
        extra = s.payment + extra - interest - towardPrincipal;
      } else {
        extra += s.payment - interest;
      }
    }

    month++;
    const sumBalance = state.reduce((s, x) => s + x.balance, 0);
    monthlyBreakdown.push({ month, balance: round(sumBalance, 2), interestPaid: round(totalInterest, 2) });
    if (month > 600) break; // cap
  }

  return {
    method: "avalanche",
    monthsToDebtFree: month,
    totalInterestPaid: round(totalInterest, 2),
    monthlyBreakdown,
  };
}

function runSnowball(debts: DebtItem[]): DebtSimResult {
  const state: DebtState[] = debts.map((d) => ({
    balance: d.balance,
    rate: d.interestRateAnnual / 12 / 100,
    payment: d.monthlyPayment,
    name: d.name,
  }));

  let month = 0;
  let totalInterest = 0;
  const monthlyBreakdown: { month: number; balance: number; interestPaid: number }[] = [];

  while (state.some((s) => s.balance > 0)) {
    const totalBalance = state.reduce((s, x) => s + x.balance, 0);
    if (totalBalance <= 0) break;

    // Sort by balance ascending (snowball: smallest first)
    const sorted = [...state].sort((a, b) => a.balance - b.balance);
    let extra = 0;

    for (const s of sorted) {
      if (s.balance <= 0) continue;
      const interest = s.balance * s.rate;
      totalInterest += interest;
      const towardPrincipal = Math.min(s.balance, s.payment + extra - interest);
      if (towardPrincipal > 0) {
        s.balance -= towardPrincipal;
        extra = s.payment + extra - interest - towardPrincipal;
      } else {
        extra += s.payment - interest;
      }
    }

    month++;
    const sumBalance = state.reduce((s, x) => s + x.balance, 0);
    monthlyBreakdown.push({ month, balance: round(sumBalance, 2), interestPaid: round(totalInterest, 2) });
    if (month > 600) break;
  }

  return {
    method: "snowball",
    monthsToDebtFree: month,
    totalInterestPaid: round(totalInterest, 2),
    monthlyBreakdown,
  };
}

function round(n: number, d: number): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}
