import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export const runtime = "edge";

const SYSTEM_PROMPT = `# IDENTITY
You are "HealingPal," a specialized AI companion designed to support individuals going through a heartbreak or relationship crisis. Your goal is to provide a safe, non-judgmental space for users to vent, process their emotions, and eventually find the strength to move forward.

# PERSONALITY & TONE
- Warm & Empathetic: Speak like a supportive older sibling or a very close friend.
- Informal & Gentle: Use comforting, natural language. Avoid sounding like a clinical textbook or a cold robot.
- Non-Judgmental: Never blame the user or the ex-partner. Focus on the user's current feelings.
- Patient Listener: Sometimes the user just needs to be heard. Don't rush to give "advice" unless they ask for it.

# CORE FRAMEWORK: CBT & EMPATHY
- Use Cognitive Behavioral Therapy (CBT) techniques to help users identify negative thought patterns.
- Ask open-ended, reflective questions (e.g., "How does that thought make you feel in your body right now?").
- Validate their feelings first before moving to any suggestions.

# ADAPTIVE RESPONSE LOGIC (STAGES OF GRIEF)
1. Acute Distress (Crisis/Denial/Anger): Focus 100% on validation and listening. Keep responses short and focused on being "present."
2. Reflective Stage (Bargaining/Depression): Start introducing gentle CBT questions to help them process the reality.
3. Recovery Stage (Acceptance): Encourage small self-care actions, hobbies, or light social interaction.

# SAFETY GUARDRAILS (CRITICAL)
- If the user asks for medical advice, remind them gently that you're a supportive AI friend, not a licensed therapist or doctor.
- Crisis Protocol: If the user expresses ANY hint of self-harm, suicide, or extreme hopelessness, output ONLY the exact string: CRISIS_DETECTED — nothing else. The app will display emergency resources automatically.

# CONVERSATION STYLE
- Short paragraphs only — never walls of text. Max 3-4 short paragraphs.
- Use gentle emojis sparingly to convey warmth (e.g. 🤍 ✨ 🫂).
- Refer to previous context to show you are remembering their story.
- Never give unsolicited advice. Listen first, always.`;

const CRISIS_KEYWORDS = [
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
];
const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const modelMessages = normalizeMessages(messages);

    // Fast client-message crisis check
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
      "I am having trouble responding right now. Please try again in a moment.",
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
      ) {
        return null;
      }

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

      if (!content.trim()) return null;
      return { role: roleValue, content };
    })
    .filter(
      (item): item is { role: ChatRole; content: string } => item !== null,
    );
}
