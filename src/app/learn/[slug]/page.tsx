import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { learnContent } from "@/content/learn/articles";
import topics from "@/content/learn/topics.json";

export async function generateStaticParams() {
  return (topics as { slug: string }[]).map((t) => ({ slug: t.slug }));
}

function isSectionHeading(para: string): boolean {
  const line = para.trim();
  if (line.length > 85 || line.includes("\n")) return false;
  if (line.endsWith(".")) return false;
  return line.split(" ").length <= 15;
}

export default function LearnSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const article = learnContent[slug];
  if (!article) notFound();

  const paragraphs = article.content.trim().split(/\n\n+/);

  return (
    <div className="container-narrow py-8 sm:py-10">
      <Link href="/learn" className="text-sm text-primary hover:underline">
        ← Learn
      </Link>
      <article className="mt-6 max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {article.title}
        </h1>
        <Card className="mt-6 border-border bg-card/50">
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-6 text-base leading-relaxed text-muted-foreground sm:text-[17px]">
              {paragraphs.map((para, i) => {
                const trimmed = para.trim();
                if (isSectionHeading(trimmed)) {
                  return (
                    <h2
                      key={i}
                      className="pt-2 font-semibold tracking-tight text-foreground first:pt-0 sm:text-lg"
                    >
                      {trimmed}
                    </h2>
                  );
                }
                return (
                  <p
                    key={i}
                    className={i === 0 ? "text-foreground/90 text-lg leading-relaxed" : ""}
                  >
                    {trimmed}
                  </p>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </article>
    </div>
  );
}
