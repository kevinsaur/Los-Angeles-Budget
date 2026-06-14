import type { ChatProvider } from "./types";
import type { AssistantReply } from "../types";

export const apiChatProvider: ChatProvider = {
  async sendMessage(params): Promise<AssistantReply> {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: params.message,
      }),
    });

    if (!response.ok) {
      throw new Error("Chat API request failed");
    }

    const data: AssistantReply = await response.json();
    return data;
  },
};
