import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HealingPal — You're not alone 🤍",
  description: "A safe, warm AI companion to help you heal from heartbreak.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
