"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/lib/chat/types";
import { ChatMessage } from "./chat-message";

type ChatThreadProps = {
  messages: Message[];
};

export function ChatThread({ messages }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="space-y-6">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
