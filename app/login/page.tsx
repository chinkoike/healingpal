"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppLanguage } from "@/hooks/useAppLanguage";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { language, setLanguage } = useAppLanguage();
  const supabase = createClient();

  const handleMagicLink = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-6"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 600px 400px at 10% 20%, rgba(232,164,164,0.18) 0%, transparent 70%), radial-gradient(ellipse 500px 500px at 90% 80%, rgba(200,160,140,0.14) 0%, transparent 70%)",
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8 text-center"
        style={{
          background: "#fffaf8",
          boxShadow: "0 20px 60px rgba(180,120,110,0.13)",
        }}
      >
        {/* Logo */}
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
          style={{
            background: "linear-gradient(135deg, #f5e0e0, #e8d8cf)",
            border: "1.5px solid #e8a4a4",
          }}
        >
          🤍
        </div>

        <h1
          className="mb-1 text-2xl font-medium"
          style={{ fontFamily: "'Lora', serif", color: "#3a2a28" }}
        >
          {language === "th" ? "ยินดีต้อนรับสู่ HealingPal" : "Welcome to HealingPal"}
        </h1>
        <p
          className="mb-6 text-sm leading-relaxed"
          style={{ color: "#7a5a56" }}
        >
          {language === "th"
            ? "พื้นที่ปลอดภัยสำหรับเยียวยาหัวใจที่เจ็บปวด"
            : "A safe space to process your heartbreak."}
          <br />
          {language === "th" ? "เข้าสู่ระบบเพื่อบันทึกบทสนทนาของคุณ" : "Sign in to save your conversations."}
        </p>
        <div className="mb-4 flex justify-center">
          <div className="flex rounded-xl border" style={{ borderColor: "#e8d8cf" }}>
            <button
              onClick={() => setLanguage("th")}
              className="px-3 py-1 text-xs"
              style={{ background: language === "th" ? "#f2e8e2" : "transparent", color: "#7a5a56" }}
            >
              TH
            </button>
            <button
              onClick={() => setLanguage("en")}
              className="px-3 py-1 text-xs"
              style={{ background: language === "en" ? "#f2e8e2" : "transparent", color: "#7a5a56" }}
            >
              EN
            </button>
          </div>
        </div>

        {sent ? (
          <div
            className="rounded-2xl p-5"
            style={{ background: "#e8f5e9", border: "1.5px solid #a5d6a7" }}
          >
            <p className="text-sm font-medium" style={{ color: "#1b5e20" }}>
              {language === "th" ? "✉️ ส่ง Magic link แล้ว!" : "✉️ Magic link sent!"}
            </p>
            <p className="mt-1 text-xs" style={{ color: "#2e7d32" }}>
              {language === "th" ? (
                <>
                  เช็กอีเมลที่ <strong>{email}</strong> แล้วกดลิงก์เพื่อเข้าสู่ระบบ
                </>
              ) : (
                <>
                  Check your email at <strong>{email}</strong> and click the link to sign in.
                </>
              )}
            </p>
          </div>
        ) : (
          <>
            {/* Google */}
            <button
              onClick={handleGoogle}
              className="mb-3 flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-opacity hover:opacity-80"
              style={{
                background: "#fff",
                border: "1.5px solid #e8d8cf",
                color: "#3a2a28",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {language === "th" ? "เข้าสู่ระบบด้วย Google" : "Continue with Google"}
            </button>

            {/* Divider */}
            <div className="my-4 flex items-center gap-3">
              <div
                className="flex-1 border-t"
                style={{ borderColor: "#e8d8cf" }}
              />
              <span className="text-xs" style={{ color: "#b09490" }}>
                {language === "th" ? "หรือ" : "or"}
              </span>
              <div
                className="flex-1 border-t"
                style={{ borderColor: "#e8d8cf" }}
              />
            </div>

            {/* Email magic link */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleMagicLink()}
              placeholder={language === "th" ? "อีเมลของคุณ" : "your@email.com"}
              className="mb-3 w-full rounded-2xl px-4 py-3 text-sm outline-none transition-colors"
              style={{
                background: "#f2e8e2",
                border: "1.5px solid #e8d8cf",
                color: "#3a2a28",
                fontFamily: "'DM Sans', sans-serif",
              }}
            />

            {error && (
              <p className="mb-2 text-xs" style={{ color: "#a03030" }}>
                ❌ {error}
              </p>
            )}

            <button
              onClick={handleMagicLink}
              disabled={loading || !email.trim()}
              className="w-full rounded-2xl px-4 py-3 text-sm font-medium transition-opacity hover:opacity-85 disabled:opacity-40"
              style={{ background: "#e8a4a4", color: "#3a1a1a" }}
            >
              {loading
                ? language === "th"
                  ? "กำลังส่ง…"
                  : "Sending…"
                : language === "th"
                  ? "ส่ง Magic link ✉️"
                  : "Send magic link ✉️"}
            </button>

            <p
              className="mt-4 text-xs leading-relaxed"
              style={{ color: "#b09490" }}
            >
              {language === "th"
                ? "ไม่ต้องใช้รหัสผ่าน เราจะส่งลิงก์เข้าสู่ระบบที่ปลอดภัยให้ทางอีเมล"
                : "No password needed. We`&apos;`ll email you a secure sign-in link."}
            </p>
          </>
        )}

        <p
          className="mt-6 text-xs leading-relaxed"
          style={{ color: "#c0a09a" }}
        >
          {language === "th"
            ? "🫂 HealingPal เป็น AI companion ไม่ใช่นักบำบัดที่มีใบอนุญาต"
            : "🫂 HealingPal is an AI companion, not a licensed therapist."}
        </p>
      </div>
    </div>
  );
}
