"use client";

export const dynamic = "force-dynamic";

import { useChat, UIMessage } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
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
  th: "ดีใจมากเลยที่คุณอยู่ตรงนี้นะ 🤍\n\nไม่ว่าตอนนี้คุณกำลังเจออะไรอยู่ ที่นี่เป็นพื้นที่ปลอดภัย ไม่ตัดสินกัน คุณไม่จำเป็นต้องเข้มแข็งตลอดเวลา แค่อยากคุยก็พอแล้ว\n\nอยากเล่าให้เราฟังไหม ช่วงนี้อะไรที่หนักอยู่ในใจคุณมากที่สุด",
  en: "Hey, I'm really glad you're here. 🤍\n\nWhatever you're going through right now — this is a safe, judgment-free space. You don't have to have it all figured out. You can just... talk.\n\nSo tell me — what's been weighing on your heart lately?",
};

type ExtraItem = { id: string; type: "crisis" | "limit"; used?: number; limit?: number };
interface UsageState { used: number; limit: number; isPro: boolean; canSend: boolean; }
interface Session { id: string; title: string; updated_at: string; }

function makeWelcomeMsg(lang: AppLanguage): UIMessage {
  return { id: "welcome", role: "assistant", parts: [{ type: "text", text: WELCOME[lang] }] } as UIMessage;
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

export default function ChatPage() {
  const supabase = createClient();
  const { language, setLanguage } = useAppLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const extraIdRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);

  const [extras, setExtras] = useState<ExtraItem[]>([]);
  const [input, setInput] = useState("");
  const [usage, setUsage] = useState<UsageState>({ used: 0, limit: 20, isPro: false, canSend: true });
  const [showMood, setShowMood] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [moodDone, setMoodDone] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  /** Local midnight ms for "today" — updated in effect so render stays pure (no Date.now in render). */
  const [todayStartMs, setTodayStartMs] = useState<number | null>(null);

  const { messages, status, sendMessage, setMessages } = useChat<UIMessage>({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    messages: [makeWelcomeMsg(language)],
    onFinish({ message }) {
      const content = extractText(message);
      if (content.trim() === "CRISIS_DETECTED") {
        setMessages((prev) => prev.filter((m) => m.id !== message.id));
        const id = `crisis-${extraIdRef.current++}`;
        setExtras((e) => [...e, { id, type: "crisis" }]);
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${extraIdRef.current++}`,
              role: "assistant",
              parts: [{
                type: "text",
                text: language === "th"
                  ? "เราอยู่ตรงนี้กับคุณนะ คุณไม่ต้องเผชิญเรื่องนี้คนเดียว 🤍 ลองโทรสายด่วนดูนะ"
                  : "I'm still right here with you. You don't have to go through this alone. 🤍 Please reach out to that hotline.",
              }],
            } as UIMessage,
          ]);
        }, 900);
        return;
      }
      void saveMessage("assistant", content);
      setUsage((prev) => ({ ...prev, used: prev.used + 1, canSend: prev.isPro || prev.used + 1 < prev.limit }));
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  async function loadSession(sessionId: string, closeSidebar = true) {
    const res = await fetch(`/api/history?session_id=${sessionId}`);
    if (!res.ok) return;
    const data = await res.json();
    const dbMsgs: { id: string; role: string; content: string }[] = data.messages ?? [];
    if (dbMsgs.length === 0) return;

    sessionIdRef.current = sessionId;
    setActiveSessionId(sessionId);
    setExtras([]);
    setMessages(dbMsgs.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      parts: [{ type: "text" as const, text: m.content }],
    })));
    if (closeSidebar) setShowSidebar(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  async function saveMessage(role: "user" | "assistant", content: string) {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionIdRef.current, role, content }),
      });
      if (res.ok) {
        const d = await res.json();
        if (!sessionIdRef.current) {
          sessionIdRef.current = d.session_id;
          setActiveSessionId(d.session_id);
          const sRes = await fetch("/api/history");
          if (sRes.ok) setSessions((await sRes.json()).sessions ?? []);
        }
      }
    } finally {
      isSavingRef.current = false;
    }
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email ?? "");

      const [usageRes, moodRes, sessRes] = await Promise.all([
        fetch("/api/usage"),
        fetch("/api/mood"),
        fetch("/api/history"),
      ]);

      if (usageRes.ok) {
        const d = await usageRes.json();
        setUsage({ used: d.used, limit: d.limit, isPro: d.is_pro, canSend: d.can_send });
      }
      if (moodRes.ok) {
        const md = await moodRes.json();
        if (!md.todayDone) setTimeout(() => setShowMood(true), 1500);
        else setMoodDone(true);
      }
      if (sessRes.ok) {
        const sd = await sessRes.json();
        const list: Session[] = sd.sessions ?? [];
        setSessions(list);
        if (list.length > 0) await loadSession(list[0].id, false);
      }
      setHistoryLoading(false);
    };
    void init();
    // Mount-only bootstrap; loadSession from first paint uses stable setMessages from useChat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startNewChat() {
    sessionIdRef.current = null;
    setActiveSessionId(null);
    setExtras([]);
    setMessages([makeWelcomeMsg(language)]);
    setShowSidebar(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const switchLanguage = (next: AppLanguage) => {
    if (next === language) return;
    setLanguage(next);
    if (!sessionIdRef.current) {
      setMessages([makeWelcomeMsg(next)]);
      setExtras([]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, extras, showMood]);

  useEffect(() => {
    const bump = () => {
      const n = new Date();
      n.setHours(0, 0, 0, 0);
      setTodayStartMs(n.getTime());
    };
    bump();
    const id = setInterval(bump, 60_000);
    return () => clearInterval(id);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    if (!usage.canSend) {
      setExtras((e) => [...e, { id: `limit-${extraIdRef.current++}`, type: "limit", used: usage.used, limit: usage.limit }]);
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

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    d.setHours(0, 0, 0, 0);
    if (todayStartMs == null) {
      return d.toLocaleDateString(language === "th" ? "th-TH" : "en-US", { day: "numeric", month: "short" });
    }
    const diffDays = Math.floor((todayStartMs - d.getTime()) / 86400000);
    if (diffDays === 0) return language === "th" ? "วันนี้" : "Today";
    if (diffDays === 1) return language === "th" ? "เมื่อวาน" : "Yesterday";
    return d.toLocaleDateString(language === "th" ? "th-TH" : "en-US", { day: "numeric", month: "short" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-0 sm:p-6">
      <div className="relative flex w-full max-w-[640px] flex-col overflow-hidden rounded-none sm:rounded-[20px]"
        style={{ height: "100dvh", maxHeight: "820px", background: "#fffaf8", boxShadow: "0 0 60px rgba(180,120,110,0.13)" }}>

        {/* ── Sidebar ─────────────────────────────────────────── */}
        {showSidebar && (
          <div className="absolute inset-0 z-20 flex" style={{ background: "rgba(58,42,40,0.35)" }}
            onClick={() => setShowSidebar(false)}>
            <div className="flex flex-col h-full w-72 overflow-hidden"
              style={{ background: "#fffaf8", borderRight: "1px solid #e8d8cf" }}
              onClick={(e) => e.stopPropagation()}>

              <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: "1px solid #e8d8cf" }}>
                <span className="text-sm font-medium" style={{ fontFamily: "'Lora', serif", color: "#3a2a28" }}>
                  {language === "th" ? "แชทของฉัน" : "My Chats"}
                </span>
                <button onClick={() => setShowSidebar(false)} className="text-sm" style={{ color: "#b09490" }}>✕</button>
              </div>

              <button onClick={startNewChat}
                className="mx-3 mt-3 mb-1 rounded-xl py-2.5 text-sm font-medium hover:opacity-80 transition-opacity"
                style={{ background: "#e8a4a4", color: "#3a1a1a" }}>
                + {language === "th" ? "แชทใหม่" : "New chat"}
              </button>

              <div className="flex gap-1.5 px-3 py-2">
                <a href="/mood"
                  className="flex-1 rounded-xl py-2 text-xs text-center hover:opacity-80"
                  style={{ background: "#f2e8e2", color: "#7a5a56", border: "1px solid #e8d8cf" }}>
                  {language === "th" ? "📊 อารมณ์" : "📊 Mood"}
                </a>
                <a href="/history"
                  className="flex-1 rounded-xl py-2 text-xs text-center hover:opacity-80"
                  style={{ background: "#f2e8e2", color: "#7a5a56", border: "1px solid #e8d8cf" }}>
                  {language === "th" ? "📖 ประวัติ" : "📖 History"}
                </a>
              </div>

              <div className="flex-1 overflow-y-auto px-2 pb-2">
                {sessions.length === 0 && !historyLoading && (
                  <p className="px-3 py-6 text-xs text-center" style={{ color: "#b09490" }}>
                    {language === "th" ? "ยังไม่มีแชท" : "No chats yet"}
                  </p>
                )}
                {sessions.map((s) => (
                  <button key={s.id} onClick={() => loadSession(s.id)}
                    className="w-full rounded-xl px-3 py-2.5 text-left mb-0.5 transition-colors"
                    style={{
                      background: activeSessionId === s.id ? "#f2e8e2" : "transparent",
                      border: `1px solid ${activeSessionId === s.id ? "#e8d8cf" : "transparent"}`,
                    }}>
                    <p className="text-xs font-medium truncate" style={{ color: "#3a2a28" }}>{s.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#b09490" }}>{formatDate(s.updated_at)}</p>
                  </button>
                ))}
              </div>

              <button onClick={handleSignOut}
                className="mx-3 mb-4 rounded-xl py-2 text-xs hover:opacity-80"
                style={{ color: "#b09490", border: "1px solid #e8d8cf" }}>
                {language === "th" ? "ออกจากระบบ" : "Sign out"}
              </button>
            </div>
          </div>
        )}

        {/* ── Header ──────────────────────────────────────────── */}
        <header className="flex shrink-0 items-center gap-2.5 px-4 py-3"
          style={{ borderBottom: "1px solid #e8d8cf", background: "#fffaf8" }}>
          <button onClick={() => setShowSidebar(true)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:opacity-70"
            style={{ background: "#f2e8e2", color: "#7a5a56" }}>
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </button>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
            style={{ background: "linear-gradient(135deg, #f5e0e0, #e8d8cf)", border: "1.5px solid #e8a4a4" }}>
            🤍
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-medium" style={{ fontFamily: "'Lora', serif", color: "#3a2a28" }}>HealingPal</h1>
            <p className="text-[10px] truncate" style={{ color: "#b09490" }}>
              <span className="online-dot mr-1 inline-block h-[5px] w-[5px] rounded-full" style={{ background: "#7cc47c" }} />
              {userEmail || (language === "th" ? "อยู่ตรงนี้เพื่อคุณเสมอ" : "Here for you, always")}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid #e8d8cf" }}>
              {(["th", "en"] as AppLanguage[]).map((lang) => (
                <button key={lang} onClick={() => switchLanguage(lang)}
                  className="px-2 py-1 text-[11px] font-medium"
                  style={{ background: language === lang ? "#f2e8e2" : "transparent", color: "#7a5a56" }}>
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
            {!moodDone && (
              <button onClick={() => setShowMood(true)}
                className="rounded-lg px-2 py-1 text-[11px] hover:opacity-80"
                style={{ background: "#f2e8e2", color: "#7a5a56", border: "1px solid #e8d8cf" }}>
                🌸
              </button>
            )}
          </div>
        </header>

        {/* Usage bar */}
        <UsageBar used={usage.used} limit={usage.limit} isPro={usage.isPro} language={language} />

        {/* Loading indicator */}
        {historyLoading && (
          <div className="flex items-center justify-center gap-1.5 py-1.5 text-xs" style={{ color: "#b09490", background: "#f9f3ef" }}>
            <span>🤍</span>
            <span>{language === "th" ? "กำลังโหลดแชทล่าสุด..." : "Loading your last chat..."}</span>
          </div>
        )}

        {/* ── Messages ─────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-5 pb-2 pt-5">
          {messages.map((msg, i) => {
            const content = extractText(msg);
            if (content.trim() === "CRISIS_DETECTED") return null;
            const isLast = i === messages.length - 1;
            const isStreaming = isLast && isLoading && msg.role === "assistant";
            return <ChatMessage key={msg.id} role={msg.role as "user" | "assistant"} content={content} isStreaming={isStreaming} />;
          })}
          {extras.map((ex) => {
            if (ex.type === "crisis") return <CrisisBanner key={ex.id} language={language} />;
            if (ex.type === "limit") return <LimitBanner key={ex.id} limit={ex.limit!} language={language} />;
          })}
          {showMood && <MoodCheckIn language={language} onClose={() => setShowMood(false)} onSaved={() => setMoodDone(true)} />}
          {isLoading && messages[messages.length - 1]?.role === "user" && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input ────────────────────────────────────────────── */}
        <div className="shrink-0 px-4 pb-5 pt-3" style={{ borderTop: "1px solid #e8d8cf", background: "#fffaf8" }}>
          <div className="flex items-end gap-2.5 rounded-3xl px-4 py-2"
            style={{ background: "#f2e8e2", border: `1.5px solid ${usage.canSend ? "#e8d8cf" : "#e8a4a4"}` }}>
            <textarea ref={inputRef} value={input} onChange={handleInput} onKeyDown={handleKey} rows={1}
              placeholder={usage.canSend
                ? language === "th" ? "เล่าให้ฟังได้เลย..." : "Tell me how you're feeling..."
                : language === "th" ? "ครบลิมิตรายวันแล้ว..." : "Daily limit reached..."}
              className="flex-1 resize-none bg-transparent text-[14.5px] leading-relaxed outline-none"
              style={{ fontFamily: "'DM Sans', sans-serif", color: "#3a2a28", maxHeight: "120px", minHeight: "24px" }} />
            <button onClick={handleSend} disabled={isLoading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all active:scale-95 disabled:opacity-40"
              style={{ background: "#e8a4a4", color: "#3a1a1a" }}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px]" style={{ color: "#b09490" }}>
            {language === "th" ? "Enter ส่ง · Shift+Enter ขึ้นบรรทัด" : "Enter to send · Shift+Enter new line"}
          </p>
        </div>
      </div>
    </div>
  );
}
