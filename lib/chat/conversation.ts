import { conversationStore } from "./storage";
import type { Conversation, Message } from "./types";

export function createConversationId(): string {
  return crypto.randomUUID();
}

export function createMessageId(): string {
  return crypto.randomUUID();
}

export function getOrCreateConversation(): Conversation {
  const existing = conversationStore.getConversation();
  if (existing) return existing;

  const now = new Date().toISOString();
  return {
    id: createConversationId(),
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function hasActiveConversation(): boolean {
  return conversationStore.hasActiveConversation();
}

export function getLastUserMessage(): string | null {
  const conversation = conversationStore.getConversation();
  if (!conversation) return null;

  const lastUserMessage = [...conversation.messages]
    .reverse()
    .find((message) => message.role === "user");

  return lastUserMessage?.content ?? null;
}

export function getMessageCount(): number {
  return conversationStore.getConversation()?.messages.length ?? 0;
}

export function appendMessage(
  conversation: Conversation,
  message: Message,
): Conversation {
  return {
    ...conversation,
    messages: [...conversation.messages, message],
    updatedAt: new Date().toISOString(),
  };
}

export function updateMessage(
  conversation: Conversation,
  messageId: string,
  updates: Partial<Message>,
): Conversation {
  return {
    ...conversation,
    messages: conversation.messages.map((message) =>
      message.id === messageId ? { ...message, ...updates } : message,
    ),
    updatedAt: new Date().toISOString(),
  };
}

export function clearConversation(): void {
  conversationStore.clearConversation();
}

export function persistConversation(conversation: Conversation): void {
  conversationStore.saveConversation(conversation);
}