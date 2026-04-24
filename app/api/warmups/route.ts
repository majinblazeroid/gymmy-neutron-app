export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET(req: NextRequest) {
  const day = req.nextUrl.searchParams.get("day");
  const query = supabase.from("warmups").select("*").order("order");
  if (day) query.eq("day", day);

  const { data, error } = await query;
  if (error) return NextResponse.json([], { status: 200 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { day, warmups } = body;

  await supabase.from("warmups").delete().eq("day", day);

  const rows = warmups.map((w: { name: string; prescription: string }, i: number) => ({
    day,
    name: w.name,
    prescription: w.prescription,
    order: i + 1,
  }));

  const { error } = await supabase.from("warmups").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
