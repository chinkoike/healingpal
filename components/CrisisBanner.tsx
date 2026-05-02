"use client";

import { AppLanguage } from "@/lib/i18n";

interface Props {
  language: AppLanguage;
}

export default function CrisisBanner({ language }: Props) {
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
        {language === "th"
          ? "💙 ตอนนี้เราเป็นห่วงคุณมากจริงๆ นะ"
          : "💙 I`&apos;`m really concerned about you right now."}
      </p>
      <p className="mb-3" style={{ color: "#8b3030" }}>
        {language === "th"
          ? "สิ่งที่คุณกำลังรู้สึกตอนนี้หนักมากจริงๆ และเราอยากให้คุณปลอดภัยนะ ลองติดต่อคนที่ช่วยดูแลคุณได้ทันที เพราะคุณมีความหมายมาก และไม่จำเป็นต้องรับมือทั้งหมดนี้คนเดียว"
          : "What you`&apos;`re feeling sounds incredibly painful, and I want to make sure you`&apos;`re safe. Please reach out to someone who can truly support you — you matter deeply, and you don`&apos;`t have to face this alone."}
      </p>
      <a
        href="tel:1323"
        className="inline-block rounded-full px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
        style={{ background: "#e8a4a4", color: "#3a1a1a" }}
      >
        {language === "th"
          ? "📞 โทร 1323 — สายด่วนสุขภาพจิต"
          : "📞 Call 1323 — Thailand Mental Health Hotline"}
      </a>
      <p className="mt-3 text-xs" style={{ color: "#a05050" }}>
        {language === "th"
          ? "ให้บริการ 24 ชั่วโมง · ฟรี · เป็นความลับ คุณสามารถติดต่อเพื่อนหรือครอบครัวที่ไว้ใจได้ตอนนี้เลย 🤍"
          : "Available 24/7 · Free · Confidential. You can also reach out to a trusted friend or family member right now. 🤍"}
      </p>
    </div>
  );
}
