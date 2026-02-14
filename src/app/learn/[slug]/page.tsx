import Link from "next/link";
import { notFound } from "next/navigation";
import learnContent from "@/content/learn/learn-content.json";
import topics from "@/content/learn/topics.json";

const contentMap = learnContent as Record<string, { title: string; content: string }>;

export async function generateStaticParams() {
  return (topics as { slug: string }[]).map((t) => ({ slug: t.slug }));
}

export default function LearnSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const article = contentMap[slug];
  if (!article) notFound();

  return (
    <div className="container-narrow py-10">
      <Link href="/learn" className="text-sm text-[hsl(var(--primary))] hover:underline">
        ← Learn
      </Link>
      <article className="mt-6">
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">{article.title}</h1>
        <div className="mt-4 whitespace-pre-line text-[hsl(var(--muted-foreground))]">
          {article.content}
        </div>
      </article>
    </div>
  );
}
