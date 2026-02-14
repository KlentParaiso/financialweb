"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type {
  AssessmentCreate,
  ProfileInput,
  IncomeInput,
  ExpensesInput,
  DebtInput,
  SavingsInput,
  InvestingInput,
  GoalInput,
} from "@/lib/api";
import { createAssessment } from "@/lib/api";

const STEPS = [
  "Profile",
  "Income",
  "Expenses",
  "Debt",
  "Savings",
  "Investing",
  "Goals",
  "Preferences",
];

const defaultPayload: AssessmentCreate = {
  profile: {
    age: 25,
    employment_type: "stable",
    ofw_mode: false,
    is_breadwinner: false,
    number_of_dependents: 0,
  },
  income: {
    monthly_net_income: 30000,
    income_variability: "stable",
  },
  expenses: {
    rent: 0,
    utilities: 0,
    food: 0,
    transport: 0,
    subscriptions: 0,
    discretionary: 0,
    dependents_support: 0,
  },
  debt: { items: [] },
  savings: { emergency_fund_amount: 0, monthly_savings: 0 },
  investing: { investing_status: "none", risk_tolerance: "medium" },
  goals: [],
  default_inflation_rate: 3.5,
  expected_return_profile: "moderate",
};

export default function AssessPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [payload, setPayload] = useState<AssessmentCreate>(defaultPayload);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof AssessmentCreate>(
    key: K,
    value: AssessmentCreate[K]
  ) => {
    setPayload((p) => ({ ...p, [key]: value }));
    setError(null);
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await createAssessment(payload);
      router.push(`/results/${res.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
        ← Home
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Financial assessment</h1>
      <p className="text-gray-600 text-sm mb-6">
        Your answers are used only to compute your score and tips. We don’t store personally identifying info.
      </p>

      {/* Progress */}
      <div className="flex gap-1 mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded ${
              i <= step ? "bg-teal-600" : "bg-gray-200"
            }`}
            title={STEPS[i]}
          />
        ))}
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </p>

      {/* Step content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
        {step === 0 && (
          <ProfileStep value={payload.profile} onChange={(v) => update("profile", v)} />
        )}
        {step === 1 && (
          <IncomeStep value={payload.income} onChange={(v) => update("income", v)} />
        )}
        {step === 2 && (
          <ExpensesStep value={payload.expenses} onChange={(v) => update("expenses", v)} />
        )}
        {step === 3 && (
          <DebtStep value={payload.debt} onChange={(v) => update("debt", v)} />
        )}
        {step === 4 && (
          <SavingsStep value={payload.savings} onChange={(v) => update("savings", v)} />
        )}
        {step === 5 && (
          <InvestingStep value={payload.investing} onChange={(v) => update("investing", v)} />
        )}
        {step === 6 && (
          <GoalsStep value={payload.goals} onChange={(v) => update("goals", v)} />
        )}
        {step === 7 && (
          <PreferencesStep
            inflation={payload.default_inflation_rate}
            returnProfile={payload.expected_return_profile}
            onInflation={(v) => update("default_inflation_rate", v)}
            onReturn={(v) => update("expected_return_profile", v)}
          />
        )}
      </div>

      {error && (
        <p className="text-red-600 text-sm mb-4">{error}</p>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={prev}
          disabled={step === 0}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={next}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-70"
          >
            {submitting ? "Submitting…" : "See my results"}
          </button>
        )}
      </div>
    </div>
  );
}

function ProfileStep({
  value,
  onChange,
}: {
  value: ProfileInput;
  onChange: (v: ProfileInput) => void;
}) {
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Age</span>
        <input
          type="number"
          min={18}
          max={100}
          value={value.age}
          onChange={(e) => onChange({ ...value, age: +e.target.value })}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Employment type</span>
        <select
          value={value.employment_type}
          onChange={(e) =>
            onChange({
              ...value,
              employment_type: e.target.value as ProfileInput["employment_type"],
            })
          }
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
        >
          <option value="stable">Stable (regular)</option>
          <option value="contractual">Contractual</option>
          <option value="gig">Gig / freelance</option>
        </select>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={value.ofw_mode}
          onChange={(e) => onChange({ ...value, ofw_mode: e.target.checked })}
        />
        <span className="text-sm">OFW mode (remittance / abroad income)</span>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={value.is_breadwinner}
          onChange={(e) => onChange({ ...value, is_breadwinner: e.target.checked })}
        />
        <span className="text-sm">I am a breadwinner</span>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Number of dependents</span>
        <input
          type="number"
          min={0}
          max={20}
          value={value.number_of_dependents}
          onChange={(e) =>
            onChange({ ...value, number_of_dependents: +e.target.value })
          }
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
        />
      </label>
    </div>
  );
}

function IncomeStep({
  value,
  onChange,
}: {
  value: IncomeInput;
  onChange: (v: IncomeInput) => void;
}) {
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Monthly net income (₱)</span>
        <input
          type="number"
          min={1}
          step={1000}
          value={value.monthly_net_income || ""}
          onChange={(e) =>
            onChange({ ...value, monthly_net_income: +e.target.value || 0 })
          }
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Income variability</span>
        <select
          value={value.income_variability}
          onChange={(e) =>
            onChange({
              ...value,
              income_variability: e.target.value as IncomeInput["income_variability"],
            })
          }
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
        >
          <option value="stable">Stable</option>
          <option value="variable">Variable</option>
          <option value="highly_variable">Highly variable</option>
        </select>
      </label>
    </div>
  );
}

function ExpensesStep({
  value,
  onChange,
}: {
  value: ExpensesInput;
  onChange: (v: ExpensesInput) => void;
}) {
  const fields: (keyof ExpensesInput)[] = [
    "rent",
    "utilities",
    "food",
    "transport",
    "subscriptions",
    "discretionary",
    "dependents_support",
  ];
  const labels: Record<string, string> = {
    rent: "Rent (₱/month)",
    utilities: "Utilities",
    food: "Food & groceries",
    transport: "Transport",
    subscriptions: "Subscriptions",
    discretionary: "Discretionary",
    dependents_support: "Dependents support",
  };
  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <label key={f} className="block">
          <span className="text-sm font-medium text-gray-700">{labels[f]}</span>
          <input
            type="number"
            min={0}
            step={100}
            value={value[f] || ""}
            onChange={(e) => onChange({ ...value, [f]: +e.target.value || 0 })}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>
      ))}
    </div>
  );
}

function DebtStep({
  value,
  onChange,
}: {
  value: DebtInput;
  onChange: (v: DebtInput) => void;
}) {
  const add = () =>
    onChange({
      items: [...value.items, { balance: 0, interest_rate_annual: 0, monthly_payment: 0 }],
    });
  const remove = (i: number) =>
    onChange({ items: value.items.filter((_, j) => j !== i) });
  const updateItem = (i: number, field: keyof DebtItem, val: number) => {
    const next = [...value.items];
    next[i] = { ...next[i], [field]: val };
    onChange({ items: next });
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Add each debt (credit card, loan). Leave empty if none.</p>
      {value.items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded p-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Debt #{i + 1}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-red-600 text-sm"
            >
              Remove
            </button>
          </div>
          <input
            type="number"
            min={0}
            placeholder="Balance (₱)"
            value={item.balance || ""}
            onChange={(e) => updateItem(i, "balance", +e.target.value || 0)}
            className="block w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            placeholder="Interest % per year"
            value={item.interest_rate_annual || ""}
            onChange={(e) =>
              updateItem(i, "interest_rate_annual", +e.target.value || 0)
            }
            className="block w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            min={0}
            placeholder="Monthly payment (₱)"
            value={item.monthly_payment || ""}
            onChange={(e) => updateItem(i, "monthly_payment", +e.target.value || 0)}
            className="block w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-teal-600 text-sm font-medium"
      >
        + Add debt
      </button>
    </div>
  );
}

type DebtItem = { balance: number; interest_rate_annual: number; monthly_payment: number };

function SavingsStep({
  value,
  onChange,
}: {
  value: SavingsInput;
  onChange: (v: SavingsInput) => void;
}) {
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Emergency fund amount (₱)</span>
        <input
          type="number"
          min={0}
          step={1000}
          value={value.emergency_fund_amount || ""}
          onChange={(e) =>
            onChange({ ...value, emergency_fund_amount: +e.target.value || 0 })
          }
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Monthly savings (₱)</span>
        <input
          type="number"
          min={0}
          step={500}
          value={value.monthly_savings || ""}
          onChange={(e) =>
            onChange({ ...value, monthly_savings: +e.target.value || 0 })
          }
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
        />
      </label>
    </div>
  );
}

function InvestingStep({
  value,
  onChange,
}: {
  value: InvestingInput;
  onChange: (v: InvestingInput) => void;
}) {
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Investing status</span>
        <select
          value={value.investing_status}
          onChange={(e) =>
            onChange({
              ...value,
              investing_status: e.target.value as InvestingInput["investing_status"],
            })
          }
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
        >
          <option value="none">Not investing yet</option>
          <option value="exploring">Exploring</option>
          <option value="active">Active</option>
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Risk tolerance</span>
        <select
          value={value.risk_tolerance}
          onChange={(e) =>
            onChange({
              ...value,
              risk_tolerance: e.target.value as InvestingInput["risk_tolerance"],
            })
          }
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>
    </div>
  );
}

const GOAL_TYPES: { value: GoalInput["goal_type"]; label: string }[] = [
  { value: "emergency_fund", label: "Emergency fund" },
  { value: "debt_free", label: "Debt-free" },
  { value: "travel", label: "Travel" },
  { value: "house", label: "House" },
  { value: "tuition", label: "Tuition" },
  { value: "retirement", label: "Retirement" },
  { value: "other", label: "Other" },
];

function GoalsStep({
  value,
  onChange,
}: {
  value: GoalInput[];
  onChange: (v: GoalInput[]) => void;
}) {
  const add = () =>
    onChange([
      ...value,
      { goal_type: "emergency_fund", target_amount: 0, target_years: 5 },
    ]);
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i));
  const updateOne = (i: number, g: GoalInput) => {
    const next = [...value];
    next[i] = g;
    onChange(next);
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Add goals for inflation-adjusted projections.</p>
      {value.map((g, i) => (
        <div key={i} className="border border-gray-200 rounded p-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Goal #{i + 1}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-red-600 text-sm"
            >
              Remove
            </button>
          </div>
          <select
            value={g.goal_type}
            onChange={(e) =>
              updateOne(i, {
                ...g,
                goal_type: e.target.value as GoalInput["goal_type"],
              })
            }
            className="block w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            {GOAL_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            step={1000}
            placeholder="Target amount (₱)"
            value={g.target_amount || ""}
            onChange={(e) =>
              updateOne(i, { ...g, target_amount: +e.target.value || 0 })
            }
            className="block w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            min={0.5}
            step={0.5}
            placeholder="Years to goal"
            value={g.target_years || ""}
            onChange={(e) =>
              updateOne(i, { ...g, target_years: +e.target.value || 0 })
            }
            className="block w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-teal-600 text-sm font-medium"
      >
        + Add goal
      </button>
    </div>
  );
}

function PreferencesStep({
  inflation,
  returnProfile,
  onInflation,
  onReturn,
}: {
  inflation: number;
  returnProfile: string;
  onInflation: (v: number) => void;
  onReturn: (v: AssessmentCreate["expected_return_profile"]) => void;
}) {
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Default inflation rate (%)</span>
        <input
          type="number"
          min={0}
          max={20}
          step={0.5}
          value={inflation}
          onChange={(e) => onInflation(+e.target.value)}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
        />
        <p className="text-xs text-gray-500 mt-1">PH often 3–5%. Used for goal projections.</p>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Expected return profile</span>
        <select
          value={returnProfile}
          onChange={(e) =>
            onReturn(e.target.value as AssessmentCreate["expected_return_profile"])
          }
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
        >
          <option value="conservative">Conservative</option>
          <option value="moderate">Moderate</option>
          <option value="aggressive">Aggressive</option>
        </select>
      </label>
    </div>
  );
}
