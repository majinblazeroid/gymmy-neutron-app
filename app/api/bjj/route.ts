import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET() {
  const { data, error } = await supabase
    .from("bjj_sessions")
    .select("*")
    .order("date", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json([], { status: 200 });

  const mapped = (data ?? []).map((s) => ({
    id:              s.id,
    date:            s.date,
    classType:       s.class_type,
    durationMinutes: s.duration_minutes,
    techniques:      s.techniques,
    rounds:          s.rounds,
    roundDuration:   s.round_duration,
    breakDuration:   s.break_duration,
    intensity:       s.intensity,
    notes:           s.notes,
    created_at:      s.created_at,
  }));

  return NextResponse.json(mapped);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await supabase
    .from("bjj_sessions")
    .insert({
      date: body.date,
      class_type: body.classType,
      duration_minutes: body.durationMinutes ?? 60,
      techniques: body.techniques ?? null,
      rounds: body.rounds ?? null,
      round_duration: body.roundDuration ?? 300,
      break_duration: body.breakDuration ?? 60,
      intensity: body.intensity,
      notes: body.notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}
