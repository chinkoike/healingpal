"use client";

export const dynamic = "force-dynamic";

import { useChat, UIMessage } from "@ai-sdk/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { DefaultChatTransport } from "ai";
import { createClient } from "@/lib/supabase/client";
import ChatMessage from "@/components/ChatMessage";
import CrisisBanner from "@/components/CrisisBanner";
import TypingIndicator from "@/components/TypingIndicator";
import MoodCheckIn from "@/components/MoodCheckIn";
import LimitBanner from "@/components/LimitBanner";
import UsageBar from "@/components/UsageBar";
import { useAppLanguage } from "@/hooks/useAppLanguage";
import { AppLanguage } from "@/lib/i18n";

const WELCOME: Record<AppLanguage, string> = {
  th: `ดีใจมากเลยที่คุณอยู่ตรงนี้นะ 🤍

ไม่ว่าตอนนี้คุณกำลังเจออะไรอยู่ ที่นี่เป็นพื้นที่ปลอดภัย ไม่ตัดสินกัน คุณไม่จำเป็นต้องเข้มแข็งตลอดเวลา แค่อยากคุยก็พอแล้ว

อยากเล่าให้เราฟังไหม ช่วงนี้อะไรที่หนักอยู่ในใจคุณมากที่สุด`,
  en: `Hey, I'm really glad you're here. 🤍

Whatever you're going through right now — this is a safe, judgment-free space. You don't have to have it all figured out. You can just... talk.

So tell me — what's been weighing on your heart lately?`,
};

type ExtraItem = { id: string; type: "crisis" | "limit"; used?: number; limit?: number };

interface UsageState { used: number; limit: number; isPro: boolean; canSend: boolean; }

export default function ChatPage() {
  const supabase = createClient();
  const { language, setLanguage } = useAppLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const extraIdRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);

  const [extras, setExtras] = useState<ExtraItem[]>([]);
  const [input, setInput] = useState("");
  const [usage, setUsage] = useState<UsageState>({ used: 0, limit: 20, isPro: false, canSend: true });
  const [showMood, setShowMood] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [moodDone, setMoodDone] = useState(false);

  // Load user + usage on mount
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email ?? "");

      // Fetch usage
      const res = await fetch("/api/usage");
      if (res.ok) {
        const data = await res.json();
        setUsage({ used: data.used, limit: data.limit, isPro: data.is_pro, canSend: data.can_send });
      }

      // Check if mood check-in done today
      const moodRes = await fetch("/api/mood");
      if (moodRes.ok) {
        const moodData = await moodRes.json();
        if (!moodData.todayDone) {
          setTimeout(() => setShowMood(true), 1500);
        } else {
          setMoodDone(true);
        }
      }
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveMessage = useCallback(async (role: "user" | "assistant", content: string) => {
    const res = await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionIdRef.current, role, content }),
    });
    if (res.ok) {
      const data = await res.json();
      if (!sessionIdRef.current) sessionIdRef.current = data.session_id;
    }
  }, []);

  const { messages, status, sendMessage, setMessages } = useChat<UIMessage>({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    messages: [{
      id: "welcome",
      role: "assistant",
      parts: [{ type: "text", text: WELCOME[language] }],
    }] as UIMessage[],
    onFinish({ message }) {
      const content = extractText(message);
      if (content.trim() === "CRISIS_DETECTED") {
        setMessages((prev) => prev.filter((m) => m.id !== message.id));
        const id = `crisis-${extraIdRef.current++}`;
        setExtras((e) => [...e, { id, type: "crisis" }]);
        setTimeout(() => {
          setMessages((prev) => [...prev, {
            id: `ai-${extraIdRef.current++}`,
            role: "assistant",
            parts: [{
              type: "text",
              text:
                language === "th"
                  ? "เราอยู่ตรงนี้กับคุณนะ คุณไม่ต้องเผชิญเรื่องนี้คนเดียว 🤍 ลองโทรสายด่วนดูนะ เขาพร้อมรับฟังและช่วยเหลือได้มากกว่าที่เราทำได้"
                  : "I'm still right here with you. You don't have to go through this alone. 🤍 Please reach out to that hotline — they're really good at listening, and they can support you in ways I can't.",
            }],
          } as UIMessage]);
        }, 900);
        return;
      }
      // Save AI response to history
      void saveMessage("assistant", content);
      // Update usage
      setUsage((prev) => ({ ...prev, used: prev.used + 1, canSend: prev.isPro || prev.used + 1 < prev.limit }));
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  const switchLanguage = (nextLanguage: AppLanguage) => {
    if (nextLanguage === language) return;
    setLanguage(nextLanguage);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        parts: [{ type: "text", text: WELCOME[nextLanguage] }],
      } as UIMessage,
    ]);
    setExtras([]);
    sessionIdRef.current = null;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, extras, showMood]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    if (!usage.canSend) {
      const id = `limit-${extraIdRef.current++}`;
      setExtras((e) => [...e, { id, type: "limit", used: usage.used, limit: usage.limit }]);
      return;
    }

    void saveMessage("user", text);
    void sendMessage({ text });
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-0 sm:p-6">
      <div className="flex w-full max-w-[640px] flex-col overflow-hidden rounded-none sm:rounded-[20px]"
        style={{ height: "100dvh", maxHeight: "820px", background: "#fffaf8", boxShadow: "0 0 60px rgba(180,120,110,0.13)" }}>

        {/* Header */}
        <header className="flex shrink-0 items-center gap-3 px-5 py-3.5"
          style={{ borderBottom: "1px solid #e8d8cf", background: "#fffaf8" }}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
            style={{ background: "linear-gradient(135deg, #f5e0e0, #e8d8cf)", border: "1.5px solid #e8a4a4" }}>
            🤍
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[16px] font-medium tracking-[-0.01em]"
              style={{ fontFamily: "'Lora', serif", color: "#3a2a28" }}>HealingPal</h1>
            <p className="text-xs truncate" style={{ color: "#b09490" }}>
              <span className="online-dot mr-1 inline-block h-[6px] w-[6px] rounded-full" style={{ background: "#7cc47c" }} />
              {userEmail || (language === "th" ? "อยู่ตรงนี้เพื่อคุณเสมอ" : "Here for you, always")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border" style={{ borderColor: "#e8d8cf" }}>
              <button
                onClick={() => switchLanguage("th")}
                className="px-2.5 py-1 text-xs"
                style={{ background: language === "th" ? "#f2e8e2" : "transparent", color: "#7a5a56" }}
              >
                TH
              </button>
              <button
                onClick={() => switchLanguage("en")}
                className="px-2.5 py-1 text-xs"
                style={{ background: language === "en" ? "#f2e8e2" : "transparent", color: "#7a5a56" }}
              >
                EN
              </button>
            </div>
            {!moodDone && (
              <button onClick={() => setShowMood(true)}
                className="rounded-xl px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                style={{ background: "#f2e8e2", color: "#7a5a56", border: "1px solid #e8d8cf" }}>
                {language === "th" ? "เช็กอิน 🌸" : "Check-in 🌸"}
              </button>
            )}
            <button onClick={handleSignOut}
              className="rounded-xl px-3 py-1.5 text-xs transition-opacity hover:opacity-80"
              style={{ color: "#b09490" }}>
              {language === "th" ? "ออกจากระบบ" : "Sign out"}
            </button>
          </div>
        </header>

        {/* Usage bar */}
        <UsageBar used={usage.used} limit={usage.limit} isPro={usage.isPro} language={language} />

        {/* Messages */}
        <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-5 pb-2 pt-5">
          {messages.map((msg, i) => {
            const content = extractText(msg);
            if (content.trim() === "CRISIS_DETECTED") return null;
            const isLast = i === messages.length - 1;
            const isStreaming = isLast && isLoading && msg.role === "assistant";
            return (
              <ChatMessage key={msg.id} role={msg.role as "user" | "assistant"}
                content={content} isStreaming={isStreaming} />
            );
          })}

          {/* Extras: crisis banners, limit banners */}
          {extras.map((ex) => {
            if (ex.type === "crisis") return <CrisisBanner key={ex.id} language={language} />;
            if (ex.type === "limit") return <LimitBanner key={ex.id} limit={ex.limit!} language={language} />;
          })}

          {/* Mood check-in card */}
          {showMood && (
            <MoodCheckIn
              language={language}
              onClose={() => setShowMood(false)}
              onSaved={() => setMoodDone(true)}
            />
          )}

          {isLoading && messages[messages.length - 1]?.role === "user" && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 px-4 pb-5 pt-3.5"
          style={{ borderTop: "1px solid #e8d8cf", background: "#fffaf8" }}>
          <div className="flex items-end gap-2.5 rounded-3xl px-4 py-2"
            style={{ background: "#f2e8e2", border: `1.5px solid ${usage.canSend ? "#e8d8cf" : "#e8a4a4"}` }}>
            <textarea ref={inputRef} value={input} onChange={handleInput} onKeyDown={handleKey}
              placeholder={usage.canSend
                ? language === "th"
                  ? "เล่าให้ฟังได้เลยว่าคุณรู้สึกยังไง..."
                  : "Tell me how you're feeling..."
                : language === "th"
                  ? "ครบลิมิตรายวันแล้ว — อัปเกรดเพื่อคุยไม่จำกัด 🤍"
                  : "Daily limit reached — upgrade for unlimited 🤍"}
              rows={1} disabled={!usage.canSend && false}
              className="flex-1 resize-none bg-transparent text-[14.5px] leading-relaxed outline-none"
              style={{ fontFamily: "'DM Sans', sans-serif", color: "#3a2a28", maxHeight: "120px", minHeight: "24px" }} />
            <button onClick={handleSend} disabled={isLoading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all active:scale-95 disabled:opacity-40"
              style={{ background: "#e8a4a4", color: "#3a1a1a" }} aria-label={language === "th" ? "ส่ง" : "Send"}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-center text-[11px]" style={{ color: "#b09490" }}>
            {language === "th"
              ? "กด Enter เพื่อส่ง · Shift+Enter ขึ้นบรรทัดใหม่ · 🫂 AI companion ไม่ใช่นักบำบัด"
              : "Enter to send · Shift+Enter for new line · 🫂 AI companion, not a therapist"}
          </p>
        </div>
      </div>
    </div>
  );
}

function extractText(msg: UIMessage): string {
  if (Array.isArray(msg.parts)) {
    return msg.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");
  }
  return (msg as unknown as { content?: string }).content ?? "";
}
