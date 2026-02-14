import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Philippines-first personal finance
      </h1>
      <p className="text-gray-600 mb-8">
        Learn the basics, take a short assessment, and get a financial health score plus
        inflation-adjusted goal projections—tailored to breadwinners and OFWs.
      </p>
      <div className="flex flex-wrap gap-4">
        <Link
          href="/assess"
          className="inline-flex items-center justify-center rounded-lg bg-teal-600 text-white px-6 py-3 font-medium hover:bg-teal-700"
        >
          Start assessment
        </Link>
        <Link
          href="/learn/what-is-finance"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
        >
          Browse learn
        </Link>
      </div>
      <section className="mt-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Learn</h2>
        <ul className="grid gap-2 text-gray-600">
          <li><Link href="/learn/what-is-finance" className="hover:text-teal-600">What is finance?</Link></li>
          <li><Link href="/learn/budgeting" className="hover:text-teal-600">Budgeting</Link></li>
          <li><Link href="/learn/debt" className="hover:text-teal-600">Debt</Link></li>
          <li><Link href="/learn/emergency-fund" className="hover:text-teal-600">Emergency fund</Link></li>
          <li><Link href="/learn/investing-basics" className="hover:text-teal-600">Investing basics</Link></li>
          <li><Link href="/learn/insurance" className="hover:text-teal-600">Insurance</Link></li>
          <li><Link href="/learn/goals" className="hover:text-teal-600">Goals</Link></li>
        </ul>
      </section>
    </div>
  );
}
