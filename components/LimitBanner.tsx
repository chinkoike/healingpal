"use client";

interface Props {
  limit: number;
  language: "th" | "en";
}

export default function LimitBanner({ limit, language }: Props) {
  return (
    <div
      className="msg-enter mx-1 my-2 rounded-2xl p-5 text-center"
      style={{ background: "#fef9e7", border: "1.5px solid #f9d77e" }}
    >
      <p className="text-xl mb-2">☀️</p>
      <p className="text-sm font-medium mb-1" style={{ color: "#7a5a0a" }}>
        {language === "th"
          ? `คุณใช้ข้อความฟรีครบ ${limit} ข้อความของวันนี้แล้ว`
          : `You\`&apos;\`ve used all ${limit} free messages for today`}
      </p>
      <p className="text-xs leading-relaxed mb-4" style={{ color: "#9a7a2a" }}>
        {language === "th"
          ? "หัวใจของคุณสมควรได้รับการดูแลต่อเนื่อง ไม่ใช่แค่วันละ 20 ข้อความ อัปเกรดเป็น Pro เพื่อคุยไม่จำกัดและดูประวัติอารมณ์ได้"
          : "Your heart needs continuous support — not just 20 messages a day. Upgrade to Pro for unlimited conversations, mood history, and more."}
      </p>
      <div className="flex flex-col gap-2">
        <button
          className="w-full rounded-2xl py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: "#e8a4a4", color: "#3a1a1a" }}
          onClick={() =>
            alert(
              language === "th"
                ? "Stripe จะมาใน Phase 2! 🚀"
                : "Stripe coming in Phase 2! 🚀",
            )
          }
        >
          {language === "th" ? "อัปเกรดเป็น Pro — $9/เดือน 💛" : "Upgrade to Pro — $9/month 💛"}
        </button>
        <p className="text-xs" style={{ color: "#b09490" }}>
          {language === "th"
            ? "ข้อความฟรีจะรีเซ็ตตอนเที่ยงคืน กลับมาคุยกันได้เสมอนะ 🤍"
            : "Your free messages reset at midnight. Come back then 🤍"}
        </p>
      </div>
    </div>
  );
}
