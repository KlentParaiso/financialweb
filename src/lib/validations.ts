import { z } from "zod";

const expenseBreakdownSchema = z.object({
  rent: z.number().min(0),
  utilities: z.number().min(0),
  food: z.number().min(0),
  transport: z.number().min(0),
  subscriptions: z.number().min(0),
  discretionary: z.number().min(0),
  dependentsSupport: z.number().min(0),
});

const debtItemSchema = z.object({
  balance: z.number().min(0),
  interestRateAnnual: z.number().min(0).max(100),
  monthlyPayment: z.number().min(0),
  name: z.string().optional(),
});

const goalInputSchema = z.object({
  goalType: z.string(),
  targetAmountToday: z.number().min(0),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  inflationRatePercent: z.number().min(0).max(20).optional(),
});

export const assessmentPayloadSchema = z.object({
  monthlyIncome: z.number().positive(),
  employmentStability: z.enum(["stable", "contractual", "gig"]),
  incomeVariability: z.enum(["stable", "variable", "highly_variable"]),
  expenses: expenseBreakdownSchema,
  debts: z.array(debtItemSchema),
  emergencyFund: z.number().min(0),
  monthlySavings: z.number().min(0),
  dependentsCount: z.number().int().min(0).max(20),
  isBreadwinner: z.boolean(),
  goals: z.array(goalInputSchema),
  investingStatus: z.enum(["none", "exploring", "active"]),
  riskTolerance: z.enum(["low", "medium", "high"]),
});

export type AssessmentPayloadInput = z.infer<typeof assessmentPayloadSchema>;
