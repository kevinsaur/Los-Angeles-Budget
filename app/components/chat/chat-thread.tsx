"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/lib/chat/types";
import { ChatMessage } from "./chat-message";

type ChatThreadProps = {
  messages: Message[];
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
};

export function ChatThread({ messages, scrollContainerRef }: ChatThreadProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const lastMessage = messages.at(-1);
  const scrollKey = `${messages.length}:${lastMessage?.id ?? ""}:${lastMessage?.status ?? ""}`;

  useEffect(() => {
    const container = scrollContainerRef.current;
    const content = contentRef.current;
    if (!container || !content || messages.length === 0) return;

    const scrollToBottom = () => {
      container.scrollTop = container.scrollHeight;
    };

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => requestAnimationFrame(scrollToBottom));
    });

    observer.observe(content);
    requestAnimationFrame(() => requestAnimationFrame(scrollToBottom));

    return () => observer.disconnect();
    // scrollKey encodes count, last id, and status; scrollContainerRef is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollKey]);

  return (
    <div ref={contentRef} className="space-y-6">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
    </div>
  );
}
