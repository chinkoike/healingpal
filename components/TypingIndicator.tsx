"use client";

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 msg-enter">
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm"
        style={{
          background: "linear-gradient(135deg, #f5e0e0, #e8d8cf)",
          border: "1.5px solid #e8a4a4",
        }}
      >
        🤍
      </div>
      <div
        className="flex items-center gap-1.25 rounded-2xl rounded-bl-md px-4 py-3"
        style={{ background: "#f2e8e2", border: "1px solid #e8d8cf" }}
      >
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}
