import type { Message } from "@/lib/chat/types";

type ChatMessageProps = {
  message: Message;
};

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 text-sm font-light text-[rgba(60,30,80,0.5)]">
      <span className="flex gap-1">
        <span className="size-1.5 animate-pulse rounded-full bg-[#c97ab0] [animation-delay:0ms]" />
        <span className="size-1.5 animate-pulse rounded-full bg-[#c97ab0] [animation-delay:150ms]" />
        <span className="size-1.5 animate-pulse rounded-full bg-[#c97ab0] [animation-delay:300ms]" />
      </span>
      Thinking…
    </div>
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl border border-white/65 bg-white/55 px-5 py-3.5 text-left text-base leading-[1.6] font-light text-[#2d1240] shadow-[0_4px_20px_rgba(100,40,120,0.06)]">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] rounded-2xl border border-white/65 bg-white/45 px-5 py-4 shadow-[0_8px_40px_rgba(100,40,120,0.08),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl">
        {message.status === "thinking" ? (
          <ThinkingIndicator />
        ) : (
          <>
            {message.ragStatus === "ungrounded" ? (
              <p className="mb-3 rounded-xl border border-[#e8c4a8]/60 bg-[#fff8f0]/80 px-3 py-2 text-sm leading-[1.5] font-light text-[#8a5a30]">
                This answer was not grounded in your budget documents. In
                Langflow, load your corpus via File → Split Text → Astra DB
                (ingestion) and confirm the retriever path uses collection{" "}
                <span className="font-normal">la_budget_yearly_docs</span>.
              </p>
            ) : null}
            <p
              className={`text-base leading-[1.7] font-light ${
                message.status === "error"
                  ? "text-[#a0497a]"
                  : "text-[rgba(60,30,80,0.75)]"
              }`}
            >
              {message.content}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
