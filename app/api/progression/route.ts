export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { computeProgression, PSession, PSet } from "@/lib/progressionV2";

/**
 * GET /api/progression?exerciseId=X&exerciseType=weighted&suggestedReps=6-8&suggestedSets=3
 *
 * Fetches all logged sets for the given exercise (joined with session metadata),
 * groups them by session, sorts chronologically, and runs the v2 progression algorithm.
 */
export async function GET(req: NextRequest) {
  const params        = req.nextUrl.searchParams;
  const exerciseId    = params.get("exerciseId");
  const exerciseName  = params.get("exerciseName") ?? "Exercise";
  const exerciseType  = params.get("exerciseType") ?? "weighted";
  const suggestedReps = params.get("suggestedReps") ?? "8-10";
  const suggestedSets = parseInt(params.get("suggestedSets") ?? "3");

  if (!exerciseId) {
    return NextResponse.json({ error: "exerciseId is required" }, { status: 400 });
  }

  // Fetch every set for this exercise, joined with its parent session's metadata
  const { data, error } = await supabase
    .from("workout_sets")
    .select(
      "set_number, weight, unit, reps, is_warmup, session_id, workout_sessions(date, pre_feeling, post_feeling)"
    )
    .eq("exercise_id", exerciseId)
    .order("set_number", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group rows by session_id, building PSession[]
  const sessionMap = new Map<string, PSession>();
  let detectedUnit = "kg";

  for (const row of data ?? []) {
    const sess = row.workout_sessions as unknown as {
      date: string;
      pre_feeling: number;
      post_feeling: number;
    } | null;
    if (!sess || !row.session_id) continue;

    if (!sessionMap.has(row.session_id)) {
      sessionMap.set(row.session_id, {
        date:        sess.date,
        preFeeling:  sess.pre_feeling  ?? 3,
        postFeeling: sess.post_feeling ?? 3,
        sets:        [],
      });
    }

    const pSet: PSet = {
      setNumber: row.set_number ?? 1,
      weight:    row.weight    ?? 0,
      reps:      row.reps      ?? 0,
      isWarmup:  row.is_warmup ?? false,
    };
    if ((row as { unit?: string }).unit) detectedUnit = (row as { unit?: string }).unit!;

    sessionMap.get(row.session_id)!.sets.push(pSet);
  }

  // Sort sessions chronologically (oldest → newest) — required by the algorithm
  const sessions: PSession[] = Array.from(sessionMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const today = new Date().toISOString().split("T")[0];
  const result = computeProgression(
    exerciseName,
    exerciseType,
    suggestedReps,
    suggestedSets,
    sessions,
    today,
  );

  return NextResponse.json({ ...result, unit: detectedUnit });
}
