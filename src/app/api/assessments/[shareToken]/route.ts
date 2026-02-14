import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;
    const row = await prisma.assessment.findUnique({
      where: { shareToken },
    });
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      payloadJson: row.payloadJson,
      analysisJson: row.analysisJson,
    });
  } catch (e) {
    console.error("GET /api/assessments/[shareToken]", e);
    return NextResponse.json(
      { error: "Failed to fetch assessment" },
      { status: 500 }
    );
  }
}
