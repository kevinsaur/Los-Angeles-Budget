"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  getLastUserMessage,
  getMessageCount,
  hasActiveConversation,
} from "@/lib/chat/conversation";

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

const clientStore = {
  subscribe: () => () => {},
  getSnapshot: () => true,
  getServerSnapshot: () => false,
};

export function ResumeConversationCta() {
  const isClient = useSyncExternalStore(
    clientStore.subscribe,
    clientStore.getSnapshot,
    clientStore.getServerSnapshot,
  );

  if (!isClient || !hasActiveConversation()) return null;

  const lastQuestion = getLastUserMessage();
  const messageCount = getMessageCount();
  const subtitle = lastQuestion
    ? `Last asked: "${truncate(lastQuestion, 60)}"`
    : `${messageCount} message${messageCount === 1 ? "" : "s"} in your conversation`;

  return (
    <Link
      href="/chat"
      className="group mt-4 flex w-full max-w-2xl items-center justify-between rounded-2xl border border-white/65 bg-white/45 px-5 py-4 text-left shadow-[0_8px_40px_rgba(100,40,120,0.08),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl transition-all duration-200 hover:bg-white/55"
    >
      <div>
        <p className="text-sm font-medium text-[#2d1240]">
          Continue your conversation
        </p>
        <p className="mt-1 text-xs font-light text-[rgba(60,30,80,0.5)]">
          {subtitle}
        </p>
      </div>
      <svg
        aria-hidden="true"
        className="size-4 shrink-0 text-[rgba(60,30,80,0.35)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#a0497a]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          d="M5 12h14M13 6l6 6-6 6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
