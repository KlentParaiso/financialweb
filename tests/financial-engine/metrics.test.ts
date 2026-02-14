import { describe, it, expect } from "vitest";
import { computeMetrics, getEmergencyFundTargetMonths } from "@/lib/financial-engine/metrics";
import type { AssessmentPayload } from "@/lib/financial-engine/types";

const basePayload: AssessmentPayload = {
  monthlyIncome: 50_000,
  employmentStability: "stable",
  incomeVariability: "stable",
  expenses: {
    rent: 15_000,
    utilities: 3_000,
    food: 8_000,
    transport: 4_000,
    subscriptions: 500,
    discretionary: 2_000,
    dependentsSupport: 0,
  },
  debts: [],
  emergencyFund: 100_000,
  monthlySavings: 10_000,
  dependentsCount: 0,
  isBreadwinner: false,
  goals: [],
  investingStatus: "none",
  riskTolerance: "medium",
};

describe("computeMetrics", () => {
  it("computes savings rate as monthlySavings / monthlyIncome", () => {
    const m = computeMetrics(basePayload);
    expect(m.savingsRatePercent).toBe(20);
  });

  it("computes expense ratio", () => {
    const m = computeMetrics(basePayload);
    const total = 15000 + 3000 + 8000 + 4000 + 500 + 2000;
    expect(m.expenseRatio).toBe(total / 50_000);
    expect(m.totalMonthlyExpenses).toBe(total);
  });

  it("computes debt-to-income", () => {
    const withDebt = { ...basePayload, debts: [{ balance: 100_000, interestRateAnnual: 12, monthlyPayment: 5_000 }] };
    const m = computeMetrics(withDebt);
    expect(m.debtToIncomePercent).toBe(10);
    expect(m.totalDebtPayments).toBe(5_000);
  });

  it("computes emergency fund months", () => {
    const m = computeMetrics(basePayload);
    const totalExp = 32_500;
    expect(m.emergencyFundMonths).toBeCloseTo(100_000 / totalExp, 2);
  });
});

describe("getEmergencyFundTargetMonths", () => {
  it("returns 9 for breadwinner", () => {
    expect(getEmergencyFundTargetMonths({ ...basePayload, isBreadwinner: true })).toBe(9);
  });
  it("returns 9 for dependents >= 2", () => {
    expect(getEmergencyFundTargetMonths({ ...basePayload, dependentsCount: 2 })).toBe(9);
  });
  it("returns 6 otherwise", () => {
    expect(getEmergencyFundTargetMonths(basePayload)).toBe(6);
  });
});
