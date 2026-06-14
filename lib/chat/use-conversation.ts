"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import {
  appendMessage,
  clearConversation as clearStoredConversation,
  createMessageId,
  getOrCreateConversation,
  updateMessage,
} from "./conversation";
import {
  conversationStore,
  getConversationSnapshot,
  getServerConversationSnapshot,
  subscribeToConversation,
} from "./storage";
import { chatProvider } from "./providers";
import type { Message } from "./types";

function createUserMessage(content: string): Message {
  return {
    id: createMessageId(),
    role: "user",
    content,
    createdAt: new Date().toISOString(),
    status: "complete",
  };
}

function createThinkingMessage(): Message {
  return {
    id: createMessageId(),
    role: "assistant",
    content: "",
    createdAt: new Date().toISOString(),
    status: "thinking",
  };
}

const isClientStore = {
  subscribe: () => () => {},
  getSnapshot: () => true,
  getServerSnapshot: () => false,
};

export function useConversation() {
  const conversation = useSyncExternalStore(
    subscribeToConversation,
    getConversationSnapshot,
    getServerConversationSnapshot,
  );
  const isReady = useSyncExternalStore(
    isClientStore.subscribe,
    isClientStore.getSnapshot,
    isClientStore.getServerSnapshot,
  );
  const [isSending, setIsSending] = useState(false);
  const sendQueueRef = useRef<Promise<void>>(Promise.resolve());

  const sendMessage = useCallback((content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    let current = getOrCreateConversation();
    const userMessage = createUserMessage(trimmed);
    current = appendMessage(current, userMessage);

    const thinkingMessage = createThinkingMessage();
    current = appendMessage(current, thinkingMessage);
    conversationStore.saveConversation(current);

    sendQueueRef.current = sendQueueRef.current.then(async () => {
      setIsSending(true);

      current = conversationStore.getConversation() ?? current;

      try {
        const history = current.messages.filter(
          (message) =>
            message.id !== thinkingMessage.id && message.status === "complete",
        );

        const reply = await chatProvider.sendMessage({
          conversationId: current.id,
          message: trimmed,
          history,
          langflowSessionId: current.langflowSessionId,
        });

        current = updateMessage(current, thinkingMessage.id, {
          content: reply.content,
          citations: reply.citations,
          status: "complete",
        });

        if (reply.langflowSessionId) {
          current = { ...current, langflowSessionId: reply.langflowSessionId };
        }
      } catch {
        current = updateMessage(current, thinkingMessage.id, {
          content:
            "Something went wrong while fetching an answer. Please try again.",
          status: "error",
        });
      }

      conversationStore.saveConversation(current);
      setIsSending(false);
    });
  }, []);

  const startOver = useCallback(() => {
    clearStoredConversation();
  }, []);

  return {
    conversation,
    isReady,
    isSending,
    sendMessage,
    startOver,
  };
}
