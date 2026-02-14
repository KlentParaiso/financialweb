import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "PesoSense – PH Financial Health Checkup",
  description: "Philippines-first financial analysis: score, goals, debt payoff, and a 90-day action plan.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--background))]/80">
          <div className="container-narrow flex h-14 items-center justify-between">
            <Link href="/" className="font-semibold text-lg text-[hsl(var(--foreground))]">
              PesoSense
            </Link>
            <nav className="flex items-center gap-6 text-sm text-[hsl(var(--muted-foreground))]">
              <Link href="/learn" className="hover:text-[hsl(var(--foreground))]">
                Learn
              </Link>
              <Link href="/assessment" className="font-medium text-[hsl(var(--primary))] hover:underline">
                Start checkup
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 py-8">
          <div className="container-narrow flex flex-col gap-4 text-sm text-[hsl(var(--muted-foreground))]">
            <div className="flex flex-wrap gap-6">
              <Link href="/privacy" className="hover:text-[hsl(var(--foreground))]">Privacy</Link>
              <Link href="/disclaimer" className="hover:text-[hsl(var(--foreground))]">Disclaimer</Link>
            </div>
            <p>
              PesoSense is for education only. Not financial, tax, or legal advice. Consult a licensed advisor for your situation.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
