export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-gray-500">
            LA Budget
          </p>

          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
            Make living in Los Angeles a little more manageable.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            LA Budget is a simple guide for finding better deals, smarter local
            choices, and practical ways to stretch your money in Los Angeles.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href="#start"
              className="rounded-full bg-gray-900 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-gray-700"
            >
              Start exploring
            </a>

            <a
              href="#about"
              className="rounded-full border border-gray-300 px-6 py-3 text-center text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Learn more
            </a>
          </div>
        </div>

        <div id="start" className="mt-20 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold">Local deals</h2>
            <p className="mt-3 text-gray-600">
              Find budget-friendly restaurants, activities, services, and local
              options around LA.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold">Smarter planning</h2>
            <p className="mt-3 text-gray-600">
              Compare options before you spend, whether you are planning a date,
              weekend, errand, or night out.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold">Practical savings</h2>
            <p className="mt-3 text-gray-600">
              Focus on realistic ways to save money without making life feel
              cheap or boring.
            </p>
          </div>
        </div>

        <div
          id="about"
          className="mt-20 rounded-3xl bg-gray-50 p-8 sm:p-10"
        >
          <h2 className="text-3xl font-bold">Built for real LA life.</h2>
          <p className="mt-4 max-w-3xl text-gray-600">
            Los Angeles can be expensive, spread out, and hard to navigate.
            LA Budget helps people make better everyday decisions by surfacing
            practical, local, budget-aware recommendations.
          </p>
        </div>

        <footer className="mt-20 border-t border-gray-200 pt-8 text-sm text-gray-500">
          © 2026 LA Budget. All rights reserved.
        </footer>
      </section>
    </main>
  );
} 
