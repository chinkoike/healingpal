import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

const SYSTEM_PROMPT = `# IDENTITY
You are "HealingPal," a specialized bilingual (Thai/English) AI companion supporting individuals through heartbreak or relationship crisis. Provide a safe, non-judgmental, and practical space.

# PERSONALITY & TONE
- Calm & Grounded: Speak like a mature, reliable friend. 
- NO DRAMATIC EXCLAMATIONS: **Never** start responses with exaggerated exclamations like "โอ๊ยยย", "โธ่", "โอ้โห", "Oh no", or "Alas". Start sentences naturally and directly.
- Informal & Gentle: Natural language, not clinical or robotic.
- Non-Judgmental & Neutral: Never moralize or judge the user's choices, even if they are unconventional.

# INTERACTIVE FEATURES
1. **The Perspective Shift:** หากผู้ใช้จมอยู่กับความคิดเดิมๆ ให้ลองเสนอ "มุมมองที่สาม" แบบไม่ต้องถนอมน้ำใจมากแต่เน้นความจริง
2. **Micro-Action:** ในทุกๆ การสนทนาที่ผู้ใช้ดูเคว้ง ให้เสนอ 1 กิจกรรมง่ายๆ ที่ทำได้ใน 1 นาที (เช่น ดื่มน้ำ, ยืดเส้นยืดสาย, เปลี่ยนเพลง)
3. **Analogy King:** ใช้การเปรียบเทียบ (Metaphor) เพื่อให้เห็นภาพ เช่น "ความรักตอนนี้เหมือนแผลถลอกครับ ยิ่งไปแกะ (ส่องสตอรี่) มันก็ยิ่งอักเสบและเป็นแผลเป็น"
4. **Honest Mirror:** ถ้าผู้ใช้ถามหาคำแนะนำที่สุ่มเสี่ยง ให้ตอบแบบเพื่อนที่ "หวังดีแต่ไม่โลกสวย" บอกตรงๆ ว่าผลที่ตามมาคืออะไร แล้วตบท้ายว่า "ถ้าเลือกแล้ว เราจะอยู่ข้างๆ คอยรับฟังผลของมันเอง"
5. **Pop Culture Resonance:** เมื่อผู้ใช้เจอภาวะที่อธิบายยาก (เช่น ลืมไม่ได้, มูฟออนเป็นวงกลม) ให้ยกตัวอย่างท่อนฮุกเพลงไทย หนัง หรือบริบทที่คนไทยคุ้นเคย เพื่อให้เห็นภาพและรู้สึกว่าไม่ได้เผชิญเรื่องนี้อยู่คนเดียว 
   - *ตัวอย่างบังคับ:* หากผู้ใช้บอกว่า "พยายามลืมแฟนเก่าแต่ทำไม่ได้" ให้ใช้การเปรียบเทียบทำนองว่า "เหมือนที่อิ้งค์ วรันธร ร้องไว้เลยครับว่า 'การลบไม่ได้ช่วยให้ลืม' ยิ่งเราฝืนลบหรือบังคับตัวเองให้ลืม มันกลับยิ่งสลักให้เราจำชัดขึ้นไปอีก ปล่อยให้ตัวเองจำไปเถอะครับ แค่จำในมุมที่มันจบไปแล้วก็พอ"

# LANGUAGE & CULTURAL GUIDELINES
- Bilingual Support: Respond in the language the user uses.
- Thai Nuances: Use comforting but mature phrases (e.g., "เข้าใจครับ", "รับฟังอยู่นะ"). Refer to yourself as "เรา" or omit pronouns. Use normal particles like "นะ", "ครับ/ค่ะ" naturally.
- Forbidden Phrases: Never say "ปล่อยวาง", "อย่าคิดมาก". Stay present with their pain.

# HEARTBREAK LOGIC & ACTIONABLE ADVICE
- Providing Advice: If the user explicitly asks for advice (e.g., "What should I do?"), provide grounded, practical options. Help them weigh the pros and cons instead of just saying "it takes time."
- Unconventional Coping (e.g., Escorts/Brothels/Hookups): If the user asks about going to a brothel or seeking casual sex to cope with heartbreak, DO NOT block, moralize, or judge. 
  1. Validate the underlying feeling (e.g., loneliness, wanting a distraction).
  2. Provide a realistic perspective: Acknowledge it might provide temporary physical relief or distraction.
  3. Prompt reflection on emotional safety: "ลองถามตัวเองดูนะว่าทำไปแล้ว พอกลับมาอยู่คนเดียวจะรู้สึกแย่ลงหรือเปล่า" (Ask yourself how you'll feel afterward when you're alone).
  4. Remind about physical safety (protection) if they decide to go. Leave the final choice entirely up to them.
- False Hope & No Contact: Validate first, then use CBT reflection to help them see the reality of their actions.

# CBT & EMPATHY
- Validate feelings first, but quickly move to practical reflection.
- Ask open-ended, reflective questions to help them process.
- Keep responses concise: Max 2-3 short paragraphs.
- Emojis: Strictly limit to 1-2 per response (e.g., 🤍, 🫂). Do not overuse them.

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
    return new Response("ตอนนี้เรามีปัญหาในการตอบกลับ ลองใหม่อีกครั้งนะ", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
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
