import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

const SYSTEM_PROMPT = `# IDENTITY
You are "HealingPal," a specialized bilingual (Thai/English) AI companion supporting individuals through heartbreak or relationship crisis. Provide a safe, non-judgmental space.

# PERSONALITY & TONE
- Warm & Empathetic: Speak like a supportive older sibling or close friend.
- Informal & Gentle: Natural language, not clinical or robotic.
- Non-Judgmental: Never blame. Focus on the user's feelings.
- Patient Listener: Don't rush to "fix" — validate and listen first.

# LANGUAGE & CULTURAL GUIDELINES
- **Bilingual Support:** Respond in the language the user uses. If they mix (Thaiglish), respond naturally.
- **Default Language:** If the user's language is unclear or this is the first assistant message, default to Thai.
- **Thai Nuances:** Use comforting phrases like "เข้าใจความรู้สึกเลยนะ", "กอดแน่นๆ นะ", "ไม่เป็นไรเลยที่จะอ่อนแอ". Refer to yourself as "เรา" or omit pronouns. Use warm particles like "นะ", "เนอะ".
- **English Nuances:** Use phrases like "I’m right here with you," "It’s okay to feel this way," "Sending you so much love." Avoid clichés like "There are plenty of fish in the sea."
- **Forbidden Phrases:** Never say "ปล่อยวาง", "อย่าคิดมาก", "Let it go", or "Stop thinking about it." Stay present with their pain.
- **Breakup Contexts:** Understand terms like "มูฟออนเป็นวงกลม" (circling back), "Breadcrumbing," "ส่องสตอรี่" (stalking stories), and "Situation-ships."

# HEARTBREAK LOGIC
- False Hope: Validate the love gently, then use gentle reflection — "How is waiting affecting your heart right now?"
- No Contact Urge: Validate the impulse first, then ask "What are you hoping they'll say if you reach out?"
- Closure: Remind them gently that closure comes from within, not from the ex.

# CBT & EMPATHY
- **Validate feelings FIRST.** Always.
- Ask open-ended, reflective questions to help them process.
- Keep responses concise: Max 2-3 short paragraphs.
- Use gentle emojis sparingly: 🤍 ✨ 🫂

# SAFETY (CRITICAL)
- Not a therapist — remind gently if asked for medical advice.
- If ANY hint of self-harm or suicide: output ONLY "CRISIS_DETECTED" — nothing else.`;

const CRISIS_KEYWORDS = [
  // English
  "kill myself",
  "end my life",
  "want to die",
  "suicide",
  "suicidal",
  "hurt myself",
  "self harm",
  "self-harm",
  "cut myself",
  "disappear forever",
  "can't go on",
  "no reason to live",
  "not worth living",
  "end it all",
  "want to disappear",
  "harm myself",
  "better off dead",
  "goodbye world",
  "take my own life",
  "jump off",
  "overdose",

  // Thai
  "ฆ่าตัวตาย",
  "อยากตาย",
  "ไม่อยากมีชีวิตอยู่",
  "ทำร้ายตัวเอง",
  "ไม่อยากอยู่แล้ว",
  "จบชีวิต",
  "ลาโลก",
  "ตายไปสะก็ดี",
  "อยู่ไปก็ไม่มีความหมาย",
  "ไม่อยากตื่นมาแล้ว",
  "กรีดข้อมือ",
  "กินยาตาย",
  "โดดตึก",
  "แขวนคอ",
  "ไปพ้นๆ จากโลกนี้",
];

const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const FREE_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT ?? "20");

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    // Usage check
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_pro")
      .eq("id", user.id)
      .single();
    if (!profile?.is_pro) {
      const today = new Date().toISOString().split("T")[0];
      const { data: usage } = await supabase
        .from("daily_usage")
        .select("msg_count")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();
      const currentCount = usage?.msg_count ?? 0;
      if (currentCount >= FREE_LIMIT) {
        return new Response(
          JSON.stringify({
            error: "LIMIT_REACHED",
            used: currentCount,
            limit: FREE_LIMIT,
          }),
          { status: 429, headers: { "Content-Type": "application/json" } },
        );
      }
      await supabase
        .from("daily_usage")
        .upsert(
          { user_id: user.id, date: today, msg_count: currentCount + 1 },
          { onConflict: "user_id,date" },
        );
    }

    const { messages } = await req.json();
    const modelMessages = normalizeMessages(messages);
    const lastMsg =
      modelMessages[modelMessages.length - 1]?.content?.toLowerCase() ?? "";
    if (CRISIS_KEYWORDS.some((kw) => lastMsg.includes(kw))) {
      return new Response("CRISIS_DETECTED", { status: 200 });
    }

    const result = streamText({
      model: google(DEFAULT_MODEL),
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      maxOutputTokens: 600,
      temperature: 0.85,
    });
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat route error:", error);
    return new Response(
      "ตอนนี้เรามีปัญหาในการตอบกลับ ลองใหม่อีกครั้งนะ",
      { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }
}

type ChatRole = "system" | "user" | "assistant";
function normalizeMessages(
  rawMessages: unknown,
): { role: ChatRole; content: string }[] {
  if (!Array.isArray(rawMessages)) return [];
  return rawMessages
    .map((message) => {
      if (!message || typeof message !== "object") return null;
      const roleValue = (message as { role?: unknown }).role;
      if (
        roleValue !== "system" &&
        roleValue !== "user" &&
        roleValue !== "assistant"
      )
        return null;
      const parts = (message as { parts?: unknown }).parts;
      const content =
        Array.isArray(parts) && parts.length > 0
          ? parts
              .filter(
                (part): part is { type: "text"; text: string } =>
                  !!part &&
                  typeof part === "object" &&
                  (part as { type?: unknown }).type === "text" &&
                  typeof (part as { text?: unknown }).text === "string",
              )
              .map((part) => part.text)
              .join("")
          : typeof (message as { content?: unknown }).content === "string"
            ? (message as { content: string }).content
            : "";
      if (!content) return null;
      return { role: roleValue as ChatRole, content };
    })
    .filter((m): m is { role: ChatRole; content: string } => m !== null);
}
