"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, BarChart3, Target, FileText, CircleDot } from "lucide-react";

export default function HomePage() {
  return (
    <div className="grain">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-muted/80 via-background to-primary/5 dark:from-muted/40 dark:to-primary/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(var(--primary)/0.08),transparent)]" />
        <div className="absolute top-20 left-[10%] h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-20 right-[15%] h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="container-narrow relative flex flex-col gap-10 py-16 sm:py-20 lg:flex-row lg:items-center lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1"
          >
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Your PH financial health, in one checkup
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              Get an explainable score, inflation-adjusted goals, debt payoff strategies, and a personalized 90-day action plan. Privacy-first, no sign-up.
            </p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-8"
            >
              <Link href="/assessment">
                <Button size="lg" className="shadow-md">Start free checkup</Button>
              </Link>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="hidden lg:block flex-shrink-0"
          >
            <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-lg backdrop-blur-sm w-72">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your snapshot</p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">72</span>
                <span className="text-muted-foreground">/ 100</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Grade B · Good foundation</p>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-3/4 rounded-full bg-primary" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Savings rate · Emergency fund · DTI</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-b border-border bg-muted/20 py-6">
        <div className="container-narrow flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Educational insights only
          </span>
          <span className="inline-flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Privacy-first design
          </span>
          <span>No data sold</span>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20">
        <div className="container-narrow">
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl font-semibold text-foreground sm:text-3xl"
          >
            What you get
          </motion.h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { title: "Financial Health Score", desc: "0–100 score with grade and per-dimension breakdown. Understand where you stand.", icon: BarChart3 },
              { title: "Goals & debt payoff", desc: "Inflation-adjusted targets and Avalanche vs Snowball comparison so you can plan.", icon: Target },
              { title: "90-day action plan", desc: "This week, this month, next 3 months—with concrete numeric targets.", icon: CircleDot },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full transition-shadow duration-200 hover:shadow-md">
                  <CardHeader>
                    <item.icon className="h-8 w-8 text-primary" />
                    <CardTitle className="text-base">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {item.desc}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-muted/20 py-16 sm:py-20">
        <div className="container-narrow">
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl font-semibold text-foreground sm:text-3xl"
          >
            How it works
          </motion.h2>
          <ol className="mt-10 grid gap-10 sm:grid-cols-3">
            {[
              { step: 1, title: "Answer a short form", desc: "Income, expenses, debt, savings, goals. No name or email." },
              { step: 2, title: "Get your analysis", desc: "Score, charts, debt comparison, and action plan in one dashboard." },
              { step: 3, title: "Save or share the link", desc: "Bookmark your result or share it with someone you trust." },
            ].map((item, i) => (
              <motion.li
                key={item.step}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-medium text-primary-foreground">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-medium text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20">
        <div className="container-narrow">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">FAQ</h2>
          <dl className="mt-10 space-y-8">
            {[
              { q: "Is my data private?", a: "Yes. We don't store name, email, or address. Only your answers and the computed results, linked to a random share link." },
              { q: "Is this financial advice?", a: "No. PesoSense is for education only. For advice tailored to you, consult a licensed financial advisor." },
              { q: "Why Philippines-first?", a: "We use PH context like breadwinner and dependents for emergency fund targets, and peso-based examples." },
            ].map((item) => (
              <div key={item.q}>
                <dt className="font-medium text-foreground">{item.q}</dt>
                <dd className="mt-2 text-muted-foreground">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-16 sm:py-20">
        <div className="container-narrow text-center">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Ready to check your financial health?
          </h2>
          <p className="mt-3 text-muted-foreground">Takes about 5 minutes. No sign-up.</p>
          <Link href="/assessment">
            <Button size="lg" className="mt-6 shadow-md">Start checkup</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
