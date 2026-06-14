export type MessageRole = "user" | "assistant";

export type MessageStatus = "complete" | "thinking" | "error";

export type Citation = {
  title: string;
  source?: string;
  url?: string;
};

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  citations?: Citation[];
  createdAt: string;
  status: MessageStatus;
};

export type Conversation = {
  id: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  langflowSessionId?: string;
};

export type AssistantReply = {
  content: string;
  citations?: Citation[];
  langflowSessionId?: string;
};
