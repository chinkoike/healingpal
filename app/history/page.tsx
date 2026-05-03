"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAppLanguage } from "@/hooks/useAppLanguage";

interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export default function HistoryPage() {
  const { language } = useAppLanguage();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [startTime] = useState(() => Date.now());
  const t = (th: string, en: string) => (language === "th" ? th : en);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions ?? []))
      .finally(() => setLoadingSessions(false));
  }, []);

  const openSession = async (s: Session) => {
    setSelected(s);
    setLoadingMsgs(true);
    const r = await fetch(`/api/history?session_id=${s.id}`);
    const d = await r.json();
    setMessages(d.messages ?? []);
    setLoadingMsgs(false);
  };

  const deleteSession = async (id: string) => {
    setDeleting(id);
    await fetch(`/api/history?session_id=${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (selected?.id === id) {
      setSelected(null);
      setMessages([]);
    }
    setDeleting(null);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const diffDays = Math.floor((startTime - d.getTime()) / 86400000);
    if (diffDays === 0) return t("วันนี้", "Today");
    if (diffDays === 1) return t("เมื่อวาน", "Yesterday");
    return d.toLocaleDateString(language === "th" ? "th-TH" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(language === "th" ? "th-TH" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div
      className="min-h-screen p-4 sm:p-6"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <a
            href="/chat"
            className="flex h-9 w-9 items-center justify-center rounded-xl hover:opacity-70"
            style={{
              background: "#f2e8e2",
              color: "#7a5a56",
              border: "1px solid #e8d8cf",
            }}
          >
            ←
          </a>
          <div>
            <h1
              className="text-xl font-medium"
              style={{ fontFamily: "'Lora', serif", color: "#3a2a28" }}
            >
              {t("ประวัติการสนทนา", "Chat History")}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "#b09490" }}>
              {sessions.length} {t("การสนทนา", "conversations")}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Session list */}
          <div className="w-64 shrink-0 flex flex-col gap-1.5">
            {loadingSessions && (
              <div
                className="rounded-2xl p-4 text-sm text-center"
                style={{ background: "#f2e8e2", color: "#b09490" }}
              >
                {t("กำลังโหลด...", "Loading...")}
              </div>
            )}
            {!loadingSessions && sessions.length === 0 && (
              <div
                className="rounded-2xl p-6 text-sm text-center"
                style={{ background: "#f2e8e2", color: "#b09490" }}
              >
                <p className="text-2xl mb-2">💭</p>
                <p>{t("ยังไม่มีประวัติการสนทนา", "No conversations yet")}</p>
                <a
                  href="/chat"
                  className="mt-3 inline-block text-xs underline"
                  style={{ color: "#e8a4a4" }}
                >
                  {t("เริ่มคุยเลย →", "Start chatting →")}
                </a>
              </div>
            )}
            {sessions.map((s) => (
              <div key={s.id} className="group relative">
                <button
                  onClick={() => openSession(s)}
                  className="w-full rounded-xl px-3 py-3 text-left hover:opacity-90 transition-opacity"
                  style={{
                    background: selected?.id === s.id ? "#e8a4a4" : "#fffaf8",
                    border: `1px solid ${selected?.id === s.id ? "#c97a7a" : "#e8d8cf"}`,
                  }}
                >
                  <p
                    className="text-xs font-medium truncate pr-5"
                    style={{
                      color: selected?.id === s.id ? "#3a1a1a" : "#3a2a28",
                    }}
                  >
                    {s.title}
                  </p>
                  <p
                    className="text-[10px] mt-0.5"
                    style={{
                      color: selected?.id === s.id ? "#7a3a38" : "#b09490",
                    }}
                  >
                    {formatDate(s.updated_at)}
                  </p>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(s.id);
                  }}
                  disabled={deleting === s.id}
                  className="absolute right-2 top-2.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded text-[10px] hover:opacity-70"
                  style={{ background: "#f5e0e0", color: "#c97a7a" }}
                  title={t("ลบ", "Delete")}
                >
                  {deleting === s.id ? "…" : "✕"}
                </button>
              </div>
            ))}
          </div>

          {/* Message view */}
          <div
            className="flex-1 rounded-2xl overflow-hidden"
            style={{ border: "1px solid #e8d8cf", background: "#fffaf8" }}
          >
            {!selected && (
              <div
                className="flex h-64 items-center justify-center text-sm"
                style={{ color: "#b09490" }}
              >
                <div className="text-center">
                  <p className="text-3xl mb-2">📖</p>
                  <p>
                    {t("เลือกการสนทนาเพื่อดู", "Select a conversation to view")}
                  </p>
                </div>
              </div>
            )}
            {selected && (
              <>
                {/* Session header */}
                <div
                  className="px-4 py-3 flex items-center justify-between"
                  style={{ borderBottom: "1px solid #e8d8cf" }}
                >
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "#3a2a28" }}
                    >
                      {selected.title}
                    </p>
                    <p className="text-xs" style={{ color: "#b09490" }}>
                      {formatDate(selected.created_at)}
                    </p>
                  </div>
                  <a
                    href={`/chat`}
                    className="rounded-lg px-3 py-1.5 text-xs hover:opacity-80"
                    style={{ background: "#e8a4a4", color: "#3a1a1a" }}
                  >
                    {t("ไปที่แชท →", "Open in chat →")}
                  </a>
                </div>

                {/* Messages */}
                <div
                  className="flex flex-col gap-3 overflow-y-auto p-4"
                  style={{ maxHeight: "480px" }}
                >
                  {loadingMsgs && (
                    <div
                      className="text-center text-sm py-6"
                      style={{ color: "#b09490" }}
                    >
                      {t("กำลังโหลด...", "Loading...")}
                    </div>
                  )}
                  {!loadingMsgs &&
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                      >
                        <div
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs"
                          style={{
                            background:
                              "linear-gradient(135deg, #f5e0e0, #e8d8cf)",
                            border: "1px solid #e8a4a4",
                          }}
                        >
                          {m.role === "assistant" ? "🤍" : "🙂"}
                        </div>
                        <div className="max-w-[75%]">
                          <div
                            className="rounded-2xl px-3 py-2 text-sm leading-relaxed"
                            style={
                              m.role === "assistant"
                                ? {
                                    background: "#f2e8e2",
                                    border: "1px solid #e8d8cf",
                                    color: "#3a2a28",
                                    borderBottomLeftRadius: "4px",
                                  }
                                : {
                                    background: "#e8a4a4",
                                    border: "1px solid #c97a7a",
                                    color: "#3a1a1a",
                                    borderBottomRightRadius: "4px",
                                  }
                            }
                          >
                            {m.content.split("\n\n").map((p, i) => (
                              <p key={i} className={i > 0 ? "mt-2" : ""}>
                                {p}
                              </p>
                            ))}
                          </div>
                          <p
                            className={`text-[10px] mt-0.5 ${m.role === "user" ? "text-right" : ""}`}
                            style={{ color: "#b09490" }}
                          >
                            {formatTime(m.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
