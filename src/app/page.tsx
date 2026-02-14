import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[hsl(var(--border))] bg-gradient-to-b from-[hsl(var(--muted))] to-[hsl(var(--background))] py-18 sm:py-22">
        <div className="container-narrow relative py-12 sm:py-16">
          <h1 className="text-4xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-5xl">
            Your PH financial health, in one checkup
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[hsl(var(--muted-foreground))]">
            Get an explainable score, inflation-adjusted goals, debt payoff strategies, and a personalized 90-day action plan. Privacy-first, no sign-up.
          </p>
          <div className="mt-8">
            <Link href="/assessment">
              <Button size="lg">Start free checkup</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container-narrow">
          <h2 className="text-2xl font-semibold text-[hsl(var(--foreground))]">What you get</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Financial Health Score</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[hsl(var(--muted-foreground))]">
                0–100 score with grade and per-dimension breakdown. Understand where you stand.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Goals & debt payoff</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[hsl(var(--muted-foreground))]">
                Inflation-adjusted targets and Avalanche vs Snowball comparison so you can plan.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">90-day action plan</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[hsl(var(--muted-foreground))]">
                This week, this month, next 3 months—with concrete numeric targets.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 py-16">
        <div className="container-narrow">
          <h2 className="text-2xl font-semibold text-[hsl(var(--foreground))]">How it works</h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3">
            <li className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-sm font-medium text-white">1</span>
              <div>
                <h3 className="font-medium">Answer a short form</h3>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Income, expenses, debt, savings, goals. No name or email.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-sm font-medium text-white">2</span>
              <div>
                <h3 className="font-medium">Get your analysis</h3>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Score, charts, debt comparison, and action plan in one dashboard.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-sm font-medium text-white">3</span>
              <div>
                <h3 className="font-medium">Save or share the link</h3>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Bookmark your result or share it with someone you trust.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container-narrow">
          <h2 className="text-2xl font-semibold text-[hsl(var(--foreground))]">FAQ</h2>
          <dl className="mt-8 space-y-6">
            <div>
              <dt className="font-medium text-[hsl(var(--foreground))]">Is my data private?</dt>
              <dd className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Yes. We don’t store name, email, or address. Only your answers and the computed results, linked to a random share link.</dd>
            </div>
            <div>
              <dt className="font-medium text-[hsl(var(--foreground))]">Is this financial advice?</dt>
              <dd className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">No. PesoSense is for education only. For advice tailored to you, consult a licensed financial advisor.</dd>
            </div>
            <div>
              <dt className="font-medium text-[hsl(var(--foreground))]">Why Philippines-first?</dt>
              <dd className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">We use PH context like breadwinner and dependents for emergency fund targets, and peso-based examples.</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[hsl(var(--border))] py-16">
        <div className="container-narrow text-center">
          <h2 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Ready to check your financial health?</h2>
          <p className="mt-2 text-[hsl(var(--muted-foreground))]">Takes about 5 minutes. No sign-up.</p>
          <Link href="/assessment">
            <Button size="lg" className="mt-6">Start checkup</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
