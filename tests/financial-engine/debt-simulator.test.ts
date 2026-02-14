import { describe, it, expect } from "vitest";
import { simulateDebtPayoff } from "@/lib/financial-engine/debt-simulator";

describe("simulateDebtPayoff", () => {
  it("returns null for empty debts", () => {
    expect(simulateDebtPayoff([])).toBeNull();
  });

  it("returns avalanche and snowball results", () => {
    const debts = [
      { balance: 50_000, interestRateAnnual: 18, monthlyPayment: 2_000 },
      { balance: 30_000, interestRateAnnual: 12, monthlyPayment: 1_500 },
    ];
    const result = simulateDebtPayoff(debts);
    expect(result).not.toBeNull();
    expect(result!.avalanche.method).toBe("avalanche");
    expect(result!.snowball.method).toBe("snowball");
    expect(result!.avalanche.monthsToDebtFree).toBeGreaterThan(0);
    expect(result!.snowball.monthsToDebtFree).toBeGreaterThan(0);
    expect(result!.summary.avalancheMonths).toBe(result!.avalanche.monthsToDebtFree);
    expect(result!.summary.snowballMonths).toBe(result!.snowball.monthsToDebtFree);
  });
});
