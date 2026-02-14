import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import { BackToTop } from "@/components/back-to-top";
import { Lock } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "PesoSense – PH Financial Health Checkup",
  description: "Philippines-first financial analysis: score, goals, debt payoff, and a 90-day action plan.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <ThemeProvider>
          <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
            <div className="container-narrow flex h-14 items-center justify-between">
              <Link href="/" className="font-semibold text-lg text-foreground transition-opacity hover:opacity-80">
                PesoSense
              </Link>
              <nav className="flex items-center gap-1">
                <Link href="/learn" className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-muted">
                  Learn
                </Link>
                <Link href="/assessment" className="rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10">
                  Start checkup
                </Link>
                <ThemeToggle />
              </nav>
            </div>
          </header>
          <main className="flex-1 relative">{children}</main>
          <footer className="border-t border-border bg-muted/30 py-8">
            <div className="container-narrow flex flex-col gap-4 text-sm text-muted-foreground">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="h-4 w-4" />
                  Privacy-first · No data sold
                </span>
                <span>Educational insights only</span>
              </div>
              <div className="flex flex-wrap gap-6">
                <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                <Link href="/disclaimer" className="hover:text-foreground transition-colors">Disclaimer</Link>
              </div>
              <p>
                PesoSense is for education only. Not financial, tax, or legal advice. Consult a licensed advisor for your situation.
              </p>
            </div>
          </footer>
          <BackToTop />
        </ThemeProvider>
      </body>
    </html>
  );
}
