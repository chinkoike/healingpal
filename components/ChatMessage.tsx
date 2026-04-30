"use client";

interface Props {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export default function ChatMessage({ role, content, isStreaming }: Props) {
  const isAI = role === "assistant";

  return (
    <div className={`flex items-end gap-2 msg-enter ${isAI ? "" : "flex-row-reverse"}`}>
      {/* Avatar */}
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm"
        style={{
          background: isAI
            ? "linear-gradient(135deg, #f5e0e0, #e8d8cf)"
            : "linear-gradient(135deg, #f2e8e2, #e8d8cf)",
          border: `1.5px solid ${isAI ? "#e8a4a4" : "#e8d8cf"}`,
        }}>
        {isAI ? "🤍" : "🙂"}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-[14.5px] leading-relaxed ${
          isStreaming ? "streaming-cursor" : ""
        } ${isAI ? "rounded-bl-[5px]" : "rounded-br-[5px]"}`}
        style={
          isAI
            ? { background: "#f2e8e2", border: "1px solid #e8d8cf", color: "#3a2a28" }
            : { background: "#e8a4a4", border: "1px solid #c97a7a", color: "#3a1a1a" }
        }>
        {content.split("\n\n").map((para, i) => (
          <p key={i} className={i > 0 ? "mt-2" : ""}>
            {para}
          </p>
        ))}
      </div>
    </div>
  );
}
