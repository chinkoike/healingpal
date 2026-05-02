"use client";

import { useState } from "react";
import { AppLanguage } from "@/lib/i18n";

const MOOD_LABELS: Record<AppLanguage, Record<number, { label: string; emoji: string; color: string }>> = {
  th: {
    1: { label: "ใจสลายมาก", emoji: "💔", color: "#c97a7a" },
    2: { label: "เจ็บมาก", emoji: "😢", color: "#d4836e" },
    3: { label: "ดาวน์มาก", emoji: "😔", color: "#c9956a" },
    4: { label: "รู้สึกแย่", emoji: "😞", color: "#c9a96a" },
    5: { label: "กำลังพยายามอยู่", emoji: "😕", color: "#b5a870" },
    6: { label: "พอไหว", emoji: "😐", color: "#8aaa72" },
    7: { label: "ดีขึ้นนิดหน่อย", emoji: "🙂", color: "#72aa85" },
    8: { label: "เริ่มเยียวยา", emoji: "😊", color: "#70a898" },
    9: { label: "รู้สึกดี", emoji: "😌", color: "#70909a" },
    10: { label: "มีความหวัง", emoji: "✨", color: "#7890c0" },
  },
  en: {
    1: { label: "Devastated", emoji: "💔", color: "#c97a7a" },
    2: { label: "Really hurt", emoji: "😢", color: "#d4836e" },
    3: { label: "Very low", emoji: "😔", color: "#c9956a" },
    4: { label: "Down", emoji: "😞", color: "#c9a96a" },
    5: { label: "Struggling", emoji: "😕", color: "#b5a870" },
    6: { label: "Okay-ish", emoji: "😐", color: "#8aaa72" },
    7: { label: "A bit better", emoji: "🙂", color: "#72aa85" },
    8: { label: "Healing", emoji: "😊", color: "#70a898" },
    9: { label: "Good", emoji: "😌", color: "#70909a" },
    10: { label: "Hopeful", emoji: "✨", color: "#7890c0" },
  },
};

interface Props {
  language: AppLanguage;
  onClose: () => void;
  onSaved: (score: number) => void;
}

export default function MoodCheckIn({ language, onClose, onSaved }: Props) {
  const [score, setScore] = useState(5);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const mood = MOOD_LABELS[language][score];

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
      <div className="msg-enter rounded-2xl p-5 text-center" style={{ background: "#f2e8e2", border: "1px solid #e8d8cf" }}>
        <p className="text-2xl mb-1">{mood.emoji}</p>
        <p className="text-sm font-medium" style={{ color: "#3a2a28" }}>
          {language === "th" ? "บันทึกอารมณ์แล้ว 🤍" : "Mood saved 🤍"}
        </p>
        <p className="text-xs mt-1" style={{ color: "#7a5a56" }}>
          {language === "th" ? "ขอบคุณที่เช็กอินวันนี้นะ" : "Thanks for checking in today."}
        </p>
      </div>
    );
  }

  return (
    <div className="msg-enter rounded-2xl p-5" style={{ background: "#f2e8e2", border: "1px solid #e8d8cf" }}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: "#3a2a28" }}>
          {language === "th" ? "วันนี้คุณรู้สึกยังไงบ้าง?" : "How are you feeling today?"}
        </p>
        <button onClick={onClose} className="text-xs" style={{ color: "#b09490" }}>
          {language === "th" ? "ข้าม" : "Skip"}
        </button>
      </div>

      {/* Score display */}
      <div className="mb-4 text-center">
        <span className="text-3xl">{mood.emoji}</span>
        <p className="mt-1 text-sm font-medium" style={{ color: mood.color }}>{mood.label}</p>
        <p className="text-xs mt-0.5" style={{ color: "#b09490" }}>{score} / 10</p>
      </div>

      {/* Slider */}
      <input
        type="range" min={1} max={10} value={score}
        onChange={(e) => setScore(parseInt(e.target.value))}
        className="w-full mb-1 accent-[#e8a4a4]"
        style={{ accentColor: mood.color }}
      />
      <div className="flex justify-between text-xs mb-4" style={{ color: "#b09490" }}>
        <span>💔</span><span>✨</span>
      </div>

      {/* Optional note */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={
          language === "th"
            ? "มีอะไรอยู่ในใจอยากระบายไหม? (ไม่บังคับ)"
            : "Anything on your mind? (optional)"
        }
        rows={2}
        className="w-full resize-none rounded-xl px-3 py-2 text-xs outline-none mb-3"
        style={{ background: "#fffaf8", border: "1px solid #e8d8cf", color: "#3a2a28", fontFamily: "'DM Sans', sans-serif" }}
      />

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-2xl py-2.5 text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
        style={{ background: "#e8a4a4", color: "#3a1a1a" }}>
        {saving ? (language === "th" ? "กำลังบันทึก…" : "Saving…") : language === "th" ? "บันทึกเช็กอิน 🤍" : "Save check-in 🤍"}
      </button>
    </div>
  );
}
