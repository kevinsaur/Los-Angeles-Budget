import { NextResponse } from "next/server";
import { getLangflowConfigDiagnostics } from "@/lib/chat/langflow/config";
import { probeLangflow } from "@/lib/chat/langflow/server";

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
    const probe = await probeLangflow(
      searchParams.get("q")?.trim() || PROBE_QUESTION,
    );

    return NextResponse.json({
      ...diagnostics,
      probe: {
        question: searchParams.get("q")?.trim() || PROBE_QUESTION,
        status: probe.status,
        statusText: probe.statusText,
        contentType: probe.contentType,
        ok: probe.ok,
        parseError: probe.parseError,
        rawPreview: probe.rawPreview,
        ragStatus: probe.ragStatus,
        contentPreview: probe.content.slice(0, 300),
        matchesPlaygroundFigure: probe.matchesPlaygroundFigure,
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
