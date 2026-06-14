function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="mt-0.5 size-[18px] shrink-0 text-[rgba(60,30,80,0.35)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function ArrowRightIcon({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`size-4 ${active ? "text-white" : "text-[rgba(60,30,80,0.25)]"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function resizeTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  variant?: "chat" | "search";
  hint?: string;
};

export function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Ask a question about the LA city budget…",
  disabled = false,
  variant = "chat",
  hint = "Press Enter to search · Shift+Enter for new line",
}: ChatInputProps) {
  const hasValue = value.trim().length > 0;
  const canSubmit = hasValue && !disabled;
  const isSearch = variant === "search";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative rounded-2xl border border-white/65 bg-white/45 shadow-[0_8px_40px_rgba(100,40,120,0.1),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl transition-shadow duration-300">
        <div
          className={
            isSearch
              ? "flex items-start gap-3 p-4 pl-5"
              : "flex items-start gap-3 px-5 py-3.5"
          }
        >
          <SearchIcon />
          <textarea
            rows={1}
            value={value}
            disabled={disabled}
            onChange={(e) => {
              onChange(e.target.value);
              resizeTextarea(e.target);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
            placeholder={placeholder}
            className="max-h-48 min-h-[1.6rem] flex-1 resize-none bg-transparent text-base leading-[1.6] font-light text-[#2d1240] caret-[#a0497a] outline-none placeholder:text-[rgba(60,30,80,0.35)] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className={`flex size-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
              canSubmit
                ? "cursor-pointer bg-[linear-gradient(135deg,#c97ab0,#e8a07a)]"
                : "cursor-default bg-[rgba(60,30,80,0.08)]"
            }`}
          >
            <ArrowRightIcon active={canSubmit} />
          </button>
        </div>

        {isSearch ? (
          <div className="px-5 pb-3 text-xs text-[rgba(60,30,80,0.35)]">
            {hint}
          </div>
        ) : null}
      </div>
    </form>
  );
}
