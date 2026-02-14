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
    const payloadJson = typeof row.payloadJson === "string" ? JSON.parse(row.payloadJson) : row.payloadJson;
    const analysisJson = typeof row.analysisJson === "string" ? JSON.parse(row.analysisJson) : row.analysisJson;
    return NextResponse.json({
      payloadJson,
      analysisJson,
    });
  } catch (e) {
    console.error("GET /api/assessments/[shareToken]", e);
    return NextResponse.json(
      { error: "Failed to fetch assessment" },
      { status: 500 }
    );
  }
}
