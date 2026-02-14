"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AssessmentPayload } from "@/lib/financial-engine/types";

const STEPS = [
  "Income",
  "Expenses",
  "Debt",
  "Savings",
  "Profile",
  "Goals",
  "Investing",
  "Review",
];

const defaultPayload: AssessmentPayload = {
  monthlyIncome: 0,
  employmentStability: "stable",
  incomeVariability: "stable",
  expenses: {
    rent: 0,
    utilities: 0,
    food: 0,
    transport: 0,
    subscriptions: 0,
    discretionary: 0,
    dependentsSupport: 0,
  },
  debts: [],
  emergencyFund: 0,
  monthlySavings: 0,
  dependentsCount: 0,
  isBreadwinner: false,
  goals: [],
  investingStatus: "none",
  riskTolerance: "medium",
};

export default function AssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [payload, setPayload] = useState<AssessmentPayload>(defaultPayload);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof AssessmentPayload>(key: K, value: AssessmentPayload[K]) => {
    setPayload((p) => ({ ...p, [key]: value }));
    setError(null);
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      router.push(`/results/${data.shareToken}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const totalExpenses =
    payload.expenses.rent +
    payload.expenses.utilities +
    payload.expenses.food +
    payload.expenses.transport +
    payload.expenses.subscriptions +
    payload.expenses.discretionary +
    payload.expenses.dependentsSupport;
  const expenseWarning = payload.monthlyIncome > 0 && totalExpenses > payload.monthlyIncome;

  return (
    <div className="container-narrow py-10">
      <Link href="/" className="text-sm text-[hsl(var(--primary))] hover:underline">
        ← Home
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-[hsl(var(--foreground))]">
        Financial health checkup
      </h1>
      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </p>

      <div className="mt-6 flex gap-1">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--border))]"}`}
          />
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">{STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div>
                <Label>Monthly net income (₱)</Label>
                <Input
                  type="number"
                  min={1}
                  step={1000}
                  value={payload.monthlyIncome || ""}
                  onChange={(e) => update("monthlyIncome", Number(e.target.value) || 0)}
                  prefix="₱"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Employment type</Label>
                <select
                  className="mt-1 h-11 w-full rounded-xl border border-[hsl(var(--border))] px-4"
                  value={payload.employmentStability}
                  onChange={(e) => update("employmentStability", e.target.value as AssessmentPayload["employmentStability"])}
                >
                  <option value="stable">Stable</option>
                  <option value="contractual">Contractual</option>
                  <option value="gig">Gig / freelance</option>
                </select>
              </div>
              <div>
                <Label>Income variability</Label>
                <select
                  className="mt-1 h-11 w-full rounded-xl border border-[hsl(var(--border))] px-4"
                  value={payload.incomeVariability}
                  onChange={(e) => update("incomeVariability", e.target.value as AssessmentPayload["incomeVariability"])}
                >
                  <option value="stable">Stable</option>
                  <option value="variable">Variable</option>
                  <option value="highly_variable">Highly variable</option>
                </select>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              {(["rent", "utilities", "food", "transport", "subscriptions", "discretionary", "dependentsSupport"] as const).map((key) => (
                <div key={key}>
                  <Label>
                    {key === "dependentsSupport" ? "Dependents support" : key.charAt(0).toUpperCase() + key.slice(1)} (₱)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    value={payload.expenses[key] ?? ""}
                    onChange={(e) =>
                      update("expenses", {
                        ...payload.expenses,
                        [key]: Number(e.target.value) || 0,
                      })
                    }
                    prefix="₱"
                    className="mt-1"
                  />
                </div>
              ))}
              {expenseWarning && (
                <p className="text-sm text-amber-600">Expenses exceed income. Consider adjusting.</p>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Add each debt. Leave empty if none.</p>
              {payload.debts.map((d, i) => (
                <div key={i} className="rounded-xl border border-[hsl(var(--border))] p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Debt #{i + 1}</span>
                    <button
                      type="button"
                      className="text-sm text-[hsl(var(--primary))]"
                      onClick={() => update("debts", payload.debts.filter((_, j) => j !== i))}
                    >
                      Remove
                    </button>
                  </div>
                  <Input type="number" min={0} placeholder="Balance (₱)" value={d.balance || ""} onChange={(e) => {
                    const next = [...payload.debts];
                    next[i] = { ...next[i], balance: Number(e.target.value) || 0 };
                    update("debts", next);
                  }} prefix="₱" />
                  <Input type="number" min={0} max={100} step={0.5} placeholder="Interest % per year" value={d.interestRateAnnual || ""} onChange={(e) => {
                    const next = [...payload.debts];
                    next[i] = { ...next[i], interestRateAnnual: Number(e.target.value) || 0 };
                    update("debts", next);
                  }} />
                  <Input type="number" min={0} placeholder="Monthly payment (₱)" value={d.monthlyPayment || ""} onChange={(e) => {
                    const next = [...payload.debts];
                    next[i] = { ...next[i], monthlyPayment: Number(e.target.value) || 0 };
                    update("debts", next);
                  }} prefix="₱" />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => update("debts", [...payload.debts, { balance: 0, interestRateAnnual: 0, monthlyPayment: 0 }])}>
                + Add debt
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <Label>Emergency fund amount (₱)</Label>
                <Input type="number" min={0} step={1000} value={payload.emergencyFund || ""} onChange={(e) => update("emergencyFund", Number(e.target.value) || 0)} prefix="₱" className="mt-1" />
              </div>
              <div>
                <Label>Monthly savings (₱)</Label>
                <Input type="number" min={0} step={500} value={payload.monthlySavings || ""} onChange={(e) => update("monthlySavings", Number(e.target.value) || 0)} prefix="₱" className="mt-1" />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div>
                <Label>Number of dependents</Label>
                <Input type="number" min={0} max={20} value={payload.dependentsCount} onChange={(e) => update("dependentsCount", Number(e.target.value) || 0)} className="mt-1" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={payload.isBreadwinner} onChange={(e) => update("isBreadwinner", e.target.checked)} />
                <span className="text-sm">I am a breadwinner</span>
              </label>
            </>
          )}

          {step === 5 && (
            <>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Add goals for inflation-adjusted projections.</p>
              {payload.goals.map((g, i) => (
                <div key={i} className="rounded-xl border border-[hsl(var(--border))] p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Goal #{i + 1}</span>
                    <button type="button" className="text-sm text-[hsl(var(--primary))]" onClick={() => update("goals", payload.goals.filter((_, j) => j !== i))}>Remove</button>
                  </div>
                  <Input type="number" min={0} step={1000} placeholder="Target amount (₱)" value={g.targetAmountToday || ""} onChange={(e) => {
                    const next = [...payload.goals];
                    next[i] = { ...next[i], targetAmountToday: Number(e.target.value) || 0 };
                    update("goals", next);
                  }} prefix="₱" />
                  <div>
                    <Label>Target date</Label>
                    <Input type="date" value={g.targetDate} onChange={(e) => {
                      const next = [...payload.goals];
                      next[i] = { ...next[i], targetDate: e.target.value };
                      update("goals", next);
                    }} className="mt-1" />
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => update("goals", [...payload.goals, { goalType: "other", targetAmountToday: 0, targetDate: new Date().toISOString().slice(0, 10) }])}>
                + Add goal
              </Button>
            </>
          )}

          {step === 6 && (
            <>
              <div>
                <Label>Investing status</Label>
                <select className="mt-1 h-11 w-full rounded-xl border border-[hsl(var(--border))] px-4" value={payload.investingStatus} onChange={(e) => update("investingStatus", e.target.value as AssessmentPayload["investingStatus"])}>
                  <option value="none">Not investing yet</option>
                  <option value="exploring">Exploring</option>
                  <option value="active">Active</option>
                </select>
              </div>
              <div>
                <Label>Risk tolerance</Label>
                <select className="mt-1 h-11 w-full rounded-xl border border-[hsl(var(--border))] px-4" value={payload.riskTolerance} onChange={(e) => update("riskTolerance", e.target.value as AssessmentPayload["riskTolerance"])}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </>
          )}

          {step === 7 && (
            <div className="space-y-2 text-sm">
              <p>Income: ₱{payload.monthlyIncome.toLocaleString()}</p>
              <p>Emergency fund: ₱{payload.emergencyFund.toLocaleString()}</p>
              <p>Monthly savings: ₱{payload.monthlySavings.toLocaleString()}</p>
              <p>Debts: {payload.debts.length}</p>
              <p>Goals: {payload.goals.length}</p>
              <p className="text-[hsl(var(--muted-foreground))]">Submit to get your score and action plan.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={prev} disabled={step === 0}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next}>Next</Button>
        ) : (
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Submitting…" : "See my results"}
          </Button>
        )}
      </div>
    </div>
  );
}
