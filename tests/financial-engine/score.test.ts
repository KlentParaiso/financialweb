import { describe, it, expect } from "vitest";
import { computeHealthScore } from "@/lib/financial-engine/score";
import type { AssessmentPayload } from "@/lib/financial-engine/types";

const basePayload: AssessmentPayload = {
  monthlyIncome: 50_000,
  employmentStability: "stable",
  incomeVariability: "stable",
  expenses: {
    rent: 12_000,
    utilities: 2_000,
    food: 8_000,
    transport: 3_000,
    subscriptions: 500,
    discretionary: 2_000,
    dependentsSupport: 0,
  },
  debts: [],
  emergencyFund: 150_000,
  monthlySavings: 12_000,
  dependentsCount: 0,
  isBreadwinner: false,
  goals: [{ goalType: "emergency_fund", targetAmountToday: 200_000, targetDate: "2027-12-31" }],
  investingStatus: "exploring",
  riskTolerance: "medium",
};

describe("computeHealthScore", () => {
  it("returns totalScore between 0 and 100", () => {
    const r = computeHealthScore(basePayload);
    expect(r.totalScore).toBeGreaterThanOrEqual(0);
    expect(r.totalScore).toBeLessThanOrEqual(100);
  });

  it("returns grade A–F", () => {
    const r = computeHealthScore(basePayload);
    expect(["A", "B", "C", "D", "F"]).toContain(r.grade);
  });

  it("returns six dimension scores", () => {
    const r = computeHealthScore(basePayload);
    expect(r.dimensionScores).toHaveLength(6);
    expect(r.dimensionScores.map((d) => d.name)).toContain("Savings rate");
    expect(r.dimensionScores.map((d) => d.name)).toContain("Emergency fund");
  });

  it("returns short explanation", () => {
    const r = computeHealthScore(basePayload);
    expect(typeof r.shortExplanation).toBe("string");
    expect(r.shortExplanation.length).toBeGreaterThan(0);
  });
});
