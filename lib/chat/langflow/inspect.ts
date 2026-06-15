function getFlowIdFromEnv(): string | null {
  const flowId = process.env.LANGFLOW_FLOW_ID?.trim();
  if (flowId) return flowId;

  const apiUrl = process.env.LANGFLOW_API_URL?.trim();
  if (!apiUrl) return null;

  try {
    const match = new URL(apiUrl).pathname.match(
      /\/api\/v1\/run\/([0-9a-f-]+)/i,
    );
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function getLangflowBaseUrl(): string | null {
  const base =
    process.env.LANGFLOW_URL?.trim() ||
    process.env.LANGFLOW_SERVER_URL?.trim();

  if (base) return base.replace(/\/$/, "");

  const apiUrl = process.env.LANGFLOW_API_URL?.trim();
  if (!apiUrl) return null;

  try {
    const url = new URL(apiUrl);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

export async function probeLangflowRun(
  message: string,
  options?: {
    sessionId?: string | null;
    outputType?: "chat" | "any";
  },
) {
  const apiKey = process.env.LANGFLOW_API_KEY?.trim();
  const baseUrl = getLangflowBaseUrl();
  const flowId = getFlowIdFromEnv();

  if (!apiKey || !baseUrl || !flowId) {
    throw new Error("Langflow probe configuration is incomplete");
  }

  const url = `${baseUrl}/api/v1/run/${flowId}?stream=false`;
  const payload: Record<string, string> = {
    input_value: message,
    input_type: "chat",
    output_type: options?.outputType ?? "chat",
  };

  if (options?.sessionId !== null) {
    payload.session_id = options?.sessionId ?? crypto.randomUUID();
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    throw new Error(`Langflow probe failed with status ${response.status}`);
  }

  const data: unknown = await response.json();
  return { payload, data };
}

function extractProbeText(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const outerOutputs = record.outputs;
  if (!Array.isArray(outerOutputs)) return null;

  for (const outer of outerOutputs) {
    if (!outer || typeof outer !== "object") continue;
    const innerOutputs = (outer as Record<string, unknown>).outputs;
    if (!Array.isArray(innerOutputs)) continue;

    for (const inner of innerOutputs) {
      if (!inner || typeof inner !== "object") continue;
      const results = (inner as Record<string, unknown>).results;
      if (!results || typeof results !== "object") continue;
      const message = (results as Record<string, unknown>).message;
      if (!message || typeof message !== "object") continue;
      const msg = message as Record<string, unknown>;
      if (typeof msg.text === "string" && msg.text.trim()) return msg.text.trim();
      if (msg.data && typeof msg.data === "object") {
        const text = (msg.data as Record<string, unknown>).text;
        if (typeof text === "string" && text.trim()) return text.trim();
      }
    }
  }

  return null;
}

export async function compareLangflowPayloads(message: string) {
  const variants = [
    { label: "no_session_id", sessionId: null },
    { label: "fresh_session_id", sessionId: crypto.randomUUID() },
    { label: "fixed_session_id", sessionId: "playground-test-session" },
  ] as const;

  const results = [];

  for (const variant of variants) {
    const { payload, data } = await probeLangflowRun(message, {
      sessionId: variant.sessionId,
      outputType: "chat",
    });

    results.push({
      label: variant.label,
      payload,
      textPreview: extractProbeText(data)?.slice(0, 220) ?? null,
      sessionReturned:
        data && typeof data === "object"
          ? ((data as Record<string, unknown>).session_id as string | undefined)
          : undefined,
    });
  }

  return results;
}

export async function inspectConfiguredFlow() {
  const apiKey = process.env.LANGFLOW_API_KEY?.trim();
  const baseUrl = getLangflowBaseUrl();
  const flowId = getFlowIdFromEnv();

  if (!apiKey || !baseUrl || !flowId) {
    throw new Error("Langflow inspect configuration is incomplete");
  }

  const response = await fetch(`${baseUrl}/api/v1/flows/${flowId}`, {
    headers: {
      "x-api-key": apiKey,
      accept: "application/json",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Flow inspect failed with status ${response.status}`);
  }

  const rawFlow = await response.json();
  const data: unknown = rawFlow;
  if (!data || typeof data !== "object") {
    throw new Error("Invalid flow inspect response");
  }

  const record = data as Record<string, unknown>;
  const graphData =
    record.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : null;
  const nodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];

  const components = nodes
    .map((node) => {
      if (!node || typeof node !== "object") return null;
      const n = node as Record<string, unknown>;
      const nodeData =
        n.data && typeof n.data === "object"
          ? (n.data as Record<string, unknown>)
          : null;
      const nodeType =
        nodeData?.type && typeof nodeData.type === "object"
          ? ((nodeData.type as Record<string, unknown>).name as string | undefined)
          : undefined;
      const template =
        nodeData?.node &&
        typeof nodeData.node === "object" &&
        (nodeData.node as Record<string, unknown>).template &&
        typeof (nodeData.node as Record<string, unknown>).template === "object"
          ? ((nodeData.node as Record<string, unknown>).template as Record<
              string,
              unknown
            >)
          : null;

      const templateSummary: Record<string, string | boolean | number> = {};
      if (template) {
        for (const [key, value] of Object.entries(template)) {
          if (!value || typeof value !== "object") continue;
          const field = value as Record<string, unknown>;
          const fieldValue = field.value;
          if (
            typeof fieldValue === "string" ||
            typeof fieldValue === "boolean" ||
            typeof fieldValue === "number"
          ) {
            if (/token|password|secret|key/i.test(key) && fieldValue) {
              templateSummary[key] = "[set]";
            } else {
              templateSummary[key] = fieldValue;
            }
          }
        }
      }

      const nodeRecord =
        nodeData?.node && typeof nodeData.node === "object"
          ? (nodeData.node as Record<string, unknown>)
          : null;

      return {
        id: typeof n.id === "string" ? n.id : undefined,
        type: nodeType,
        displayName:
          typeof nodeRecord?.display_name === "string"
            ? nodeRecord.display_name
            : typeof nodeData?.display_name === "string"
              ? nodeData.display_name
              : undefined,
        templateSummary,
      };
    })
    .filter(Boolean);

  const edges = Array.isArray(graphData?.edges) ? graphData.edges : [];

  const connections = edges.map((edge) => {
    if (!edge || typeof edge !== "object") return null;
    const e = edge as Record<string, unknown>;

    const source = e.source;
    const target = e.target;

    const from =
      typeof source === "string"
        ? source
        : source && typeof source === "object"
          ? ((source as Record<string, unknown>).id as string | undefined) ||
            ((source as Record<string, unknown>).cell as string | undefined)
          : undefined;

    const to =
      typeof target === "string"
        ? target
        : target && typeof target === "object"
          ? ((target as Record<string, unknown>).id as string | undefined) ||
            ((target as Record<string, unknown>).cell as string | undefined)
          : undefined;

    return { from, to, rawKeys: Object.keys(e) };
  });

  const chatInputId = components.find((component) =>
    /chat input/i.test(component?.displayName ?? ""),
  )?.id;

  const chatInputTargets = connections
    .filter((connection) => connection?.from === chatInputId)
    .map((connection) => connection?.to);

  const orphanedComponents = components.filter((component) => {
    if (!component?.id || !component.displayName) return false;
    const connectedIds = new Set<string>();
    for (const connection of connections) {
      if (connection?.from) connectedIds.add(connection.from);
      if (connection?.to) connectedIds.add(connection.to);
    }
    return !connectedIds.has(component.id);
  });

  const astraComponents = components.filter((component) =>
    /astra db/i.test(component?.displayName ?? ""),
  );

  const fileComponent = components.find((component) =>
    /file/i.test(component?.displayName ?? ""),
  );

  const diagnosis = {
    retrievalPath:
      "Chat Input -> Astra DB (search) -> Parser -> Prompt -> Language Model -> Chat Output",
    ingestionPath: "File -> Split Text -> Astra DB (load)",
    orphanedVectorStores: orphanedComponents
      .filter((component) =>
        /chroma|knowledge|embedding/i.test(component?.displayName ?? ""),
      )
      .map((component) => component?.displayName),
    fileLoaded: Boolean(fileComponent?.templateSummary?.file_path),
    astraCollections: astraComponents.map((component) => ({
      id: component?.id,
      collectionName: component?.templateSummary?.collection_name,
      databaseName: component?.templateSummary?.database_name,
      tokenConfigured: component?.templateSummary?.token === "[set]",
    })),
    likelyIssue:
      orphanedComponents.some((component) =>
        /chroma db/i.test(component?.displayName ?? ""),
      ) && astraComponents.length > 0
        ? "Chroma DB is configured but not wired into the active flow. Retrieval uses Astra DB instead."
        : !fileComponent?.templateSummary?.file_path
          ? "No file is loaded for ingestion. The Astra DB collection may be empty on this local install."
          : "Unknown — inspect vector store contents in Langflow.",
  };

  return {
    flowId,
    name: typeof record.name === "string" ? record.name : undefined,
    components,
    connections,
    chatInputId,
    chatInputTargets,
    diagnosis,
    hasRetriever:
      components.some((component) =>
        /retriev|vector|chroma|qdrant|pinecone|astra|similarity/i.test(
          `${component?.type ?? ""} ${component?.displayName ?? ""}`,
        ),
      ) ?? false,
    hasChatInput:
      components.some((component) =>
        /chatinput|chat input/i.test(
          `${component?.type ?? ""} ${component?.displayName ?? ""}`,
        ),
      ) ?? false,
  };
}
