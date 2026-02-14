/**
 * Financial Health Score 0–100, grade A–F, per-dimension scores.
 * Weights: Savings 25%, Emergency 20%, DTI 20%, Expense 15%, Stability 10%, Investing/Goals 10%.
 */

import type { AssessmentPayload, DimensionScore, HealthScoreResult } from "./types";
import { computeMetrics } from "./metrics";
import { getEmergencyFundTargetMonths } from "./metrics";

const WEIGHT_SAVINGS = 0.25;
const WEIGHT_EMERGENCY = 0.2;
const WEIGHT_DTI = 0.2;
const WEIGHT_EXPENSE = 0.15;
const WEIGHT_STABILITY = 0.1;
const WEIGHT_GOALS = 0.1;

export function computeHealthScore(payload: AssessmentPayload): HealthScoreResult {
  const metrics = computeMetrics(payload);
  const targetMonths = getEmergencyFundTargetMonths(payload);

  const savingsScore = scoreSavingsRate(metrics.savingsRatePercent);
  const emergencyScore = scoreEmergencyFund(metrics.emergencyFundMonths, targetMonths);
  const dtiScore = scoreDTI(metrics.debtToIncomePercent);
  const expenseScore = scoreExpenseRatio(metrics.expenseRatio);
  const stabilityScore = scoreStability(
    payload.employmentStability,
    payload.incomeVariability
  );
  const goalsScore = scoreGoalsAndInvesting(
    payload.investingStatus,
    payload.riskTolerance,
    payload.goals.length
  );

  const dimensions: DimensionScore[] = [
    { name: "Savings rate", score: savingsScore.score, weightPercent: 25, weightedScore: round(savingsScore.score * WEIGHT_SAVINGS, 2), tip: savingsScore.tip },
    { name: "Emergency fund", score: emergencyScore.score, weightPercent: 20, weightedScore: round(emergencyScore.score * WEIGHT_EMERGENCY, 2), tip: emergencyScore.tip },
    { name: "Debt-to-income", score: dtiScore.score, weightPercent: 20, weightedScore: round(dtiScore.score * WEIGHT_DTI, 2), tip: dtiScore.tip },
    { name: "Expense ratio", score: expenseScore.score, weightPercent: 15, weightedScore: round(expenseScore.score * WEIGHT_EXPENSE, 2), tip: expenseScore.tip },
    { name: "Income stability", score: stabilityScore.score, weightPercent: 10, weightedScore: round(stabilityScore.score * WEIGHT_STABILITY, 2), tip: stabilityScore.tip },
    { name: "Goals & investing", score: goalsScore.score, weightPercent: 10, weightedScore: round(goalsScore.score * WEIGHT_GOALS, 2), tip: goalsScore.tip },
  ];

  const totalScore = Math.min(100, round(dimensions.reduce((s, d) => s + d.weightedScore, 0), 2));
  const grade = scoreToGrade(totalScore);
  const shortExplanation = getShortExplanation(totalScore, grade);

  return {
    totalScore,
    grade,
    dimensionScores: dimensions,
    shortExplanation,
  };
}

function scoreSavingsRate(ratePercent: number): { score: number; tip: string } {
  const score = Math.min(100, ratePercent * 5);
  const tip = ratePercent < 5
    ? "Aim to save at least 5–10% of income. Start with automatic transfers."
    : ratePercent < 20
    ? "Good progress. PH guideline: aim for 20% when possible."
    : "Strong savings rate. Consider investing the excess.";
  return { score: round(score, 2), tip };
}

function scoreEmergencyFund(months: number, targetMonths: number): { score: number; tip: string } {
  const score = targetMonths > 0 ? Math.min(100, (months / targetMonths) * 100) : 0;
  const tip = months < 3
    ? "Build 3–6 months of expenses first. Breadwinners: aim for 6–12 months."
    : months < targetMonths
    ? `You're at ${months.toFixed(1)} months. Target ${targetMonths} for better security.`
    : "Emergency fund coverage looks solid. Keep it in a high-yield account.";
  return { score: round(score, 2), tip };
}

function scoreDTI(percent: number): { score: number; tip: string } {
  const score = Math.max(0, 100 - percent * 2.5);
  const tip = percent > 36
    ? "DTI above 36% is high. Focus on high-interest debt first."
    : percent > 20
    ? "Moderate debt load. Consider extra payments to reduce interest."
    : "Healthy debt-to-income. Avoid new debt.";
  return { score: round(score, 2), tip };
}

function scoreExpenseRatio(ratio: number): { score: number; tip: string } {
  const saveRate = 1 - ratio;
  const score = Math.min(100, Math.max(0, saveRate * (100 / 0.3)));
  const tip = ratio > 0.95
    ? "Expenses are very high vs income. Look for areas to cut."
    : ratio > 0.8
    ? "Try to bring expenses below 80% of income."
    : "Expense ratio looks manageable.";
  return { score: round(score, 2), tip };
}

function scoreStability(
  employment: string,
  variability: string
): { score: number; tip: string } {
  const emp = { stable: 1, contractual: 0.7, gig: 0.4 }[employment] ?? 0.5;
  const var_ = { stable: 1, variable: 0.7, highly_variable: 0.4 }[variability] ?? 0.5;
  const score = ((emp + var_) / 2) * 100;
  const tip = score < 50
    ? "With variable income, build a larger emergency fund."
    : score < 80
    ? "Consider a side income or upskilling."
    : "Stable income allows consistent saving. Automate it.";
  return { score: round(score, 2), tip };
}

function scoreGoalsAndInvesting(
  investing: string,
  risk: string,
  goalsCount: number
): { score: number; tip: string } {
  const inv = { none: 0.3, exploring: 0.6, active: 1 }[investing] ?? 0.3;
  const riskBonus = risk !== "low" ? 0.2 : 0.1;
  const goalBonus = goalsCount > 0 ? 0.3 : 0;
  const score = Math.min(100, inv * 70 + riskBonus * 30 + goalBonus * 50);
  const tip = investing === "none"
    ? "Start with Pag-IBIG/SSS, then explore UITFs."
    : "Set target dates and amounts; use inflation-adjusted targets.";
  return { score: round(score, 2), tip };
}

function scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function getShortExplanation(score: number, grade: string): string {
  if (grade === "A") return "Your finances are in strong shape. Keep building habits and goals.";
  if (grade === "B") return "Good foundation. Focus on emergency fund and debt if any.";
  if (grade === "C") return "Room to improve. Prioritize savings rate and expense control.";
  if (grade === "D") return "Several areas need attention. Start with one priority (e.g. emergency fund).";
  return "Focus on basics: track spending, build emergency fund, reduce high-interest debt.";
}

function round(n: number, d: number): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}
