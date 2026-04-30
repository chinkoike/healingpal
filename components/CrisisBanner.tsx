"use client";

export default function CrisisBanner() {
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
        💙 I`&apos;`m really concerned about you right now.
      </p>
      <p className="mb-3" style={{ color: "#8b3030" }}>
        What you`&apos;`re feeling sounds incredibly painful, and I want to make
        sure you`&apos;`re safe. Please reach out to someone who can truly
        support you — you matter deeply, and you don`&apos;`t have to face this
        alone.
      </p>
      <a
        href="tel:1323"
        className="inline-block rounded-full px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
        style={{ background: "#e8a4a4", color: "#3a1a1a" }}
      >
        📞 Call 1323 — Thailand Mental Health Hotline
      </a>
      <p className="mt-3 text-xs" style={{ color: "#a05050" }}>
        Available 24/7 · Free · Confidential. You can also reach out to a
        trusted friend or family member right now. 🤍
      </p>
    </div>
  );
}
