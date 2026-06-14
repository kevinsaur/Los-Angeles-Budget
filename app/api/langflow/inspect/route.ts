import { NextResponse } from "next/server";
import {
  compareLangflowPayloads,
  inspectConfiguredFlow,
  probeLangflowRun,
} from "@/lib/chat/langflow/inspect";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const inspection = await inspectConfiguredFlow();
    const { searchParams } = new URL(request.url);

    if (searchParams.get("compare") === "true") {
      const comparison = await compareLangflowPayloads(
        searchParams.get("q") ??
          "What is the exact budget line item for Homelessness Emergency in 2026-27?",
      );
      return NextResponse.json({ comparison });
    }

    if (searchParams.get("probe") === "true") {
      const { data } = await probeLangflowRun(
        searchParams.get("q") ??
          "What is the exact budget line item for Homelessness Emergency in 2026-27?",
      );
      return NextResponse.json({ inspection, probe: data });
    }

    return NextResponse.json(inspection);
  } catch (error) {
    console.error("Langflow inspect error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to inspect Langflow flow",
      },
      { status: 500 },
    );
  }
}
