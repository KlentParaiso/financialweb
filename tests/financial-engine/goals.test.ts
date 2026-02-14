import { describe, it, expect } from "vitest";
import { computeGoalProjections } from "@/lib/financial-engine/goals";
import type { AssessmentPayload } from "@/lib/financial-engine/types";

const payload: AssessmentPayload = {
  monthlyIncome: 60_000,
  employmentStability: "stable",
  incomeVariability: "stable",
  expenses: { rent: 15_000, utilities: 2_000, food: 8_000, transport: 4_000, subscriptions: 500, discretionary: 2_000, dependentsSupport: 0 },
  debts: [],
  emergencyFund: 50_000,
  monthlySavings: 10_000,
  dependentsCount: 0,
  isBreadwinner: false,
  goals: [
    { goalType: "house", targetAmountToday: 1_000_000, targetDate: "2030-06-01", inflationRatePercent: 4 },
  ],
  investingStatus: "none",
  riskTolerance: "low",
};

describe("computeGoalProjections", () => {
  it("returns one projection per goal", () => {
    const result = computeGoalProjections(payload);
    expect(result).toHaveLength(1);
    expect(result[0].goalType).toBe("house");
    expect(result[0].targetAmountToday).toBe(1_000_000);
  });

  it("inflation-adjusted target is greater than target today", () => {
    const result = computeGoalProjections(payload);
    expect(result[0].inflationAdjustedTarget).toBeGreaterThan(1_000_000);
  });

  it("returns three scenarios per goal", () => {
    const result = computeGoalProjections(payload);
    expect(result[0].scenarios).toHaveLength(3);
    const labels = result[0].scenarios.map((s) => s.label);
    expect(labels).toContain("Conservative");
    expect(labels).toContain("Moderate");
    expect(labels).toContain("Aggressive");
  });

  it("returns chartData array", () => {
    const result = computeGoalProjections(payload);
    expect(Array.isArray(result[0].chartData)).toBe(true);
    expect(result[0].chartData.length).toBeGreaterThan(0);
  });
});
