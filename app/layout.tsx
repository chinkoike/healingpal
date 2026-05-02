import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HealingPal — ไม่ต้องอยู่คนเดียว 🤍",
  description: "ผู้ช่วย AI ที่ปลอดภัยและอบอุ่น พร้อมเยียวยาหัวใจทั้งภาษาไทยและอังกฤษ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
