"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageShell } from "../components/page-shell";
import { ChatInput } from "../components/chat/chat-input";
import { ChatThread } from "../components/chat/chat-thread";
import { useConversation } from "@/lib/chat/use-conversation";

export function ChatPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { conversation, isReady, isSending, sendMessage, startOver } =
    useConversation();
  const [input, setInput] = useState("");
  const initialQueryHandled = useRef(false);

  useEffect(() => {
    if (!isReady || initialQueryHandled.current) return;

    const query = searchParams.get("q")?.trim();
    if (!query) return;

    initialQueryHandled.current = true;
    router.replace("/chat");
    sendMessage(query);
  }, [isReady, searchParams, sendMessage, router]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    setInput("");
    sendMessage(trimmed);
  };

  const handleStartOver = () => {
    startOver();
    setInput("");
    router.replace("/chat");
  };

  const messages = conversation?.messages ?? [];
  const hasMessages = messages.length > 0;

  return (
    <PageShell>
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-6">
        <div className="flex items-center justify-between py-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-[-0.02em] text-[#2d1240]">
              Budget <span className="italic text-[#a0497a]">Chat</span>
            </h1>
            <p className="mt-1 text-sm font-light text-[rgba(60,30,80,0.5)]">
              Ask questions about LA city budget
            </p>
          </div>

          {hasMessages ? (
            <button
              type="button"
              onClick={handleStartOver}
              className="cursor-pointer rounded-full border border-white/55 bg-white/35 px-3 py-1.5 text-xs text-[rgba(60,30,80,0.6)] transition-all duration-200 hover:bg-white/55 hover:text-[#2d1240]"
            >
              Start over
            </button>
          ) : null}
        </div>

        <div
          className={`min-h-0 flex-1 overflow-y-auto pb-4${
            hasMessages ? " flex flex-col justify-end" : ""
          }`}
        >
          {hasMessages ? <ChatThread messages={messages} /> : null}
        </div>

        <div className="sticky bottom-0 pt-3 pb-4">
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            placeholder="Ask a follow-up question…"
            disabled={isSending}
          />
        </div>
      </main>
    </PageShell>
  );
}
