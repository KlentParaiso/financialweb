"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { getAssessment, type AssessmentResponse, type AnalysisOutput } from "@/lib/api";

const COLORS = ["#0d9488", "#64748b", "#f59e0b", "#10b981", "#6366f1", "#ec4899", "#8b5cf6"];

export default function ResultsPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";
  const [data, setData] = useState<AssessmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getAssessment(id)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-12 text-center">Loading…</div>;
  if (error) return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-red-600">{error}</div>;
  if (!data) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
        ← Home
      </Link>
      <p className="text-xs text-gray-500 mb-2">
        Save this link to return to your results: {id ? `/results/${id}` : ""}
      </p>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Your financial health</h1>
      <ScoreSummary analysis={data.analysis} />

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Score breakdown</h2>
        <ScoreBarChart dimensions={data.analysis.dimension_scores} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Spending breakdown</h2>
        <SpendingPie spending={data.analysis.spending_breakdown} />
      </section>

      {data.analysis.recommendations.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h2>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            {data.analysis.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </section>
      )}

      {data.analysis.dimension_scores.map((d) => (
        <div key={d.name} className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900">{d.name}</p>
          <p className="text-sm text-gray-600">{d.tip}</p>
        </div>
      ))}

      {data.analysis.goal_projections.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Goal projections (inflation-adjusted)</h2>
          {data.analysis.goal_projections.map((gp, idx) => (
            <GoalProjectionSection key={idx} projection={gp} />
          ))}
        </section>
      )}

      <p className="mt-8 text-sm text-gray-500">
        This is educational only and not professional advice. Consult a licensed advisor for your situation.
      </p>
    </div>
  );
}

function ScoreSummary({ analysis }: { analysis: AnalysisOutput }) {
  const gradeColors: Record<string, string> = {
    A: "text-green-600",
    B: "text-teal-600",
    C: "text-yellow-600",
    D: "text-orange-600",
    F: "text-red-600",
  };
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-baseline gap-4 flex-wrap">
        <span className="text-4xl font-bold text-gray-900">
          {analysis.financial_health_score.toFixed(0)}
        </span>
        <span className={`text-2xl font-semibold ${gradeColors[analysis.grade] ?? "text-gray-600"}`}>
          Grade {analysis.grade}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Savings rate</p>
          <p className="font-medium">{analysis.savings_rate.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-gray-500">Debt-to-income</p>
          <p className="font-medium">{analysis.debt_to_income_ratio.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-gray-500">Emergency fund</p>
          <p className="font-medium">{analysis.emergency_fund_months.toFixed(1)} months</p>
        </div>
        <div>
          <p className="text-gray-500">Monthly expenses</p>
          <p className="font-medium">₱{analysis.total_monthly_expenses.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function ScoreBarChart({ dimensions }: { dimensions: AnalysisOutput["dimension_scores"] }) {
  const data = dimensions.map((d) => ({
    name: d.name,
    score: d.score,
    weighted: d.weighted_score,
  }));
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
          <XAxis type="number" domain={[0, 100]} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="score" fill="#0d9488" name="Score (0-100)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SpendingPie({ spending }: { spending: Record<string, number> }) {
  const data = Object.entries(spending).map(([name, value]) => ({ name, value }));
  if (data.length === 0) return <p className="text-gray-500 text-sm">No spending data.</p>;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, value }) => `${name}: ₱${value.toLocaleString()}`}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => `₱${v.toLocaleString()}`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function GoalProjectionSection({
  projection,
}: {
  projection: AnalysisOutput["goal_projections"][0];
}) {
  const labels: Record<string, string> = {
    emergency_fund: "Emergency fund",
    debt_free: "Debt-free",
    travel: "Travel",
    house: "House",
    tuition: "Tuition",
    retirement: "Retirement",
    other: "Other",
  };
  const goalLabel = labels[projection.goal_type] ?? projection.goal_type;
  const lineData = projection.scenarios.map((s) => ({
    scenario: s.label,
    monthly: s.monthly_contribution,
    futureValue: s.future_value,
    target: projection.inflation_adjusted_target,
  }));
  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-4">
      <h3 className="font-medium text-gray-900">{goalLabel}</h3>
      <p className="text-sm text-gray-500">
        Target today: ₱{projection.target_amount_today.toLocaleString()} · In{" "}
        {projection.target_years} years with {projection.inflation_rate}% inflation: ₱
        {projection.inflation_adjusted_target.toLocaleString()}
      </p>
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Scenario</th>
              <th className="text-right py-2">Monthly (₱)</th>
              <th className="text-right py-2">Total contrib.</th>
              <th className="text-right py-2">FV</th>
              <th className="text-right py-2">Shortfall/Surplus</th>
            </tr>
          </thead>
          <tbody>
            {projection.scenarios.map((s, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2">{s.label}</td>
                <td className="text-right">{s.monthly_contribution.toLocaleString()}</td>
                <td className="text-right">{s.total_contribution.toLocaleString()}</td>
                <td className="text-right">{s.future_value.toLocaleString()}</td>
                <td className="text-right">
                  {s.shortfall_or_surplus >= 0 ? "+" : ""}
                  {s.shortfall_or_surplus.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="h-48 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={projection.scenarios} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => v.toLocaleString()} />
            <Bar dataKey="monthly_contribution" fill="#0d9488" name="Monthly (₱)" />
            <Bar dataKey="future_value" fill="#64748b" name="Future value" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
