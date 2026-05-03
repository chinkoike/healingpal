"use client";

import { useState } from "react";

const MOOD_LABELS: Record<
  number,
  { label: { th: string; en: string }; emoji: string; color: string }
> = {
  1: { label: { th: "สลาย", en: "Devastated" }, emoji: "💔", color: "#c97a7a" },
  2: {
    label: { th: "เจ็บมาก", en: "Really hurt" },
    emoji: "😢",
    color: "#d4836e",
  },
  3: { label: { th: "ต่ำมาก", en: "Very low" }, emoji: "😔", color: "#c9956a" },
  4: { label: { th: "หดหู่", en: "Down" }, emoji: "😞", color: "#c9a96a" },
  5: {
    label: { th: "ยังสู้อยู่", en: "Struggling" },
    emoji: "😕",
    color: "#b5a870",
  },
  6: { label: { th: "พอได้", en: "Okay-ish" }, emoji: "😐", color: "#8aaa72" },
  7: {
    label: { th: "ดีขึ้นหน่อย", en: "A bit better" },
    emoji: "🙂",
    color: "#72aa85",
  },
  8: {
    label: { th: "กำลังฟื้น", en: "Healing" },
    emoji: "😊",
    color: "#70a898",
  },
  9: { label: { th: "ดี", en: "Good" }, emoji: "😌", color: "#70909a" },
  10: {
    label: { th: "มีความหวัง", en: "Hopeful" },
    emoji: "✨",
    color: "#7890c0",
  },
};

interface Props {
  onClose: () => void;
  onSaved: (score: number) => void;
  language?: "th" | "en";
}

export default function MoodCheckIn({
  onClose,
  onSaved,
  language = "th",
}: Props) {
  const [score, setScore] = useState(5);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const t = (th: string, en: string) => (language === "th" ? th : en);
  const mood = MOOD_LABELS[score];

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, note }),
      });
      setDone(true);
      onSaved(score);
      setTimeout(onClose, 1800);
    } catch {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div
        className="msg-enter rounded-2xl p-5 text-center"
        style={{ background: "#f2e8e2", border: "1px solid #e8d8cf" }}
      >
        <p className="text-2xl mb-1">{mood.emoji}</p>
        <p className="text-sm font-medium" style={{ color: "#3a2a28" }}>
          {t("บันทึกแล้ว 🤍", "Mood saved 🤍")}
        </p>
        <p className="text-xs mt-1" style={{ color: "#7a5a56" }}>
          {t("ขอบคุณที่เช็กอินวันนี้นะ", "Thanks for checking in today.")}
        </p>
      </div>
    );
  }

  return (
    <div
      className="msg-enter rounded-2xl p-5"
      style={{ background: "#f2e8e2", border: "1px solid #e8d8cf" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: "#3a2a28" }}>
          {t("วันนี้รู้สึกยังไงบ้าง?", "How are you feeling today?")}
        </p>
        <button
          onClick={onClose}
          className="text-xs"
          style={{ color: "#b09490" }}
        >
          {t("ข้าม", "Skip")}
        </button>
      </div>
      <div className="mb-4 text-center">
        <span className="text-3xl">{mood.emoji}</span>
        <p className="mt-1 text-sm font-medium" style={{ color: mood.color }}>
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
          "Anything on your mind? (optional)",
        )}
        rows={2}
        className="w-full resize-none rounded-xl px-3 py-2 text-xs outline-none mb-3"
        style={{
          background: "#fffaf8",
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
          ? t("กำลังบันทึก...", "Saving…")
          : t("บันทึก 🤍", "Save check-in 🤍")}
      </button>
    </div>
  );
}
