import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import topics from "@/content/learn/topics.json";

export default function LearnPage() {
  return (
    <div className="container-narrow py-10">
      <h1 className="text-3xl font-bold text-foreground">Learn</h1>
      <p className="mt-2 text-muted-foreground">
        In-depth guides on personal finance, PH-contextual.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {(topics as { slug: string; title: string }[]).map((t) => (
          <Link key={t.slug} href={`/learn/${t.slug}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">{t.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Read more →
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
