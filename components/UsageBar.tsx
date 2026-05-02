"use client";

interface Props {
  used: number;
  limit: number;
  isPro: boolean;
  language: "th" | "en";
}

export default function UsageBar({ used, limit, isPro, language }: Props) {
  if (isPro) {
    return (
      <div className="flex items-center gap-1.5 px-6 py-1.5 text-xs"
        style={{ background: "#f2e8e2", borderBottom: "1px solid #e8d8cf", color: "#7a5a56" }}>
        <span style={{ color: "#e8a4a4" }}>✨</span>
        <span>{language === "th" ? "Pro — คุยได้ไม่จำกัด" : "Pro — unlimited conversations"}</span>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((used / limit) * 100));
  const remaining = Math.max(0, limit - used);
  const isWarning = remaining <= 5;
  const isOut = remaining === 0;

  return (
    <div className="px-5 py-2" style={{ background: "#f2e8e2", borderBottom: "1px solid #e8d8cf" }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs" style={{ color: isOut ? "#c97a7a" : isWarning ? "#b08040" : "#7a5a56" }}>
          {isOut
            ? language === "th"
              ? "ครบลิมิตรายวันแล้ว"
              : "Daily limit reached"
            : language === "th"
              ? `เหลือข้อความฟรีอีก ${remaining} ข้อความวันนี้`
              : `${remaining} free messages left today`}
        </span>
        <span className="text-xs font-medium" style={{ color: "#b09490" }}>
          {used}/{limit}
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "#e8d8cf" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: isOut ? "#c97a7a" : isWarning ? "#d4a04a" : "#e8a4a4",
          }}
        />
      </div>
    </div>
  );
}
