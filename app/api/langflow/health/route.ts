import { NextResponse } from "next/server";

function getLangflowConfig() {
  const langflowUrl =
    process.env.LANGFLOW_URL || process.env.LANGFLOW_SERVER_URL || "";

  const flowId = process.env.LANGFLOW_FLOW_ID || "";
  const apiKey = process.env.LANGFLOW_API_KEY || "";

  let resolvedHost = "";

  try {
    if (langflowUrl) {
      resolvedHost = new URL(langflowUrl).host;
    }
  } catch {
    resolvedHost = "invalid-url";
  }

  const usesLocalhost =
    resolvedHost.includes("localhost") ||
    resolvedHost.includes("127.0.0.1");

  const isProduction =
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production";

  let configurationIssue: string | null = null;

  if (!langflowUrl) {
    configurationIssue = "Missing LANGFLOW_URL.";
  } else if (!flowId) {
    configurationIssue = "Missing LANGFLOW_FLOW_ID.";
  } else if (!apiKey) {
    configurationIssue = "Missing LANGFLOW_API_KEY.";
  } else if (isProduction && usesLocalhost) {
    configurationIssue =
      "Production is configured to use localhost. Set LANGFLOW_URL to your Fly.io Langflow URL.";
  }

  return {
    langflowUrl,
    flowId,
    apiKey,
    resolvedHost,
    usesLocalhost,
    isProduction,
    configurationIssue,
  };
}

function extractText(data: unknown): string {
  const response = data as any;

  const text =
    response?.outputs?.[0]?.outputs?.[0]?.results?.message?.text ??
    response?.outputs?.[0]?.outputs?.[0]?.results?.text?.text ??
    response?.outputs?.[0]?.outputs?.[0]?.results?.text ??
    response?.outputs?.[0]?.outputs?.[0]?.outputs?.message?.message ??
    response?.message ??
    response?.text;

  return typeof text === "string" ? text : "";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shouldProbe = searchParams.get("probe") === "true";

  const {
    langflowUrl,
    flowId,
    apiKey,
    resolvedHost,
    usesLocalhost,
    isProduction,
    configurationIssue,
  } = getLangflowConfig();

  const baseResponse = {
    apiKeyConfigured: Boolean(apiKey),
    apiUrlConfigured: Boolean(langflowUrl),
    resolvedHost,
    resolvedFlowId: flowId || null,
    usesLocalhost,
    isProduction,
    configurationIssue,
  };

  if (!shouldProbe || configurationIssue) {
    return NextResponse.json(baseResponse);
  }

  try {
    const question =
      "What is the exact budget line item for Homelessness Emergency in 2026-27?";

    const response = await fetch(
      `${langflowUrl.replace(/\/$/, "")}/api/v1/run/${flowId}?stream=false`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          input_value: question,
          input_type: "chat",
          output_type: "chat",
          session_id: "la-budget-health-check",
        }),
      }
    );

    const data = await response.json();
    const content = extractText(data);

    return NextResponse.json({
      ...baseResponse,
      probe: {
        question,
        status: response.status,
        ok: response.ok,
        ragStatus: content ? "grounded" : "unknown",
        contentPreview: content.slice(0, 300),
        matchesPlaygroundFigure:
          content.includes("$98,700,000") ||
          content.includes("98,700,000"),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ...baseResponse,
        probe: {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Unknown Langflow probe error.",
        },
      },
      { status: 500 }
    );
  }
}