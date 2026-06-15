import type { Citation, RagStatus } from "../types";
import {
  buildLangflowHeaders,
  getLangflowConfigDiagnostics,
  getLangflowRuntimeConfig,
} from "./config";
import { extractLangflowText } from "./extract";

export type LangflowChatRequest = {
  message: string;
};

export type LangflowChatResult = {
  content: string;
  sessionId: string;
  citations?: Citation[];
  ragStatus: RagStatus;
};

export type LangflowProbeResult = {
  status: number;
  statusText: string;
  contentType: string | null;
  ok: boolean;
  rawPreview: string;
  parseError?: string;
  content: string;
  ragStatus: RagStatus | "unknown";
  matchesPlaygroundFigure: boolean;
};

function inspectRagEvidence(data: unknown) {
  let sourceDocumentCount = 0;
  let messageSourceDisplayName: string | undefined;

  function walk(node: unknown, depth = 0) {
    if (!node || typeof node !== "object" || depth > 12) return;
    const record = node as Record<string, unknown>;

    if (Array.isArray(record.source_documents)) {
      sourceDocumentCount += record.source_documents.length;
    }
    if (Array.isArray(record.documents)) {
      sourceDocumentCount += record.documents.length;
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
  return { sourceDocumentCount, messageSourceDisplayName };
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
    "requires a valid api key",
    "authentication",
  ];

  const lower = text.toLowerCase();
  return genericPhrases.some((phrase) => lower.includes(phrase));
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

  if (looksLikeGenericLlmAnswer(content) || /£/.test(content)) {
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
  const content = extractLangflowText(record);

  if (!content) {
    throw new Error("Langflow response did not include assistant text");
  }

  const sessionId =
    typeof record.session_id === "string" && record.session_id.trim()
      ? record.session_id.trim()
      : fallbackSessionId;

  return {
    content,
    sessionId,
    ragStatus: evaluateRagGrounding(content, inspectRagEvidence(data)),
  };
}

export async function runLangflowRequest(message: string) {
  const config = getLangflowRuntimeConfig();

  const response = await fetch(config.runUrl, {
    method: "POST",
    headers: buildLangflowHeaders(config.apiKey),
    body: JSON.stringify({
      input_value: message,
      input_type: "chat",
      output_type: "chat",
    }),
    signal: AbortSignal.timeout(120_000),
  });

  const rawText = await response.text();
  const contentType = response.headers.get("content-type");

  return {
    config,
    response,
    rawText,
    contentType,
  };
}

export async function probeLangflow(
  message: string,
): Promise<LangflowProbeResult> {
  const { response, rawText, contentType } = await runLangflowRequest(message);
  const rawPreview = rawText.slice(0, 500);

  if (!response.ok) {
    return {
      status: response.status,
      statusText: response.statusText,
      contentType,
      ok: false,
      rawPreview,
      content: "",
      ragStatus: "unknown",
      matchesPlaygroundFigure: false,
    };
  }

  let data: unknown;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch (error) {
    return {
      status: response.status,
      statusText: response.statusText,
      contentType,
      ok: response.ok,
      rawPreview,
      parseError:
        error instanceof Error ? error.message : "JSON parse failed.",
      content: "",
      ragStatus: "unknown",
      matchesPlaygroundFigure: false,
    };
  }

  const content = extractLangflowText(data) ?? "";

  return {
    status: response.status,
    statusText: response.statusText,
    contentType,
    ok: response.ok,
    rawPreview,
    content,
    ragStatus: content
      ? evaluateRagGrounding(content, inspectRagEvidence(data))
      : "unknown",
    matchesPlaygroundFigure: /98,700,000|98700000/i.test(content),
  };
}

export async function runLangflowChat(
  request: LangflowChatRequest,
): Promise<LangflowChatResult> {
  getLangflowConfigDiagnostics();

  const { response, rawText } = await runLangflowRequest(request.message);

  if (!response.ok) {
    let detail = `Langflow request failed with status ${response.status}`;
    try {
      const errorBody = rawText ? JSON.parse(rawText) : null;
      if (
        errorBody &&
        typeof errorBody === "object" &&
        typeof (errorBody as Record<string, unknown>).detail === "string"
      ) {
        detail = (errorBody as Record<string, unknown>).detail as string;
      }
    } catch {
      if (rawText.trim()) {
        detail = rawText.slice(0, 200);
      }
    }
    throw new Error(detail);
  }

  const data: unknown = rawText ? JSON.parse(rawText) : null;
  return parseLangflowResponse(data, "");
}
