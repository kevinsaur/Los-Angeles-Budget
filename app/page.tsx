"use client";

import { useEffect, useRef, useState } from "react";
import { PageShell } from "./components/page-shell";

const EXAMPLE_QUESTIONS = [
  "How much does LA spend on homelessness services?",
  "What is the LAPD budget for fiscal year 2024–25?",
  "How has the parks and recreation budget changed over the last five years?",
  "What percentage of the budget goes to public works infrastructure?",
  "How much funding does the city allocate to affordable housing programs?",
];

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="mt-0.5 size-[18px] shrink-0 text-[rgba(60,30,80,0.35)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function ArrowRightIcon({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`size-4 ${active ? "text-white" : "text-[rgba(60,30,80,0.25)]"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function resizeTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState(EXAMPLE_QUESTIONS[0]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const placeholderIdx = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      placeholderIdx.current =
        (placeholderIdx.current + 1) % EXAMPLE_QUESTIONS.length;
      setPlaceholder(EXAMPLE_QUESTIONS[placeholderIdx.current]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    resizeTextarea(textareaRef.current);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
  };

  const hasQuery = query.trim().length > 0;

  return (
    <PageShell>
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-12 pb-20 text-center md:pt-24 md:pb-24">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/35 px-4 py-1.5 text-xs uppercase tracking-[0.15em] text-[rgba(60,30,80,0.75)] backdrop-blur-sm">
          <span className="size-1.5 rounded-full bg-[#c97ab0]" />
          Updated to FY 2026–27
        </div>

        <h1 className="mb-6 max-w-3xl font-serif text-[clamp(2.8rem,7vw,6rem)] leading-[1.05] font-semibold tracking-[-0.02em] text-[#2d1240]">
          Understand How{" "}
          <span className="italic text-[#a0497a]">Los Angeles</span> Spends Your
          Money
        </h1>

        <p className="mb-14 max-w-xl text-[clamp(1rem,2vw,1.2rem)] leading-[1.7] font-light text-[rgba(60,30,80,0.6)]">
          Ask any question about the LA city budget and get an instant, sourced
          answer powered by AI, directly from official budget documents.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-2xl">
          <div className="relative rounded-2xl border border-white/65 bg-white/45 shadow-[0_8px_40px_rgba(100,40,120,0.1),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl transition-shadow duration-300">
            <div className="flex items-start gap-3 p-4 pl-5">
              <SearchIcon />
              <textarea
                ref={textareaRef}
                rows={1}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as unknown as React.FormEvent);
                  }
                }}
                placeholder={placeholder}
                className="max-h-48 min-h-[1.6rem] flex-1 resize-none bg-transparent text-base leading-[1.6] font-light text-[#2d1240] caret-[#a0497a] outline-none placeholder:text-[rgba(60,30,80,0.35)]"
              />
              <button
                type="submit"
                disabled={!hasQuery}
                className={`flex size-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                  hasQuery
                    ? "cursor-pointer bg-[linear-gradient(135deg,#c97ab0,#e8a07a)]"
                    : "cursor-default bg-[rgba(60,30,80,0.08)]"
                }`}
              >
                <ArrowRightIcon active={hasQuery} />
              </button>
            </div>

            <div className="px-5 pb-3 text-xs text-[rgba(60,30,80,0.35)]">
              Press Enter to search · Shift+Enter for new line
            </div>
          </div>
        </form>

        <div className="mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
          {EXAMPLE_QUESTIONS.slice(0, 3).map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => setQuery(question)}
              className="cursor-pointer rounded-full border border-white/55 bg-white/35 px-3 py-1.5 text-xs text-[rgba(60,30,80,0.6)] transition-all duration-200 hover:bg-white/55 hover:text-[#2d1240]"
            >
              {question}
            </button>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
