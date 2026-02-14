/**
 * Inflation-adjusted goal projection.
 * Future target = amountToday * (1 + inflation)^years
 * Monthly contribution from FV of annuity: FV = PMT * (((1+r)^n - 1) / r)
 */

import type { AssessmentPayload, GoalProjection, GoalScenario } from "./types";

const RETURN_CONSERVATIVE = 0.04;
const RETURN_MODERATE = 0.07;
const RETURN_AGGRESSIVE = 0.1;

export function computeGoalProjections(payload: AssessmentPayload): GoalProjection[] {
  const inflationDefault = 3.5 / 100;
  return payload.goals.map((goal) => {
    const years = yearsFromToday(goal.targetDate);
    const inflation = (goal.inflationRatePercent ?? 3.5) / 100;
    const targetFuture = goal.targetAmountToday * Math.pow(1 + inflation, years);

    const scenarios: GoalScenario[] = [
      buildScenario("Conservative", targetFuture, years, RETURN_CONSERVATIVE),
      buildScenario("Moderate", targetFuture, years, RETURN_MODERATE),
      buildScenario("Aggressive", targetFuture, years, RETURN_AGGRESSIVE),
    ];

    const chartData = buildChartData(goal.targetAmountToday, inflation, years);

    return {
      goalType: goal.goalType,
      targetAmountToday: goal.targetAmountToday,
      yearsToGoal: years,
      inflationRatePercent: goal.inflationRatePercent ?? 3.5,
      inflationAdjustedTarget: round(targetFuture, 2),
      scenarios,
      chartData,
    };
  });
}

function yearsFromToday(targetDate: string): number {
  const target = new Date(targetDate);
  const today = new Date();
  const years = (target.getTime() - today.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return Math.max(0.5, years);
}

function monthlyContributionForTarget(
  futureValue: number,
  years: number,
  annualReturn: number
): number {
  const n = Math.max(1, Math.floor(years * 12));
  const r = annualReturn / 12;
  if (r <= 0) return futureValue / n;
  const factor = Math.pow(1 + r, n) - 1;
  return (futureValue * r) / factor;
}

function futureValueOfAnnuity(
  monthlyPmt: number,
  years: number,
  annualReturn: number
): number {
  const n = Math.max(1, Math.floor(years * 12));
  const r = annualReturn / 12;
  if (r <= 0) return monthlyPmt * n;
  return monthlyPmt * (Math.pow(1 + r, n) - 1) / r;
}

function buildScenario(
  label: "Conservative" | "Moderate" | "Aggressive",
  targetFuture: number,
  years: number,
  annualReturn: number
): GoalScenario {
  const monthly = monthlyContributionForTarget(targetFuture, years, annualReturn);
  const fv = futureValueOfAnnuity(monthly, years, annualReturn);
  return {
    label,
    monthlyContribution: round(monthly, 2),
    totalContribution: round(monthly * years * 12, 2),
    futureValue: round(fv, 2),
    inflationAdjustedTarget: round(targetFuture, 2),
    shortfallOrSurplus: round(targetFuture - fv, 2),
  };
}

function buildChartData(
  amountToday: number,
  inflation: number,
  years: number
): { year: number; value: number }[] {
  const data: { year: number; value: number }[] = [];
  const now = new Date().getFullYear();
  for (let y = 0; y <= Math.ceil(years); y++) {
    data.push({
      year: now + y,
      value: round(amountToday * Math.pow(1 + inflation, y), 2),
    });
  }
  return data;
}

function round(n: number, d: number): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}
