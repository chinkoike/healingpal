import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/history?session_id=xxx — load messages for a session
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    // Return list of sessions
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("id, title, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ sessions: data ?? [] });
  }

  // Return messages for specific session
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("session_id", sessionId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] });
}

// POST /api/history — save a message
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { session_id, role, content } = await req.json();

  let sessionId = session_id;

  // Create session if none provided
  if (!sessionId) {
    const title = content.slice(0, 50) + (content.length > 50 ? "…" : "");
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, title })
      .select("id")
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    sessionId = data.id;
  }

  // Save message
  const { error: msgError } = await supabase
    .from("chat_messages")
    .insert({ session_id: sessionId, user_id: user.id, role, content });

  if (msgError)
    return NextResponse.json({ error: msgError.message }, { status: 500 });

  // Update session timestamp
  await supabase
    .from("chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  return NextResponse.json({ ok: true, session_id: sessionId });
}

// DELETE /api/history?session_id=xxx — delete a session
export async function DELETE(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId)
    return NextResponse.json({ error: "session_id required" }, { status: 400 });

  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
