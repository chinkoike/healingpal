import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const FREE_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT ?? "20");

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("daily_usage")
    .select("msg_count")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const count = data?.msg_count ?? 0;

  // Check profile for pro status
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_pro")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    used: count,
    limit: FREE_LIMIT,
    remaining: Math.max(0, FREE_LIMIT - count),
    is_pro: profile?.is_pro ?? false,
    can_send: (profile?.is_pro ?? false) || count < FREE_LIMIT,
  });
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];

  // Check pro status first
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_pro")
    .eq("id", user.id)
    .single();

  if (profile?.is_pro) {
    return NextResponse.json({ ok: true, unlimited: true });
  }

  // Upsert usage count
  const { data, error } = await supabase.rpc("increment_daily_usage", {
    p_user_id: user.id,
    p_date: today,
  });

  if (error) {
    // Fallback: manual upsert
    const { data: existing } = await supabase
      .from("daily_usage")
      .select("msg_count")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    const newCount = (existing?.msg_count ?? 0) + 1;

    if (newCount > FREE_LIMIT) {
      return NextResponse.json({ ok: false, limit_reached: true, used: existing?.msg_count, limit: FREE_LIMIT });
    }

    await supabase
      .from("daily_usage")
      .upsert({ user_id: user.id, date: today, msg_count: newCount }, { onConflict: "user_id,date" });

    return NextResponse.json({ ok: true, used: newCount, limit: FREE_LIMIT });
  }

  return NextResponse.json(data ?? { ok: true });
}
