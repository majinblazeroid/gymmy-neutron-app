import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET(req: NextRequest) {
  const day = req.nextUrl.searchParams.get("day");
  const query = supabase
    .from("workout_templates")
    .select("*, exercise:exercises(*)")
    .order("order");

  if (day) query.eq("day", day);

  const { data, error } = await query;
  if (error) return NextResponse.json([], { status: 200 });

  // Map snake_case DB fields → camelCase TypeScript interface
  const exercises = data
    .map((t: { exercise: Record<string, unknown> | null }) => {
      const e = t.exercise;
      if (!e) return null;
      return {
        id: e.id,
        name: e.name,
        type: e.type,
        defaultUnit: e.default_unit ?? null,
        suggestedSets: e.suggested_sets,
        suggestedReps: e.suggested_reps,
        notes: e.notes ?? null,
      };
    })
    .filter(Boolean);

  return NextResponse.json(exercises);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { day, exerciseIds } = body;

  // Delete existing and re-insert with new order
  await supabase.from("workout_templates").delete().eq("day", day);

  const rows = exerciseIds.map((id: string, i: number) => ({
    day,
    exercise_id: id,
    order: i + 1,
  }));

  const { error } = await supabase.from("workout_templates").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
