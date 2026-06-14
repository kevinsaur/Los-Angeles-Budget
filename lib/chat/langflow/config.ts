export type LangflowConfigDiagnostics = {
  apiKeyConfigured: boolean;
  apiUrlConfigured: boolean;
  resolvedHost: string | null;
  resolvedFlowId: string | null;
  usesLocalhost: boolean;
  isProduction: boolean;
  configurationIssue: string | null;
};

function getFlowIdFromApiUrl(apiUrl: string): string | null {
  try {
    const match = new URL(apiUrl).pathname.match(/\/api\/v1\/run\/([0-9a-f-]+)/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function getLangflowConfigDiagnostics(): LangflowConfigDiagnostics {
  const apiKey = process.env.LANGFLOW_API_KEY?.trim();
  const baseUrl =
    process.env.LANGFLOW_URL?.trim() ||
    process.env.LANGFLOW_SERVER_URL?.trim();
  const flowId = process.env.LANGFLOW_FLOW_ID?.trim();
  let apiUrl = process.env.LANGFLOW_API_URL?.trim();

  if (!apiUrl && baseUrl && flowId) {
    apiUrl = `${baseUrl.replace(/\/$/, "")}/api/v1/run/${flowId}`;
  }

  let resolvedHost: string | null = null;
  let resolvedFlowId: string | null = flowId ?? null;

  if (apiUrl) {
    try {
      const url = new URL(apiUrl);
      resolvedHost = url.host;
      resolvedFlowId = resolvedFlowId ?? getFlowIdFromApiUrl(apiUrl);
    } catch {
      resolvedHost = null;
    }
  }

  const usesLocalhost =
    resolvedHost !== null &&
    /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(resolvedHost);

  const isProduction = process.env.NODE_ENV === "production";
  let configurationIssue: string | null = null;

  if (!apiKey || !apiUrl) {
    configurationIssue =
      "Missing LANGFLOW_API_KEY or LANGFLOW_API_URL/LANGFLOW_URL+LANGFLOW_FLOW_ID.";
  } else if (isProduction && usesLocalhost) {
    configurationIssue =
      "Production cannot reach localhost Langflow. Set LANGFLOW_URL to your publicly reachable Langflow host (tunnel, cloud, or hosted instance).";
  }

  return {
    apiKeyConfigured: Boolean(apiKey),
    apiUrlConfigured: Boolean(apiUrl),
    resolvedHost,
    resolvedFlowId,
    usesLocalhost,
    isProduction,
    configurationIssue,
  };
}
