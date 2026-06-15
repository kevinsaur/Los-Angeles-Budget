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

    return NextResponse.json({
      content: result.content,
      citations: result.citations,
      ragStatus: result.ragStatus,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get a response";

    console.error("Chat API error:", error);

    const isDev = process.env.NODE_ENV !== "production";

    return NextResponse.json(
      {
        error: "Failed to get a response from the assistant",
        detail: isDev ? message : undefined,
        langflowHost: diagnostics.resolvedHost,
        sendsApiKeyHeader: diagnostics.sendsApiKeyHeader,
      },
      { status: 500 },
    );
  }
}
