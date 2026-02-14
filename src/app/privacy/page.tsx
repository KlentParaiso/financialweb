import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="container-narrow py-10">
      <Link href="/" className="text-sm text-[hsl(var(--primary))] hover:underline">← Home</Link>
      <h1 className="mt-6 text-2xl font-bold text-[hsl(var(--foreground))]">Privacy</h1>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">What we store</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-[hsl(var(--muted-foreground))]">
          <p>We store only the financial data you enter in the assessment (income, expenses, debt, savings, goals) and the computed results. We do not store your name, email address, phone number, or physical address.</p>
          <p>Your results are linked to a random share token. Anyone with that link can view the results. Do not share the link if you do not want others to see your data.</p>
          <p>We do not sell your data. We use it only to provide your financial health analysis and to improve the product.</p>
        </CardContent>
      </Card>
    </div>
  );
}
