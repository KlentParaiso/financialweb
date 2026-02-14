"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPhp } from "@/lib/utils";
import type { AnalysisResult } from "@/lib/financial-engine/types";

const COLORS = ["hsl(var(--primary))", "#64748b", "#0d9488", "#f59e0b", "#6366f1", "#ec4899"];

export default function ResultsPage({ params }: { params: Promise<{ shareToken: string }> }) {
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [data, setData] = useState<{ payloadJson: unknown; analysisJson: AnalysisResult } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    params.then((p) => {
      setShareToken(p.shareToken);
      fetch(`/api/assessments/${p.shareToken}`)
        .then((res) => res.json())
        .then((json) => {
          if (!cancelled) setData(json);
        })
        .catch(() => {
          if (!cancelled) setError("Failed to load results");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });
    return () => { cancelled = true; };
  }, [params]);

  if (loading) {
    return (
      <div className="container-narrow py-10">
        <div className="h-8 w-48 animate-pulse rounded bg-[hsl(var(--muted))]" />
        <div className="mt-6 h-64 animate-pulse rounded-xl bg-[hsl(var(--muted))]" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="container-narrow py-10">
        <p className="text-red-600">{error || "Not found"}</p>
        <Link href="/" className="mt-4 inline-block text-[hsl(var(--primary))]">← Home</Link>
      </div>
    );
  }

  const analysis = data.analysisJson as AnalysisResult;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = shareToken ? `${baseUrl}/results/${shareToken}` : "";

  const copyLink = () => {
    if (shareUrl) navigator.clipboard.writeText(shareUrl);
  };

  const gradeColors: Record<string, string> = {
    A: "text-emerald-600",
    B: "text-teal-600",
    C: "text-amber-600",
    D: "text-orange-600",
    F: "text-red-600",
  };

  return (
    <div className="container-narrow py-10">
      <Link href="/" className="text-sm text-[hsl(var(--primary))] hover:underline">← Home</Link>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Your financial health</h1>
        <div className="flex items-center gap-2">
          <input readOnly value={shareUrl} className="w-64 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-sm" />
          <Button size="sm" variant="secondary" onClick={copyLink}>Copy link</Button>
        </div>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-4">
            <span className="text-4xl font-bold text-[hsl(var(--foreground))]">{analysis.healthScore.totalScore.toFixed(0)}</span>
            <span className={`text-2xl font-semibold ${gradeColors[analysis.healthScore.grade] || ""}`}>Grade {analysis.healthScore.grade}</span>
          </div>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{analysis.healthScore.shortExplanation}</p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-[hsl(var(--muted-foreground))]">Savings rate</p>
              <p className="font-medium">{analysis.metrics.savingsRatePercent.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[hsl(var(--muted-foreground))]">Debt-to-income</p>
              <p className="font-medium">{analysis.metrics.debtToIncomePercent.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[hsl(var(--muted-foreground))]">Emergency fund</p>
              <p className="font-medium">{analysis.metrics.emergencyFundMonths.toFixed(1)} months</p>
            </div>
            <div>
              <p className="text-[hsl(var(--muted-foreground))]">Monthly expenses</p>
              <p className="font-medium">{formatPhp(analysis.metrics.totalMonthlyExpenses)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Score breakdown</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analysis.healthScore.dimensionScores} layout="vertical" margin={{ left: 100 }}>
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {Object.keys(analysis.spendingBreakdown).length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Spending</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(analysis.spendingBreakdown).map(([name, value]) => ({ name, value }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${formatPhp(value)}`}
                >
                  {Object.keys(analysis.spendingBreakdown).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatPhp(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {analysis.debtComparison && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Debt payoff comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[hsl(var(--border))] p-4">
                <p className="font-medium">Avalanche</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{analysis.debtComparison.summary.avalancheMonths} months · {formatPhp(analysis.debtComparison.summary.avalancheInterest)} interest</p>
              </div>
              <div className="rounded-xl border border-[hsl(var(--border))] p-4">
                <p className="font-medium">Snowball</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{analysis.debtComparison.summary.snowballMonths} months · {formatPhp(analysis.debtComparison.summary.snowballInterest)} interest</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">{analysis.debtComparison.summary.reason}</p>
          </CardContent>
        </Card>
      )}

      {analysis.goalProjections.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Goal projection</h2>
          {analysis.goalProjections.map((gp, i) => (
            <Card key={i} className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">{gp.goalType}</CardTitle>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {formatPhp(gp.targetAmountToday)} today → {formatPhp(gp.inflationAdjustedTarget)} in {gp.yearsToGoal.toFixed(0)} years
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={gp.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => formatPhp(v)} />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" name="Target" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                  {gp.scenarios.map((s) => (
                    <div key={s.label} className="rounded-lg border border-[hsl(var(--border))] p-3">
                      <p className="font-medium">{s.label}</p>
                      <p>{formatPhp(s.monthlyContribution)}/mo</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">90-day action plan</h2>
        <div className="mt-4 space-y-6">
          {analysis.actionPlan.thisWeek.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">This week</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.actionPlan.thisWeek.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <span className="text-[hsl(var(--primary))]">•</span>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">{item.description}</p>
                      {item.numericTarget && <p className="text-sm text-[hsl(var(--primary))]">{item.numericTarget}</p>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {analysis.actionPlan.thisMonth.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">This month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.actionPlan.thisMonth.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <span className="text-[hsl(var(--primary))]">•</span>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">{item.description}</p>
                      {item.numericTarget && <p className="text-sm text-[hsl(var(--primary))]">{item.numericTarget}</p>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {analysis.actionPlan.next3Months.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Next 3 months</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.actionPlan.next3Months.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <span className="text-[hsl(var(--primary))]">•</span>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">{item.description}</p>
                      {item.numericTarget && <p className="text-sm text-[hsl(var(--primary))]">{item.numericTarget}</p>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <p className="mt-10 text-sm text-[hsl(var(--muted-foreground))]">
        This is for education only. Not financial, tax, or legal advice. Consult a licensed advisor for your situation.
      </p>
    </div>
  );
}
