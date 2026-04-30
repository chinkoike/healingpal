"use client";

import { useChat, UIMessage } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { DefaultChatTransport } from "ai";
import ChatMessage from "@/components/ChatMessage";
import CrisisBanner from "@/components/CrisisBanner";
import TypingIndicator from "@/components/TypingIndicator";

const WELCOME = `Hey, I'm really glad you're here. 🤍

Whatever you're going through right now — this is a safe, judgment-free space. You don't have to have it all figured out. You can just... talk.

So tell me — what's been weighing on your heart lately?`;

type ExtraItem = { id: string; type: "crisis" };

export default function ChatPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const extraIdRef = useRef(0);
  const [extras, setExtras] = useState<ExtraItem[]>([]);
  const [input, setInput] = useState("");

  const { messages, status, sendMessage, setMessages } = useChat<UIMessage>({
      transport: new DefaultChatTransport({ api: "/api/chat" }),
      messages: [
        {
          id: "welcome",
          role: "assistant",
          parts: [{ type: "text", text: WELCOME }],
        },
      ] as UIMessage[],
      onFinish({ message }) {
        const content = extractMessageText(message);
        if (content.trim() === "CRISIS_DETECTED") {
          setMessages((prev) => prev.filter((m) => m.id !== message.id));
          const id = `crisis-${extraIdRef.current++}`;
          setExtras((e) => [...e, { id, type: "crisis" }]);
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: `assistant-${extraIdRef.current++}`,
                role: "assistant",
                parts: [
                {
                  type: "text",
                  text: "I'm still right here with you. You don't have to go through this alone. 🤍 Please reach out to that hotline — they're really good at listening, and they can support you in ways I can't.",
                },
              ],
              } as UIMessage,
            ]);
          }, 900);
        }
      },
    });
  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, extras]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    void sendMessage({ text });
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-0 sm:p-6">
      <div
        className="flex w-full max-w-[640px] flex-col overflow-hidden rounded-none sm:rounded-[20px]"
        style={{
          height: "100dvh",
          maxHeight: "820px",
          background: "#fffaf8",
          boxShadow: "0 0 60px rgba(180,120,110,0.13)",
        }}
      >
        {/* Header */}
        <header
          className="flex shrink-0 items-center gap-3 px-6 py-4"
          style={{ borderBottom: "1px solid #e8d8cf", background: "#fffaf8" }}
        >
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl"
            style={{
              background: "linear-gradient(135deg, #f5e0e0, #e8d8cf)",
              border: "1.5px solid #e8a4a4",
            }}
          >
            🤍
          </div>
          <div>
            <h1
              className="text-[17px] font-medium tracking-[-0.01em]"
              style={{ fontFamily: "'Lora', serif", color: "#3a2a28" }}
            >
              HealingPal
            </h1>
            <p className="mt-0.5 text-xs" style={{ color: "#b09490" }}>
              <span
                className="online-dot mr-1 inline-block h-[7px] w-[7px] rounded-full"
                style={{ background: "#7cc47c" }}
              />
              Here for you, always
            </p>
          </div>
        </header>

        {/* Disclaimer */}
        <div
          className="shrink-0 px-5 py-2.5 text-center text-[11.5px] leading-relaxed"
          style={{
            background: "#f2e8e2",
            borderBottom: "1px solid #e8d8cf",
            color: "#7a5a56",
          }}
        >
          🫂 HealingPal is an AI companion, not a licensed therapist. For
          professional help, please see a counselor.
        </div>

        {/* Messages */}
        <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-5 pb-2 pt-5">
          {messages.map((msg, i) => {
            const content = extractMessageText(msg);
            if (content.trim() === "CRISIS_DETECTED") return null;
            const isLast = i === messages.length - 1;
            const isStreaming = isLast && isLoading && msg.role === "assistant";
            return (
              <ChatMessage
                key={msg.id}
                role={msg.role as "user" | "assistant"}
                content={content}
                isStreaming={isStreaming}
              />
            );
          })}
          {extras.map(
            (ex) => ex.type === "crisis" && <CrisisBanner key={ex.id} />,
          )}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <TypingIndicator />
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          className="shrink-0 px-4 pb-5 pt-3.5"
          style={{ borderTop: "1px solid #e8d8cf", background: "#fffaf8" }}
        >
          <div
            className="flex items-end gap-2.5 rounded-3xl px-4 py-2 transition-colors"
            style={{ background: "#f2e8e2", border: "1.5px solid #e8d8cf" }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKey}
              placeholder="Tell me how you're feeling..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-[14.5px] leading-relaxed outline-none"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                color: "#3a2a28",
                maxHeight: "120px",
                minHeight: "24px",
              }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all active:scale-95 disabled:opacity-40"
              style={{ background: "#e8a4a4", color: "#3a1a1a" }}
              aria-label="Send"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
          <p
            className="mt-2 text-center text-[11px]"
            style={{ color: "#b09490" }}
          >
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

function extractMessageText(message: UIMessage): string {
  const fromParts = message.parts
    .map((part) => {
      if (
        part.type === "text" &&
        "text" in part &&
        typeof part.text === "string"
      ) {
        return part.text;
      }
      return "";
    })
    .join("");

  if (fromParts.trim()) return fromParts;

  if ("content" in message && typeof message.content === "string") {
    return message.content;
  }

  return "";
}
