"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "./components/page-shell";
import { ChatInput } from "./components/chat/chat-input";
import { ResumeConversationCta } from "./components/chat/resume-conversation-cta";
import { EXAMPLE_QUESTIONS, PENDING_QUERY_KEY } from "@/lib/chat/constants";

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState<string>(EXAMPLE_QUESTIONS[0]);
  const placeholderIdx = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      placeholderIdx.current =
        (placeholderIdx.current + 1) % EXAMPLE_QUESTIONS.length;
      setPlaceholder(EXAMPLE_QUESTIONS[placeholderIdx.current]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    sessionStorage.setItem(PENDING_QUERY_KEY, trimmed);
    router.push(`/chat?q=${encodeURIComponent(trimmed)}`);
  };

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

        <div className="w-full max-w-2xl">
          <ChatInput
            value={query}
            onChange={setQuery}
            onSubmit={handleSubmit}
            placeholder={placeholder}
            variant="search"
          />
        </div>

        <ResumeConversationCta />

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
