import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Philippines Personal Finance | Learn & Assess",
  description: "Learn personal finance and get your financial health score. PH-contextual advice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased">
        <header className="border-b border-gray-200 bg-white/90 backdrop-blur sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-semibold text-gray-900">
              PH Finance
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/learn/what-is-finance" className="text-gray-600 hover:text-gray-900">
                Learn
              </Link>
              <Link href="/assess" className="text-teal-600 hover:text-teal-700 font-medium">
                Get assessed
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200 bg-white py-6 mt-auto">
          <div className="max-w-4xl mx-auto px-4 text-sm text-gray-500">
            <p>
              <strong>Disclaimer:</strong> This site provides educational insights only and is not
              professional financial, tax, or legal advice. Consult a licensed advisor for your situation.
            </p>
            <p className="mt-2">We do not store personally identifying information beyond optional account email if you sign up.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
