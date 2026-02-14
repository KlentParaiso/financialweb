import { notFound } from "next/navigation";
import Link from "next/link";
import fs from "fs";
import path from "path";

const SLUGS = [
  "what-is-finance",
  "budgeting",
  "debt",
  "emergency-fund",
  "investing-basics",
  "insurance",
  "goals",
];

type Section = { heading: string; body: string };
type LearnContent = { title: string; sections: Section[] };

function getContent(slug: string): LearnContent | null {
  const file = path.join(process.cwd(), "content/learn", `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf-8");
  return JSON.parse(raw) as LearnContent;
}

export async function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug: [slug] }));
}

export default async function LearnPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const pathSlug = slug?.[0] ?? "what-is-finance";
  if (!SLUGS.includes(pathSlug)) notFound();
  const content = getContent(pathSlug);
  if (!content) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/learn/what-is-finance" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
        ← Learn
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{content.title}</h1>
      <div className="prose-custom space-y-6">
        {content.sections.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            <p>{s.body}</p>
          </section>
        ))}
      </div>
      <nav className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap gap-2">
        {SLUGS.map((s) => (
          <Link
            key={s}
            href={`/learn/${s}`}
            className={`text-sm px-3 py-1 rounded-full ${
              s === pathSlug
                ? "bg-teal-100 text-teal-800"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s.replace(/-/g, " ")}
          </Link>
        ))}
      </nav>
    </div>
  );
}
