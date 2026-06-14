import { NextResponse } from "next/server";
import { getLangflowConfigDiagnostics } from "@/lib/chat/langflow/config";
import { runLangflowChat } from "@/lib/chat/langflow/server";

const PROBE_QUESTION =
  "What is the exact budget line item for Homelessness Emergency in 2026-27?";

export async function GET(request: Request) {
  const diagnostics = getLangflowConfigDiagnostics();
  const { searchParams } = new URL(request.url);

  if (searchParams.get("probe") !== "true") {
    return NextResponse.json(diagnostics);
  }

  if (diagnostics.configurationIssue) {
    return NextResponse.json(
      {
        ...diagnostics,
        probeError: diagnostics.configurationIssue,
      },
      { status: 500 },
    );
  }

  try {
    const result = await runLangflowChat({ message: PROBE_QUESTION });

    return NextResponse.json({
      ...diagnostics,
      probe: {
        question: PROBE_QUESTION,
        ragStatus: result.ragStatus,
        contentPreview: result.content.slice(0, 280),
        matchesPlaygroundFigure: /98,700,000|98700000/i.test(result.content),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ...diagnostics,
        probeError:
          error instanceof Error ? error.message : "Langflow probe failed",
      },
      { status: 500 },
    );
  }
}
