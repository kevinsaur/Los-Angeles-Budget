import { STORAGE_KEY } from "./constants";
import type { Conversation } from "./types";

export interface ConversationStore {
  getConversation(): Conversation | null;
  saveConversation(conversation: Conversation): void;
  clearConversation(): void;
  hasActiveConversation(): boolean;
}

const listeners = new Set<() => void>();

let cachedRaw: string | null | undefined;
let cachedSnapshot: Conversation | null = null;

function readConversationFromStorage(): Conversation | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedSnapshot;

    cachedRaw = raw;
    cachedSnapshot = raw ? (JSON.parse(raw) as Conversation) : null;
    return cachedSnapshot;
  } catch {
    cachedRaw = null;
    cachedSnapshot = null;
    return null;
  }
}

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

class LocalConversationStore implements ConversationStore {
  getConversation(): Conversation | null {
    return readConversationFromStorage();
  }

  saveConversation(conversation: Conversation): void {
    if (typeof window === "undefined") return;

    const raw = JSON.stringify(conversation);
    localStorage.setItem(STORAGE_KEY, raw);
    cachedRaw = raw;
    cachedSnapshot = conversation;
    notifyListeners();
  }

  clearConversation(): void {
    if (typeof window === "undefined") return;

    localStorage.removeItem(STORAGE_KEY);
    cachedRaw = null;
    cachedSnapshot = null;
    notifyListeners();
  }

  hasActiveConversation(): boolean {
    const conversation = this.getConversation();
    return (conversation?.messages.length ?? 0) > 0;
  }
}

export const conversationStore: ConversationStore = new LocalConversationStore();

export function subscribeToConversation(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getConversationSnapshot(): Conversation | null {
  return readConversationFromStorage();
}

export function getServerConversationSnapshot(): Conversation | null {
  return null;
}
