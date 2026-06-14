import type { Citation, RagStatus } from "../types";
import { getLangflowConfigDiagnostics } from "./config";

export type LangflowChatRequest = {
  message: string;
};

export type LangflowChatResult = {
  content: string;
  sessionId: string;
  citations?: Citation[];
  ragStatus: RagStatus;
};

function getLangflowConfig() {
  const diagnostics = getLangflowConfigDiagnostics();

  if (diagnostics.configurationIssue) {
    throw new Error(diagnostics.configurationIssue);
  }

  const apiKey = process.env.LANGFLOW_API_KEY?.trim();
  const baseUrl =
    process.env.LANGFLOW_URL?.trim() ||
    process.env.LANGFLOW_SERVER_URL?.trim();
  const flowId = process.env.LANGFLOW_FLOW_ID?.trim();
  let apiUrl = process.env.LANGFLOW_API_URL?.trim();

  if (!apiUrl && baseUrl && flowId) {
    apiUrl = `${baseUrl.replace(/\/$/, "")}/api/v1/run/${flowId}`;
  }

  if (!apiUrl || !apiKey) {
    throw new Error(
      "Langflow is not configured. Set LANGFLOW_API_URL and LANGFLOW_API_KEY, or LANGFLOW_URL + LANGFLOW_FLOW_ID + LANGFLOW_API_KEY.",
    );
  }

  return { apiUrl: buildRunUrl(apiUrl), apiKey };
}

function buildRunUrl(apiUrl: string): string {
  const url = new URL(apiUrl);

  if (!url.searchParams.has("stream")) {
    url.searchParams.set("stream", "false");
  }

  return url.toString();
}

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

      const results = (inner as Record<string, unknown>).results;
      if (!results || typeof results !== "object") continue;

      const message = (results as Record<string, unknown>).message;
      if (!message || typeof message !== "object") continue;

      const msg = message as Record<string, unknown>;
      const text = getMessageText(msg);
      if (!text) continue;

      messages.push({
        text,
        sender: typeof msg.sender === "string" ? msg.sender : undefined,
        senderName:
          typeof msg.sender_name === "string" ? msg.sender_name : undefined,
        componentId:
          typeof msg.component_id === "string" ? msg.component_id : undefined,
      });
    }
  }

  return messages;
}

function inspectRagEvidence(data: unknown) {
  const componentIds: string[] = [];
  const innerResultKeys: string[] = [];
  let sourceDocumentCount = 0;
  let hasContentBlocks = false;
  let messageSourceDisplayName: string | undefined;

  function walk(node: unknown, depth = 0) {
    if (!node || typeof node !== "object" || depth > 12) return;

    const record = node as Record<string, unknown>;

    if (typeof record.component_id === "string") {
      componentIds.push(record.component_id);
    }

    if (record.results && typeof record.results === "object") {
      const resultKeys = Object.keys(record.results as Record<string, unknown>);
      for (const key of resultKeys) {
        if (!innerResultKeys.includes(key)) innerResultKeys.push(key);
      }
    }

    if (Array.isArray(record.source_documents)) {
      sourceDocumentCount += record.source_documents.length;
    }

    if (Array.isArray(record.documents)) {
      sourceDocumentCount += record.documents.length;
    }

    if (Array.isArray(record.content_blocks) && record.content_blocks.length > 0) {
      hasContentBlocks = true;
    }

    if (record.properties && typeof record.properties === "object") {
      const props = record.properties as Record<string, unknown>;
      if (props.source && typeof props.source === "object") {
        const source = props.source as Record<string, unknown>;
        if (typeof source.display_name === "string") {
          messageSourceDisplayName = source.display_name;
        }
      }
    }

    for (const value of Object.values(record)) {
      if (Array.isArray(value)) {
        for (const item of value) walk(item, depth + 1);
      } else if (value && typeof value === "object") {
        walk(value, depth + 1);
      }
    }
  }

  walk(data);

  return {
    componentIds: [...new Set(componentIds)].slice(0, 20),
    innerResultKeys: innerResultKeys.slice(0, 20),
    sourceDocumentCount,
    hasContentBlocks,
    messageSourceDisplayName,
    hasRetrieverComponent: componentIds.some((id) =>
      /retriev|vector|chroma|qdrant|pinecone|astra|search/i.test(id),
    ),
  };
}

function looksLikeGenericLlmAnswer(text: string): boolean {
  const genericPhrases = [
    "depending on what you count",
    "can mean different things",
    "commonly cited figure",
    "if you want, i can also break",
    "political-science angle",
    "journalistically speaking",
    "i don't have access",
    "as an ai",
  ];

  const lower = text.toLowerCase();
  return genericPhrases.some((phrase) => lower.includes(phrase));
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
    const nested = extractMessageText(record.message);
    if (nested) return nested;
  }

  if (record.results && typeof record.results === "object") {
    const nested = extractMessageText(
      (record.results as Record<string, unknown>).message,
    );
    if (nested) return nested;
  }

  if (Array.isArray(record.outputs)) {
    for (const output of record.outputs) {
      const nested = extractMessageText(output);
      if (nested) return nested;
    }
  }

  for (const value of Object.values(record)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const nested = extractMessageText(item);
        if (nested) return nested;
      }
    } else if (value && typeof value === "object") {
      const nested = extractMessageText(value);
      if (nested) return nested;
    }
  }

  return null;
}

function extractChatOutputText(data: unknown): string | null {
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

function extractMessageText(data: unknown): string | null {
  return extractChatOutputText(data);
}

function evaluateRagGrounding(
  content: string,
  evidence: ReturnType<typeof inspectRagEvidence>,
): RagStatus {
  if (evidence.sourceDocumentCount > 0) return "grounded";

  const lower = content.toLowerCase();
  const noContextPhrases = [
    "context you provided",
    "i'd need that context",
    "if you share the relevant",
    "without the document",
    "don't have access to the document",
    "not available in the context",
    "cannot find that in the context",
  ];

  if (noContextPhrases.some((phrase) => lower.includes(phrase))) {
    return "ungrounded";
  }

  if (looksLikeGenericLlmAnswer(content)) {
    return "ungrounded";
  }

  if (/£/.test(content)) {
    return "ungrounded";
  }

  return "grounded";
}

function parseLangflowResponse(
  data: unknown,
  fallbackSessionId: string,
): LangflowChatResult {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid Langflow response");
  }

  const record = data as Record<string, unknown>;
  const content = extractMessageText(record);

  if (!content) {
    throw new Error("Langflow response did not include assistant text");
  }

  const sessionId =
    typeof record.session_id === "string" && record.session_id.trim()
      ? record.session_id.trim()
      : fallbackSessionId;

  const ragEvidence = inspectRagEvidence(data);

  return {
    content,
    sessionId,
    ragStatus: evaluateRagGrounding(content, ragEvidence),
  };
}

export async function runLangflowChat(
  request: LangflowChatRequest,
): Promise<LangflowChatResult> {
  const diagnostics = getLangflowConfigDiagnostics();
  const { apiUrl, apiKey } = getLangflowConfig();

  // #region agent log
  fetch("http://127.0.0.1:7634/ingest/fc4d710d-2ecc-4ec8-8613-46b85a71e958", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "7ca203",
    },
    body: JSON.stringify({
      sessionId: "7ca203",
      runId: "prod-debug",
      hypothesisId: "A-B",
      location: "lib/chat/langflow/server.ts:runLangflowChat:entry",
      message: "Langflow request starting",
      data: {
        resolvedHost: diagnostics.resolvedHost,
        resolvedFlowId: diagnostics.resolvedFlowId,
        isProduction: diagnostics.isProduction,
        usesLocalhost: diagnostics.usesLocalhost,
        sessionIncluded: false,
        messageLength: request.message.length,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      input_value: request.message,
      input_type: "chat",
      output_type: "chat",
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    throw new Error(`Langflow request failed with status ${response.status}`);
  }

  const data: unknown = await response.json();
  const parsed = parseLangflowResponse(data, "");

  // #region agent log
  fetch("http://127.0.0.1:7634/ingest/fc4d710d-2ecc-4ec8-8613-46b85a71e958", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "7ca203",
    },
    body: JSON.stringify({
      sessionId: "7ca203",
      runId: "prod-debug",
      hypothesisId: "C-D",
      location: "lib/chat/langflow/server.ts:runLangflowChat:response",
      message: "Langflow response received",
      data: {
        ragStatus: parsed.ragStatus,
        contentPreview: parsed.content.slice(0, 220),
        hasExpectedFigure: /98,700,000|98700000/i.test(parsed.content),
        resolvedHost: diagnostics.resolvedHost,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return parsed;
}
