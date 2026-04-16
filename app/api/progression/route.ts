import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { computeProgression } from "@/lib/progression";

export async function GET(req: NextRequest) {
  const day = req.nextUrl.searchParams.get("day");
  if (!day) return NextResponse.json([]);

  // Get last 4 sessions for this day with their sets
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("*, workout_sets(*)")
    .eq("day", day)
    .order("date", { ascending: false })
    .limit(4);

  if (!sessions || sessions.length < 2) return NextResponse.json([]);

  // Get exercises for this day
  const { data: templates } = await supabase
    .from("workout_templates")
    .select("*, exercise:exercises(*)")
    .eq("day", day)
    .order("order");

  if (!templates) return NextResponse.json([]);

  const suggestions = templates
    .map((t: { exercise: { id: string; name: string; type: string; suggested_reps: string } }) => {
      const exercise = t.exercise;
      if (!exercise) return null;

      const recentSessions = sessions.map((s: {
        id: string;
        date: string;
        day: string;
        pre_feeling: number;
        post_feeling: number;
        warmup_completed: boolean;
        workout_sets: Array<{
          id: string;
          exercise_id: string;
          set_number: number;
          weight: number | null;
          unit: string | null;
          reps: number | null;
          duration_seconds: number | null;
          is_warmup: boolean;
          side: string | null;
          note: string | null;
        }>;
      }) => ({
        id: s.id,
        date: s.date,
        day: s.day as "A" | "B",
        preFeeling: s.pre_feeling,
        postFeeling: s.post_feeling,
        warmupCompleted: s.warmup_completed,
        sets: (s.workout_sets ?? []).map((ws) => ({
          id: ws.id,
          sessionId: s.id,
          exerciseId: ws.exercise_id,
          setNumber: ws.set_number,
          weight: ws.weight ?? undefined,
          unit: (ws.unit ?? undefined) as "kg" | "lbs" | undefined,
          reps: ws.reps ?? undefined,
          durationSeconds: ws.duration_seconds ?? undefined,
          isWarmup: ws.is_warmup,
          side: (ws.side ?? undefined) as "left" | "right" | undefined,
          note: ws.note ?? undefined,
        })),
      }));

      return computeProgression(
        exercise.id,
        exercise.name,
        exercise.type,
        exercise.suggested_reps,
        recentSessions
      );
    })
    .filter(Boolean);

  return NextResponse.json(suggestions);
}
