export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET() {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*, workout_sets(*, exercise:exercises(name))")
    .order("date", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json([], { status: 200 });

  const mapped = (data ?? []).map((s) => ({
    id:               s.id,
    date:             s.date,
    day:              s.day,
    preFeeling:       s.pre_feeling,
    preNotes:         s.pre_notes,
    postFeeling:      s.post_feeling,
    postNotes:        s.post_notes,
    warmupCompleted:  s.warmup_completed,
    created_at:       s.created_at,
    sets: (s.workout_sets ?? []).map((w: {
      id: string; exercise_id: string; set_number: number;
      weight?: number; unit?: string; reps?: number;
      duration_seconds?: number; is_warmup?: boolean; side?: string; note?: string;
      exercise?: { name: string } | null;
    }) => ({
      id:              w.id,
      exerciseId:      w.exercise_id,
      exerciseName:    w.exercise?.name ?? w.exercise_id,
      setNumber:       w.set_number,
      weight:          w.weight,
      unit:            w.unit,
      reps:            w.reps,
      durationSeconds: w.duration_seconds,
      isWarmup:        w.is_warmup,
      side:            w.side,
      note:            w.note,
    })),
  }));

  return NextResponse.json(mapped);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { day, date, preFeeling, preNotes, postFeeling, postNotes, warmupCompleted, sets } = body;

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .insert({
      day,
      date,
      pre_feeling: preFeeling,
      pre_notes: preNotes,
      post_feeling: postFeeling,
      post_notes: postNotes,
      warmup_completed: warmupCompleted,
    })
    .select()
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: sessionError?.message }, { status: 500 });
  }

  if (sets && sets.length > 0) {
    const rows = sets.map((s: {
      exerciseId: string;
      setNumber: number;
      weight?: number;
      unit?: string;
      reps?: number;
      durationSeconds?: number;
      isWarmup?: boolean;
      side?: string;
      note?: string;
    }) => ({
      session_id: session.id,
      exercise_id: s.exerciseId,
      set_number: s.setNumber,
      weight: s.weight ?? null,
      unit: s.unit ?? null,
      reps: s.reps ?? null,
      duration_seconds: s.durationSeconds ?? null,
      is_warmup: s.isWarmup ?? false,
      side: s.side ?? null,
      note: s.note ?? null,
    }));

    const { error: setsError } = await supabase.from("workout_sets").insert(rows);
    if (setsError) {
      return NextResponse.json({ error: setsError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ id: session.id }, { status: 201 });
}
