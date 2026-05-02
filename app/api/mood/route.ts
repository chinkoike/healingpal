import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/mood — fetch last 14 days of mood data
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("mood_checkins")
    .select("score, note, date, created_at")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(14);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Check if today's mood is already submitted
  const today = new Date().toISOString().split("T")[0];
  const todayEntry = data?.find((d: { date: string }) => d.date === today);

  return NextResponse.json({ checkins: data ?? [], todayDone: !!todayEntry });
}

// POST /api/mood — save today's mood
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { score, note } = await req.json();
  if (!score || score < 1 || score > 10) {
    return NextResponse.json({ error: "Score must be 1–10" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];

  const { error } = await supabase
    .from("mood_checkins")
    .upsert(
      { user_id: user.id, score, note: note ?? null, date: today },
      { onConflict: "user_id,date" },
    );

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
