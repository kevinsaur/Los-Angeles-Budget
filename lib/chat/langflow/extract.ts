type ParsedChatMessage = {
  text: string;
  sender?: string;
  senderName?: string;
  componentId?: string;
};

function getMessageText(message: Record<string, unknown>): string | null {
  if (typeof message.text === "string" && message.text.trim()) {
    return message.text.trim();
  }

  if (message.data && typeof message.data === "object") {
    const data = message.data as Record<string, unknown>;
    if (typeof data.text === "string" && data.text.trim()) {
      return data.text.trim();
    }
  }

  return null;
}

function collectChatMessages(data: unknown): ParsedChatMessage[] {
  if (!data || typeof data !== "object") return [];

  const record = data as Record<string, unknown>;
  const outerOutputs = record.outputs;
  if (!Array.isArray(outerOutputs)) return [];

  const messages: ParsedChatMessage[] = [];

  for (const outer of outerOutputs) {
    if (!outer || typeof outer !== "object") continue;

    const innerOutputs = (outer as Record<string, unknown>).outputs;
    if (!Array.isArray(innerOutputs)) continue;

    for (const inner of innerOutputs) {
      if (!inner || typeof inner !== "object") continue;
      const innerRecord = inner as Record<string, unknown>;

      const results = innerRecord.results;
      if (results && typeof results === "object") {
        const resultsRecord = results as Record<string, unknown>;

        const message = resultsRecord.message;
        if (message && typeof message === "object") {
          const text = getMessageText(message as Record<string, unknown>);
          if (text) {
            const msg = message as Record<string, unknown>;
            messages.push({
              text,
              sender: typeof msg.sender === "string" ? msg.sender : undefined,
              senderName:
                typeof msg.sender_name === "string" ? msg.sender_name : undefined,
              componentId:
                typeof msg.component_id === "string"
                  ? msg.component_id
                  : undefined,
            });
          }
        }

        const textResult = resultsRecord.text;
        if (textResult && typeof textResult === "object") {
          const textValue = (textResult as Record<string, unknown>).text;
          if (typeof textValue === "string" && textValue.trim()) {
            messages.push({ text: textValue.trim() });
          }
        } else if (typeof textResult === "string" && textResult.trim()) {
          messages.push({ text: textResult.trim() });
        }
      }

      const artifacts = innerRecord.artifacts;
      if (artifacts && typeof artifacts === "object") {
        const artifactMessage = (artifacts as Record<string, unknown>).message;
        if (typeof artifactMessage === "string" && artifactMessage.trim()) {
          messages.push({ text: artifactMessage.trim() });
        }
      }

      const outputMessages = innerRecord.messages;
      if (Array.isArray(outputMessages)) {
        for (const item of outputMessages) {
          if (!item || typeof item !== "object") continue;
          const text = getMessageText(item as Record<string, unknown>);
          if (text) {
            const msg = item as Record<string, unknown>;
            messages.push({
              text,
              sender: typeof msg.sender === "string" ? msg.sender : undefined,
              senderName:
                typeof msg.sender_name === "string" ? msg.sender_name : undefined,
            });
          }
        }
      }
    }
  }

  return messages;
}

function extractMessageTextLegacy(data: unknown): string | null {
  if (typeof data === "string") return data.trim() || null;
  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;

  if (typeof record.text === "string" && record.text.trim()) {
    return record.text.trim();
  }

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message.trim();
  }

  if (record.message && typeof record.message === "object") {
    const nested = extractLangflowText(record.message);
    if (nested) return nested;
  }

  if (record.results && typeof record.results === "object") {
    const nested = extractLangflowText(
      (record.results as Record<string, unknown>).message,
    );
    if (nested) return nested;
  }

  if (Array.isArray(record.outputs)) {
    for (const output of record.outputs) {
      const nested = extractLangflowText(output);
      if (nested) return nested;
    }
  }

  return null;
}

export function extractLangflowText(data: unknown): string | null {
  const messages = collectChatMessages(data);

  if (messages.length > 0) {
    const machineMessages = messages.filter(
      (message) =>
        message.sender === "Machine" ||
        message.senderName === "AI" ||
        message.componentId?.includes("ChatOutput"),
    );

    const preferred = machineMessages.length > 0 ? machineMessages : messages;
    return preferred[preferred.length - 1].text;
  }

  return extractMessageTextLegacy(data);
}

export function matchesPlaygroundFigure(text: string): boolean {
  return /98,700,000|98700000/i.test(text);
}
