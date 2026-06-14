import type { AssistantReply, Message } from "../types";

export type SendMessageParams = {
  conversationId: string;
  message: string;
  history: Message[];
  langflowSessionId?: string;
};

export interface ChatProvider {
  sendMessage(params: SendMessageParams): Promise<AssistantReply>;
}
