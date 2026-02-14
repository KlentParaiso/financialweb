import { describe, it, expect } from "vitest";
import { runAnalysis } from "@/lib/financial-engine";
import type { AssessmentPayload } from "@/lib/financial-engine/types";

const fullPayload: AssessmentPayload = {
  monthlyIncome: 55_000,
  employmentStability: "stable",
  incomeVariability: "stable",
  expenses: {
    rent: 12_000,
    utilities: 2_500,
    food: 8_000,
    transport: 3_500,
    subscriptions: 500,
    discretionary: 2_000,
    dependentsSupport: 6_000,
  },
  debts: [{ balance: 80_000, interestRateAnnual: 18, monthlyPayment: 4_000 }],
  emergencyFund: 90_000,
  monthlySavings: 8_000,
  dependentsCount: 2,
  isBreadwinner: true,
  goals: [
    { goalType: "house", targetAmountToday: 500_000, targetDate: "2030-06-01" },
  ],
  investingStatus: "exploring",
  riskTolerance: "medium",
};

describe("runAnalysis", () => {
  it("returns metrics, healthScore, goalProjections, debtComparison, actionPlan, spendingBreakdown", () => {
    const result = runAnalysis(fullPayload);
    expect(result.metrics).toBeDefined();
    expect(result.metrics.savingsRatePercent).toBeDefined();
    expect(result.metrics.emergencyFundMonths).toBeDefined();
    expect(result.healthScore.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.healthScore.totalScore).toBeLessThanOrEqual(100);
    expect(result.healthScore.grade).toMatch(/^[ABCDF]$/);
    expect(result.goalProjections.length).toBe(1);
    expect(result.debtComparison).not.toBeNull();
    expect(result.actionPlan.thisWeek).toBeDefined();
    expect(result.actionPlan.thisMonth).toBeDefined();
    expect(result.actionPlan.next3Months).toBeDefined();
    expect(Object.keys(result.spendingBreakdown).length).toBeGreaterThan(0);
  });
});
