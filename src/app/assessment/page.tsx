"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Receipt, CreditCard, PiggyBank, Users, Target, TrendingUp, ClipboardCheck } from "lucide-react";
import type { AssessmentPayload } from "@/lib/financial-engine/types";

const STEPS = [
  { label: "Income", icon: Wallet },
  { label: "Expenses", icon: Receipt },
  { label: "Debt", icon: CreditCard },
  { label: "Savings", icon: PiggyBank },
  { label: "Profile", icon: Users },
  { label: "Goals", icon: Target },
  { label: "Investing", icon: TrendingUp },
  { label: "Review", icon: ClipboardCheck },
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

  const StepIcon = STEPS[step].icon;

  return (
    <div className="container-narrow py-8 sm:py-10">
      <Link href="/" className="text-sm text-primary hover:underline transition-colors">
        ← Home
      </Link>
      <motion.h1
        key="title"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 text-2xl font-bold text-foreground sm:text-3xl"
      >
        Financial health checkup
      </motion.h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Step {step + 1} of {STEPS.length}: {STEPS[step].label}
      </p>

      <div className="mt-6 flex gap-1" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
        {STEPS.map((s, i) => (
          <div
            key={s.label}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${i <= step ? "bg-primary" : "bg-border"}`}
          />
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <StepIcon className="h-5 w-5" />
            </span>
            <CardTitle className="text-lg">{STEPS[step].label}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
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
                  className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-4 text-foreground focus:ring-2 focus:ring-primary focus:ring-offset-1"
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
                  className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-4 text-foreground focus:ring-2 focus:ring-primary focus:ring-offset-1"
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
              <p className="text-sm text-muted-foreground">Add each debt. Leave empty if none.</p>
              {payload.debts.map((d, i) => (
                <div key={i} className="rounded-xl border border-border p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Debt #{i + 1}</span>
                    <button
                      type="button"
                      className="text-sm text-primary"
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
              <p className="text-sm text-muted-foreground">Add goals for inflation-adjusted projections.</p>
              {payload.goals.map((g, i) => (
                <div key={i} className="rounded-xl border border-border p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Goal #{i + 1}</span>
                    <button type="button" className="text-sm text-primary" onClick={() => update("goals", payload.goals.filter((_, j) => j !== i))}>Remove</button>
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
                <select className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-4 text-foreground focus:ring-2 focus:ring-primary focus:ring-offset-1" value={payload.investingStatus} onChange={(e) => update("investingStatus", e.target.value as AssessmentPayload["investingStatus"])}>
                  <option value="none">Not investing yet</option>
                  <option value="exploring">Exploring</option>
                  <option value="active">Active</option>
                </select>
              </div>
              <div>
                <Label>Risk tolerance</Label>
                <select className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-4 text-foreground focus:ring-2 focus:ring-primary focus:ring-offset-1" value={payload.riskTolerance} onChange={(e) => update("riskTolerance", e.target.value as AssessmentPayload["riskTolerance"])}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </>
          )}

          {step === 7 && (
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground mb-3">Summary</p>
              <table className="w-full text-sm text-muted-foreground">
                <tbody>
                  <tr><td className="py-1">Income</td><td className="text-right font-medium text-foreground">₱{payload.monthlyIncome.toLocaleString()}</td></tr>
                  <tr><td className="py-1">Emergency fund</td><td className="text-right font-medium text-foreground">₱{payload.emergencyFund.toLocaleString()}</td></tr>
                  <tr><td className="py-1">Monthly savings</td><td className="text-right font-medium text-foreground">₱{payload.monthlySavings.toLocaleString()}</td></tr>
                  <tr><td className="py-1">Debts</td><td className="text-right font-medium text-foreground">{payload.debts.length}</td></tr>
                  <tr><td className="py-1">Goals</td><td className="text-right font-medium text-foreground">{payload.goals.length}</td></tr>
                </tbody>
              </table>
              <p className="mt-4 text-sm text-muted-foreground">Submit to get your score and action plan.</p>
            </div>
          )}
            </motion.div>
          </AnimatePresence>
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
