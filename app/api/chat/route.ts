import { NextResponse } from "next/server";
import { runLangflowChat } from "@/lib/chat/langflow/server";

export async function POST(request: Request) {
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
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to get a response from the assistant" },
      { status: 500 },
    );
  }
}
