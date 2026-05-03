"use client";

interface Props {
  language?: "th" | "en";
}

export default function CrisisBanner({ language = "th" }: Props) {
  const isTH = language === "th";
  return (
    <div
      className="msg-enter mx-1 my-1 rounded-2xl border-2 p-4 text-sm leading-relaxed"
      style={{
        background: "#fff3f3",
        borderColor: "#e8a4a4",
        color: "#7a2020",
      }}
    >
      <p className="mb-1 font-medium text-base">
        💙{" "}
        {isTH
          ? "เราเป็นห่วงคุณมากนะตอนนี้"
          : "I'm really concerned about you right now."}
      </p>
      <p className="mb-3" style={{ color: "#8b3030" }}>
        {isTH
          ? "รู้ว่าตอนนี้มันเจ็บมาก แต่คุณไม่ต้องเผชิญเรื่องนี้คนเดียว โปรดติดต่อคนที่ช่วยคุณได้จริงๆ นะ คุณมีคุณค่ามากเลย"
          : "What you're feeling sounds incredibly painful, and I want to make sure you're safe. Please reach out to someone who can truly support you — you matter deeply."}
      </p>
      <a
        href="tel:1323"
        className="inline-block rounded-full px-4 py-2 text-sm font-medium hover:opacity-80"
        style={{ background: "#e8a4a4", color: "#3a1a1a" }}
      >
        📞{" "}
        {isTH
          ? "โทร 1323 — สายด่วนสุขภาพจิต (ไทย)"
          : "Call 1323 — Thailand Mental Health Hotline"}
      </a>
      <p className="mt-3 text-xs" style={{ color: "#a05050" }}>
        {isTH
          ? "เปิด 24 ชม. · ฟรี · เป็นความลับ คุณยังโทรหาคนที่ไว้ใจได้ด้วยนะ 🤍"
          : "Available 24/7 · Free · Confidential. You can also reach out to a trusted person right now. 🤍"}
      </p>
    </div>
  );
}
