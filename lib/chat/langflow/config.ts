export type LangflowConfigDiagnostics = {
  apiKeyConfigured: boolean;
  sendsApiKeyHeader: boolean;
  apiUrlConfigured: boolean;
  resolvedHost: string | null;
  resolvedFlowId: string | null;
  resolvedRunUrl: string | null;
  usesLocalhost: boolean;
  isProduction: boolean;
  configurationIssue: string | null;
};

export type LangflowRuntimeConfig = {
  runUrl: string;
  apiKey?: string;
  flowId: string;
  host: string;
};

function getFlowIdFromApiUrl(apiUrl: string): string | null {
  try {
    const match = new URL(apiUrl).pathname.match(/\/api\/v1\/run\/([0-9a-f-]+)/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function resolveLangflowTarget(): {
  baseUrl: string | null;
  flowId: string | null;
  apiKey: string | undefined;
} {
  const apiKey = process.env.LANGFLOW_API_KEY?.trim() || undefined;
  const baseUrl =
    process.env.LANGFLOW_URL?.trim() ||
    process.env.LANGFLOW_SERVER_URL?.trim() ||
    null;
  const flowId = process.env.LANGFLOW_FLOW_ID?.trim() || null;
  const legacyApiUrl = process.env.LANGFLOW_API_URL?.trim();

  if (baseUrl && flowId) {
    return { baseUrl: baseUrl.replace(/\/$/, ""), flowId, apiKey };
  }

  if (legacyApiUrl) {
    try {
      const url = new URL(legacyApiUrl);
      return {
        baseUrl: `${url.protocol}//${url.host}`,
        flowId: getFlowIdFromApiUrl(legacyApiUrl),
        apiKey,
      };
    } catch {
      return { baseUrl: null, flowId: null, apiKey };
    }
  }

  return { baseUrl, flowId, apiKey };
}

export function buildLangflowRunUrl(baseUrl: string, flowId: string): string {
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/api/v1/run/${flowId}`);
  url.searchParams.set("stream", "false");
  return url.toString();
}

export function buildLangflowHeaders(apiKey?: string): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    accept: "application/json",
  };

  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  return headers;
}

export function getLangflowConfigDiagnostics(): LangflowConfigDiagnostics {
  const { baseUrl, flowId, apiKey } = resolveLangflowTarget();

  let resolvedHost: string | null = null;
  let resolvedRunUrl: string | null = null;

  if (baseUrl) {
    try {
      resolvedHost = new URL(baseUrl).host;
      if (flowId) {
        resolvedRunUrl = buildLangflowRunUrl(baseUrl, flowId);
      }
    } catch {
      resolvedHost = null;
    }
  }

  const usesLocalhost =
    resolvedHost !== null &&
    /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(resolvedHost);

  const isProduction =
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production";

  let configurationIssue: string | null = null;

  if (!baseUrl) {
    configurationIssue = "Missing LANGFLOW_URL.";
  } else if (!flowId) {
    configurationIssue = "Missing LANGFLOW_FLOW_ID.";
  } else if (isProduction && usesLocalhost) {
    configurationIssue =
      "Production cannot reach localhost Langflow. Set LANGFLOW_URL to your publicly reachable Langflow host.";
  }

  return {
    apiKeyConfigured: Boolean(apiKey),
    sendsApiKeyHeader: Boolean(apiKey),
    apiUrlConfigured: Boolean(baseUrl && flowId),
    resolvedHost,
    resolvedFlowId: flowId,
    resolvedRunUrl,
    usesLocalhost,
    isProduction,
    configurationIssue,
  };
}

export function getLangflowRuntimeConfig(): LangflowRuntimeConfig {
  const diagnostics = getLangflowConfigDiagnostics();

  if (diagnostics.configurationIssue) {
    throw new Error(diagnostics.configurationIssue);
  }

  const { baseUrl, flowId, apiKey } = resolveLangflowTarget();

  if (!baseUrl || !flowId || !diagnostics.resolvedRunUrl) {
    throw new Error(
      "Langflow is not configured. Set LANGFLOW_URL and LANGFLOW_FLOW_ID.",
    );
  }

  return {
    runUrl: diagnostics.resolvedRunUrl,
    apiKey,
    flowId,
    host: diagnostics.resolvedHost ?? new URL(baseUrl).host,
  };
}
