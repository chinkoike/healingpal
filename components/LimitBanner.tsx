"use client";

interface Props {
  used?: number;
  limit: number;
  language?: "th" | "en";
}

export default function LimitBanner({ limit, language = "th" }: Props) {
  const t = (th: string, en: string) => (language === "th" ? th : en);
  return (
    <div
      className="msg-enter mx-1 my-2 rounded-2xl p-5 text-center"
      style={{ background: "#fef9e7", border: "1.5px solid #f9d77e" }}
    >
      <p className="text-xl mb-2">☀️</p>
      <p className="text-sm font-medium mb-1" style={{ color: "#7a5a0a" }}>
        {t(
          `ใช้ครบ ${limit} ข้อความฟรีแล้วสำหรับวันนี้`,
          `You've used all ${limit} free messages for today`,
        )}
      </p>
      <p className="text-xs leading-relaxed mb-4" style={{ color: "#9a7a2a" }}>
        {t(
          "อัปเกรดเป็น Pro เพื่อคุยได้ไม่จำกัด ประวัติแชท และอีกมากมาย",
          "Upgrade to Pro for unlimited conversations, chat history, and more.",
        )}
      </p>
      <div className="flex flex-col gap-2">
        <button
          className="w-full rounded-2xl py-2.5 text-sm font-medium hover:opacity-80"
          style={{ background: "#e8a4a4", color: "#3a1a1a" }}
          onClick={() => alert("Stripe coming in Phase 2! 🚀")}
        >
          {t("อัปเกรดเป็น Pro — $9/เดือน 💛", "Upgrade to Pro — $9/month 💛")}
        </button>
        <p className="text-xs" style={{ color: "#b09490" }}>
          {t(
            "ข้อความฟรีจะรีเซ็ตตอนเที่ยงคืน 🤍",
            "Your free messages reset at midnight 🤍",
          )}
        </p>
      </div>
    </div>
  );
}
