import { NextResponse } from "next/server";
import { getLangflowConfigDiagnostics } from "@/lib/chat/langflow/config";
import { runLangflowChat } from "@/lib/chat/langflow/server";

export async function POST(request: Request) {
  const diagnostics = getLangflowConfigDiagnostics();

  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { message } = body as { message?: unknown };
    const trimmed = typeof message === "string" ? message.trim() : "";

    if (!trimmed) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const result = await runLangflowChat({ message: trimmed });

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
        hypothesisId: "D-E",
        location: "app/api/chat/route.ts:POST:success",
        message: "Chat API success",
        data: {
          ragStatus: result.ragStatus,
          resolvedHost: diagnostics.resolvedHost,
          contentLength: result.content.length,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return NextResponse.json({
      content: result.content,
      citations: result.citations,
      ragStatus: result.ragStatus,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get a response";

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
        location: "app/api/chat/route.ts:POST:error",
        message: "Chat API error",
        data: {
          errorMessage: message.slice(0, 200),
          resolvedHost: diagnostics.resolvedHost,
          configurationIssue: diagnostics.configurationIssue,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    console.error("Chat API error:", error);

    return NextResponse.json(
      {
        error: "Failed to get a response from the assistant",
        detail: diagnostics.isProduction ? message : undefined,
        langflowHost: diagnostics.resolvedHost,
      },
      { status: 500 },
    );
  }
}
