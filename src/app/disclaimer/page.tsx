import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DisclaimerPage() {
  return (
    <div className="container-narrow py-10">
      <Link href="/" className="text-sm text-[hsl(var(--primary))] hover:underline">← Home</Link>
      <h1 className="mt-6 text-2xl font-bold text-[hsl(var(--foreground))]">Disclaimer</h1>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Educational use only</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-[hsl(var(--muted-foreground))]">
          <p>PesoSense is for educational and informational purposes only. It is not professional financial, tax, or legal advice.</p>
          <p>Your financial situation is unique. For advice tailored to you, consult a licensed financial advisor, accountant, or lawyer in the Philippines.</p>
          <p>We do not guarantee the accuracy of calculations or the suitability of any recommendation for your circumstances. Use the tool as a starting point for reflection and planning, not as a substitute for professional advice.</p>
        </CardContent>
      </Card>
    </div>
  );
}
