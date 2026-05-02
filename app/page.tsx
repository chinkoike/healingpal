import { redirect } from "next/navigation";

// Root redirects are handled by middleware.
// This page is a fallback only.
export default function RootPage() {
  redirect("/chat");
}
