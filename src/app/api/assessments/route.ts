import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { assessmentPayloadSchema } from "@/lib/validations";
import { runAnalysis } from "@/lib/financial-engine";
import { prisma } from "@/lib/db";
import type { AssessmentPayload } from "@/lib/financial-engine/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = assessmentPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const payload: AssessmentPayload = {
      monthlyIncome: parsed.data.monthlyIncome,
      employmentStability: parsed.data.employmentStability,
      incomeVariability: parsed.data.incomeVariability,
      expenses: parsed.data.expenses,
      debts: parsed.data.debts,
      emergencyFund: parsed.data.emergencyFund,
      monthlySavings: parsed.data.monthlySavings,
      dependentsCount: parsed.data.dependentsCount,
      isBreadwinner: parsed.data.isBreadwinner,
      goals: parsed.data.goals,
      investingStatus: parsed.data.investingStatus,
      riskTolerance: parsed.data.riskTolerance,
    };

    const analysis = runAnalysis(payload);
    const shareToken = nanoid(21);

    await prisma.assessment.create({
      data: {
        shareToken,
        payloadJson: payload as unknown as object,
        analysisJson: analysis as unknown as object,
      },
    });

    return NextResponse.json({ shareToken });
  } catch (e) {
    console.error("POST /api/assessments", e);
    return NextResponse.json(
      { error: "Failed to create assessment" },
      { status: 500 }
    );
  }
}
