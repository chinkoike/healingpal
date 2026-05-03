"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAppLanguage } from "@/hooks/useAppLanguage";

interface Checkin {
  score: number;
  note: string | null;
  date: string;
}

const MOOD_META: Record<
  number,
  {
    emoji: string;
    label: { th: string; en: string };
    color: string;
    bg: string;
  }
> = {
  1: {
    emoji: "💔",
    label: { th: "สลาย", en: "Devastated" },
    color: "#c97a7a",
    bg: "#fdf0f0",
  },
  2: {
    emoji: "😢",
    label: { th: "เจ็บมาก", en: "Really hurt" },
    color: "#d4836e",
    bg: "#fdf2ee",
  },
  3: {
    emoji: "😔",
    label: { th: "ต่ำมาก", en: "Very low" },
    color: "#c9956a",
    bg: "#fdf4ee",
  },
  4: {
    emoji: "😞",
    label: { th: "หดหู่", en: "Down" },
    color: "#c9a96a",
    bg: "#fdf6ee",
  },
  5: {
    emoji: "😕",
    label: { th: "ยังสู้อยู่", en: "Struggling" },
    color: "#b5a870",
    bg: "#fdfaee",
  },
  6: {
    emoji: "😐",
    label: { th: "พอได้", en: "Okay-ish" },
    color: "#8aaa72",
    bg: "#f3faf0",
  },
  7: {
    emoji: "🙂",
    label: { th: "ดีขึ้นหน่อย", en: "A bit better" },
    color: "#72aa85",
    bg: "#eef8f2",
  },
  8: {
    emoji: "😊",
    label: { th: "กำลังฟื้น", en: "Healing" },
    color: "#70a898",
    bg: "#eef7f5",
  },
  9: {
    emoji: "😌",
    label: { th: "ดี", en: "Good" },
    color: "#70909a",
    bg: "#eef3f7",
  },
  10: {
    emoji: "✨",
    label: { th: "มีความหวัง", en: "Hopeful" },
    color: "#7890c0",
    bg: "#eef1fb",
  },
};

export default function MoodPage() {
  const { language } = useAppLanguage();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayDone, setTodayDone] = useState(false);
  const [score, setScore] = useState(5);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [startTime] = useState(() => Date.now());

  const t = (th: string, en: string) => (language === "th" ? th : en);

  useEffect(() => {
    fetch("/api/mood")
      .then((r) => r.json())
      .then((d) => {
        setCheckins(d.checkins ?? []);
        setTodayDone(d.todayDone ?? false);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const r = await fetch("/api/mood", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, note }),
    });
    if (r.ok) {
      setSaved(true);
      setTodayDone(true);
      const today = new Date().toISOString().split("T")[0];
      setCheckins((prev) => {
        const filtered = prev.filter((c) => c.date !== today);
        return [{ score, note, date: today }, ...filtered];
      });
    }
    setSaving(false);
  };

  const avg =
    checkins.length > 0
      ? (checkins.reduce((s, c) => s + c.score, 0) / checkins.length).toFixed(1)
      : "—";

  const trend =
    checkins.length >= 2 ? checkins[0].score - checkins[1].score : 0;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const diffDays = Math.floor((startTime - d.getTime()) / 86400000);
    if (diffDays === 0) return t("วันนี้", "Today");
    if (diffDays === 1) return t("เมื่อวาน", "Yesterday");
    return d.toLocaleDateString(language === "th" ? "th-TH" : "en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const mood = MOOD_META[score];

  return (
    <div
      className="min-h-screen p-4 sm:p-6"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="mx-auto max-w-lg">
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
              {t("ติดตามอารมณ์", "Mood Tracker")}
            </h1>
            <p className="text-xs" style={{ color: "#b09490" }}>
              {t("บันทึกความรู้สึกของคุณทุกวัน", "Track how you feel each day")}
            </p>
          </div>
        </div>

        {/* Stats row */}
        {checkins.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div
              className="rounded-2xl p-3 text-center"
              style={{ background: "#fffaf8", border: "1px solid #e8d8cf" }}
            >
              <p className="text-2xl font-medium" style={{ color: "#3a2a28" }}>
                {avg}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#b09490" }}>
                {t("เฉลี่ย", "Average")}
              </p>
            </div>
            <div
              className="rounded-2xl p-3 text-center"
              style={{ background: "#fffaf8", border: "1px solid #e8d8cf" }}
            >
              <p
                className="text-2xl font-medium"
                style={{
                  color:
                    trend > 0 ? "#72aa85" : trend < 0 ? "#c97a7a" : "#b09490",
                }}
              >
                {trend > 0 ? "↑" : trend < 0 ? "↓" : "→"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#b09490" }}>
                {t("แนวโน้ม", "Trend")}
              </p>
            </div>
            <div
              className="rounded-2xl p-3 text-center"
              style={{ background: "#fffaf8", border: "1px solid #e8d8cf" }}
            >
              <p className="text-2xl font-medium" style={{ color: "#3a2a28" }}>
                {checkins.length}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#b09490" }}>
                {t("วันที่บันทึก", "Days logged")}
              </p>
            </div>
          </div>
        )}

        {/* Mini chart (last 14 days) */}
        {checkins.length > 1 && (
          <div
            className="rounded-2xl p-4 mb-5"
            style={{ background: "#fffaf8", border: "1px solid #e8d8cf" }}
          >
            <p
              className="text-xs font-medium mb-3"
              style={{ color: "#7a5a56" }}
            >
              {t("14 วันที่ผ่านมา", "Last 14 days")}
            </p>
            <div className="flex items-end gap-1.5 h-16">
              {[...checkins]
                .reverse()
                .slice(0, 14)
                .map((c, i) => {
                  const m = MOOD_META[c.score];
                  const heightPct = (c.score / 10) * 100;
                  return (
                    <div
                      key={i}
                      className="flex flex-col items-center gap-1 flex-1"
                      title={`${c.date}: ${c.score}/10`}
                    >
                      <div
                        className="w-full rounded-sm transition-all"
                        style={{
                          height: `${heightPct}%`,
                          background: m.color,
                          minHeight: "4px",
                        }}
                      />
                      <span className="text-[8px]" style={{ color: "#b09490" }}>
                        {new Date(c.date + "T00:00:00").getDate()}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Today's check-in */}
        <div
          className="rounded-2xl p-5 mb-5"
          style={{ background: "#fffaf8", border: "1px solid #e8d8cf" }}
        >
          {saved || todayDone ? (
            <div className="text-center py-2">
              <p className="text-3xl mb-1">
                {MOOD_META[checkins[0]?.score ?? score].emoji}
              </p>
              <p className="text-sm font-medium" style={{ color: "#3a2a28" }}>
                {t("บันทึกแล้ววันนี้ 🤍", "Logged for today 🤍")}
              </p>
              <p className="text-xs mt-1" style={{ color: "#b09490" }}>
                {t("คะแนน:", "Score:")} {checkins[0]?.score ?? score}/10 —{" "}
                {MOOD_META[checkins[0]?.score ?? score].label[language]}
              </p>
              {checkins[0]?.note && (
                <p className="text-xs mt-2 italic" style={{ color: "#7a5a56" }}>
                  &quot;{checkins[0].note}&quot;
                </p>
              )}
              {!saved && (
                <button
                  onClick={() => {
                    setTodayDone(false);
                    setSaved(false);
                  }}
                  className="mt-3 text-xs underline"
                  style={{ color: "#b09490" }}
                >
                  {t("แก้ไข", "Edit")}
                </button>
              )}
            </div>
          ) : (
            <>
              <p
                className="text-sm font-medium mb-4"
                style={{ color: "#3a2a28" }}
              >
                {t("วันนี้รู้สึกยังไงบ้าง?", "How are you feeling today?")}
              </p>
              <div className="text-center mb-4">
                <p className="text-4xl mb-1">{mood.emoji}</p>
                <p
                  className="text-sm font-medium"
                  style={{ color: mood.color }}
                >
                  {mood.label[language]}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#b09490" }}>
                  {score} / 10
                </p>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={score}
                onChange={(e) => setScore(parseInt(e.target.value))}
                className="w-full mb-1"
                style={{ accentColor: mood.color }}
              />
              <div
                className="flex justify-between text-xs mb-4"
                style={{ color: "#b09490" }}
              >
                <span>💔</span>
                <span>✨</span>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t(
                  "บันทึกความรู้สึก... (ไม่บังคับ)",
                  "How's your heart? (optional)",
                )}
                rows={2}
                className="w-full resize-none rounded-xl px-3 py-2 text-sm outline-none mb-3"
                style={{
                  background: "#f2e8e2",
                  border: "1px solid #e8d8cf",
                  color: "#3a2a28",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-2xl py-2.5 text-sm font-medium hover:opacity-80 disabled:opacity-40"
                style={{ background: "#e8a4a4", color: "#3a1a1a" }}
              >
                {saving
                  ? t("กำลังบันทึก...", "Saving...")
                  : t("บันทึก 🤍", "Save 🤍")}
              </button>
            </>
          )}
        </div>

        {/* History list */}
        {checkins.length > 0 && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid #e8d8cf" }}
          >
            <div
              className="px-4 py-3"
              style={{
                background: "#f2e8e2",
                borderBottom: "1px solid #e8d8cf",
              }}
            >
              <p className="text-xs font-medium" style={{ color: "#7a5a56" }}>
                {t("ประวัติที่ผ่านมา", "Past check-ins")}
              </p>
            </div>
            {checkins.map((c, i) => {
              const m = MOOD_META[c.score];
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    borderBottom:
                      i < checkins.length - 1 ? "1px solid #f2e8e2" : "none",
                    background: m.bg,
                  }}
                >
                  <span className="text-xl">{m.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-medium"
                        style={{ color: m.color }}
                      >
                        {c.score}/10
                      </span>
                      <span className="text-xs" style={{ color: "#7a5a56" }}>
                        {m.label[language]}
                      </span>
                    </div>
                    {c.note && (
                      <p
                        className="text-xs truncate mt-0.5 italic"
                        style={{ color: "#7a5a56" }}
                      >
                        {c.note}
                      </p>
                    )}
                  </div>
                  <span
                    className="text-xs shrink-0"
                    style={{ color: "#b09490" }}
                  >
                    {formatDate(c.date)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {!loading && checkins.length === 0 && !todayDone && (
          <p className="text-center text-sm py-4" style={{ color: "#b09490" }}>
            {t(
              "เริ่มบันทึกวันแรกของคุณเลย 🌸",
              "Start logging your first day 🌸",
            )}
          </p>
        )}
      </div>
    </div>
  );
}
