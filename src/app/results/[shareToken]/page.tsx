"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/circular-progress";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { StatusPill } from "@/components/ui/status-pill";
import { SkeletonShimmer } from "@/components/ui/skeleton";
import { formatPhp } from "@/lib/utils";
import { Copy, Printer, ArrowLeft } from "lucide-react";
import type { AnalysisResult } from "@/lib/financial-engine/types";

const CHART_COLORS = ["hsl(var(--primary))", "#64748b", "#0d9488", "#f59e0b", "#6366f1", "#ec4899"];

function SpendingTooltip({ active, payload, total }: { active?: boolean; payload?: { name: string; value: number }[]; total: number }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : "0";
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-md">
      <p className="font-medium text-foreground">{p.name}</p>
      <p className="text-sm text-muted-foreground">{formatPhp(p.value)} · {pct}%</p>
    </div>
  );
}

export default function ResultsPage({ params }: { params: Promise<{ shareToken: string }> }) {
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [data, setData] = useState<{ payloadJson: unknown; analysisJson: AnalysisResult } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goalScenario, setGoalScenario] = useState<0 | 1 | 2>(1);

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
      <div className="container-narrow py-8 sm:py-10">
        <SkeletonShimmer className="h-6 w-32 mb-6" />
        <SkeletonShimmer className="h-48 w-full rounded-2xl" />
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonShimmer key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="container-narrow py-10">
        <p className="text-red-600">{error || "Not found"}</p>
        <Link href="/" className="mt-4 inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
      </div>
    );
  }

  const analysis = data.analysisJson as AnalysisResult;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = shareToken ? `${baseUrl}/results/${shareToken}` : "";

  const copyLink = () => {
    if (shareUrl) navigator.clipboard.writeText(shareUrl);
  };

  const gradeVariant = analysis.healthScore.grade === "A" || analysis.healthScore.grade === "B" ? "success" : analysis.healthScore.grade === "F" ? "warning" : "default";

  const weakestDim = analysis.healthScore.dimensionScores.reduce((a, b) => (a.score < b.score ? a : b));
  const strongestDim = analysis.healthScore.dimensionScores.reduce((a, b) => (a.score > b.score ? a : b));

  return (
    <div className="min-h-screen">
      {/* Gradient header strip */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-r from-muted/80 via-primary/5 to-muted/80 dark:from-muted/40 dark:to-primary/10">
        <div className="container-narrow py-8 sm:py-10">
          <div className="no-print flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="w-48 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground sm:w-64"
              />
              <Button size="sm" variant="secondary" onClick={copyLink} className="gap-1.5">
                <Copy className="h-4 w-4" /> Copy
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.print()} className="gap-1.5 no-print">
                <Printer className="h-4 w-4" /> Print
              </Button>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-8 flex flex-col items-center sm:flex-row sm:items-start sm:gap-10"
          >
            <CircularProgress value={analysis.healthScore.totalScore} size={128} strokeWidth={10} className="text-primary flex-shrink-0">
              <span className="text-2xl font-bold text-foreground">
                <AnimatedNumber value={analysis.healthScore.totalScore} duration={800} decimals={0} />
              </span>
            </CircularProgress>
            <div className="mt-6 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Here's your financial snapshot</h1>
              <p className="mt-2 text-muted-foreground">{analysis.healthScore.shortExplanation}</p>
              <div className="mt-4">
                <StatusPill variant={gradeVariant}>Grade {analysis.healthScore.grade}</StatusPill>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container-narrow py-8 sm:py-10">
        {/* Metrics grid with subtle highlight */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {[
            { label: "Savings rate", value: `${analysis.metrics.savingsRatePercent.toFixed(1)}%`, strong: analysis.metrics.savingsRatePercent >= 20 },
            { label: "Debt-to-income", value: `${analysis.metrics.debtToIncomePercent.toFixed(1)}%`, weak: analysis.metrics.debtToIncomePercent > 36 },
            { label: "Emergency fund", value: `${analysis.metrics.emergencyFundMonths.toFixed(1)} mo`, strong: analysis.metrics.emergencyFundMonths >= 6 },
            { label: "Monthly expenses", value: formatPhp(analysis.metrics.totalMonthlyExpenses) },
          ].map((m) => (
            <Card key={m.label} className="overflow-hidden">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className={`mt-1 text-lg font-semibold ${m.strong ? "text-success" : m.weak ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
                  {m.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </motion.section>

        {/* Section divider */}
        <div className="my-10 h-px bg-border" />

        {/* Score breakdown */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">Score breakdown</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis.healthScore.dimensionScores} layout="vertical" margin={{ left: 110 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={105} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))" }}
                  formatter={(value: number, _name: string, props: { payload?: { name: string; tip?: string } }) => [
                    value.toFixed(0),
                    props.payload?.tip ?? props.payload?.name ?? "",
                  ]}
                />
                <Bar
                  dataKey="score"
                  radius={[0, 6, 6, 0]}
                  fill="url(#scoreGradient)"
                  isAnimationActive
                  animationDuration={600}
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-success">Strongest:</span> {strongestDim.name} ·{" "}
            <span className="font-medium text-amber-600 dark:text-amber-400">Focus on:</span> {weakestDim.name}
          </p>
        </section>

        {/* Spending donut */}
        {Object.keys(analysis.spendingBreakdown).length > 0 && (
          <>
            <div className="my-10 h-px bg-border" />
            <section>
              <h2 className="text-lg font-semibold text-foreground">Spending</h2>
              <div className="mt-4 flex flex-col items-center sm:flex-row sm:items-start sm:gap-8">
                <div className="h-64 w-64 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(analysis.spendingBreakdown).map(([name, value]) => ({ name, value }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="55%"
                        outerRadius="80%"
                        paddingAngle={2}
                        label={({ name }) => name}
                      >
                        {Object.keys(analysis.spendingBreakdown).map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip content={<SpendingTooltip total={analysis.metrics.totalMonthlyExpenses} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-4 text-center">
                  <p className="text-xs text-muted-foreground">Total expenses</p>
                  <p className="text-2xl font-bold text-foreground">{formatPhp(analysis.metrics.totalMonthlyExpenses)}</p>
                  <p className="text-xs text-muted-foreground">/ month</p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Debt comparison bars */}
        {analysis.debtComparison && (
          <>
            <div className="my-10 h-px bg-border" />
            <section>
              <h2 className="text-lg font-semibold text-foreground">Debt payoff comparison</h2>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <Card className={analysis.debtComparison.summary.recommended === "avalanche" ? "ring-2 ring-primary/30" : ""}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      Avalanche
                      {analysis.debtComparison.summary.recommended === "avalanche" && (
                        <StatusPill variant="success">Recommended</StatusPill>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Months to debt-free</span>
                          <span className="font-medium">{analysis.debtComparison.summary.avalancheMonths}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (24 / Math.max(1, analysis.debtComparison.summary.avalancheMonths)) * 100)}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full rounded-full bg-primary"
                          />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">Interest: {formatPhp(analysis.debtComparison.summary.avalancheInterest)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className={analysis.debtComparison.summary.recommended === "snowball" ? "ring-2 ring-primary/30" : ""}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      Snowball
                      {analysis.debtComparison.summary.recommended === "snowball" && (
                        <StatusPill variant="success">Recommended</StatusPill>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Months to debt-free</span>
                          <span className="font-medium">{analysis.debtComparison.summary.snowballMonths}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (24 / Math.max(1, analysis.debtComparison.summary.snowballMonths)) * 100)}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full rounded-full bg-primary"
                          />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">Interest: {formatPhp(analysis.debtComparison.summary.snowballInterest)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{analysis.debtComparison.summary.reason}</p>
            </section>
          </>
        )}

        {/* Goal projection with scenario toggle */}
        {analysis.goalProjections.length > 0 && (
          <>
            <div className="my-10 h-px bg-border" />
            <section>
              <h2 className="text-lg font-semibold text-foreground">Goal projection</h2>
              {analysis.goalProjections.map((gp, idx) => (
                <Card key={idx} className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-base">{gp.goalType}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {formatPhp(gp.targetAmountToday)} today → {formatPhp(gp.inflationAdjustedTarget)} in {gp.yearsToGoal.toFixed(0)} years
                    </p>
                    <div className="flex gap-2 mt-2">
                      {(["Conservative", "Moderate", "Aggressive"] as const).map((label, i) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setGoalScenario(i as 0 | 1 | 2)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            goalScenario === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-border"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={gp.chartData}>
                          <defs>
                            <linearGradient id={`areaFill-${idx}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: number) => [formatPhp(v), "Target"]} contentStyle={{ borderRadius: "12px" }} />
                          <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill={`url(#areaFill-${idx})`} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      {gp.scenarios[goalScenario].label}: {formatPhp(gp.scenarios[goalScenario].monthlyContribution)}/month
                    </p>
                  </CardContent>
                </Card>
              ))}
            </section>
          </>
        )}

        {/* Action plan */}
        <div className="my-10 h-px bg-border" />
        <section>
          <h2 className="text-lg font-semibold text-foreground">90-day action plan</h2>
          <div className="mt-6 space-y-6">
            {[
              { title: "This week", items: analysis.actionPlan.thisWeek },
              { title: "This month", items: analysis.actionPlan.thisMonth },
              { title: "Next 3 months", items: analysis.actionPlan.next3Months },
            ].map((block) =>
              block.items.length > 0 ? (
                <Card key={block.title}>
                  <CardHeader>
                    <CardTitle className="text-base">{block.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {block.items.map((item) => (
                      <div key={item.id} className="flex gap-3 border-l-2 border-primary/30 pl-4">
                        <div>
                          <p className="font-medium text-foreground">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          {item.numericTarget && (
                            <p className="mt-1 text-sm text-primary">{item.numericTarget}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null
            )}
          </div>
        </section>

        <p className="mt-12 text-sm text-muted-foreground print:mt-8">
          This is for education only. Not financial, tax, or legal advice. Consult a licensed advisor for your situation.
        </p>
      </div>
    </div>
  );
}
