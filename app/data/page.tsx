import type { Metadata } from "next";
import { PageShell } from "../components/page-shell";

export const metadata: Metadata = {
  title: "Data · LA Budget Explorer",
  description:
    "Explore the official LA city budget documents and datasets that power LA Budget Explorer.",
};

const DATASETS = [
  {
    title: "Adopted Budget",
    description:
      "The full city budget as adopted by the Los Angeles City Council, including departmental allocations and line-item detail.",
    period: "FY 2026–27",
  },
  {
    title: "Mayor's Proposed Budget",
    description:
      "The executive proposal submitted before council adoption, showing recommended spending priorities and changes.",
    period: "FY 2026–27",
  },
  {
    title: "Five-Year Budget Outlook",
    description:
      "Projected revenue and expenditure trends across multiple fiscal years for long-range planning analysis.",
    period: "FY 2026–31",
  },
  {
    title: "Department Budget Summaries",
    description:
      "High-level breakdowns by city department — including LAPD, Public Works, Housing, Recreation & Parks, and more.",
    period: "FY 2024–27",
  },
];

const COVERAGE = [
  "General Fund & special fund revenues",
  "Personnel, contracts, and capital projects",
  "Homelessness & housing programs",
  "Public safety & emergency services",
  "Infrastructure & transportation",
];

export default function DataPage() {
  return (
    <PageShell>
      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-6 py-16 md:py-24">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/35 px-4 py-1.5 text-xs uppercase tracking-[0.15em] text-[rgba(60,30,80,0.75)] backdrop-blur-sm">
          <span className="size-1.5 rounded-full bg-[#c97ab0]" />
          Official sources
        </div>

        <h1 className="mb-6 font-serif text-[clamp(2.2rem,5vw,3.5rem)] leading-[1.1] font-semibold tracking-[-0.02em] text-[#2d1240]">
          Budget <span className="italic text-[#a0497a]">Data</span>
        </h1>

        <p className="mb-12 max-w-2xl text-lg leading-[1.7] font-light text-[rgba(60,30,80,0.6)]">
          Every answer on LA Budget Explorer is grounded in publicly available
          documents from the City of Los Angeles Office of the City Administrative
          Officer (CAO).
        </p>

        <div className="mb-12 space-y-4">
          {DATASETS.map((dataset) => (
            <div
              key={dataset.title}
              className="rounded-2xl border border-white/65 bg-white/45 p-6 shadow-[0_8px_40px_rgba(100,40,120,0.08),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl"
            >
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-medium text-[#2d1240]">
                  {dataset.title}
                </h2>
                <span className="text-xs uppercase tracking-[0.12em] text-[rgba(60,30,80,0.45)]">
                  {dataset.period}
                </span>
              </div>
              <p className="text-sm leading-relaxed font-light text-[rgba(60,30,80,0.6)]">
                {dataset.description}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/65 bg-white/45 p-6 shadow-[0_8px_40px_rgba(100,40,120,0.08),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl">
          <h2 className="mb-4 text-lg font-medium text-[#2d1240]">
            What you can ask about
          </h2>
          <ul className="space-y-2">
            {COVERAGE.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm font-light text-[rgba(60,30,80,0.6)]"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#c97ab0]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </PageShell>
  );
}
