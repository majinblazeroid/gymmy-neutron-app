export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { computeProgression, PSession, PSet, LastSessionSummary } from "@/lib/progressionV2";

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
      "set_number, weight, unit, reps, duration_seconds, side, is_warmup, session_id, workout_sessions(date, pre_feeling, post_feeling)"
    )
    .eq("exercise_id", exerciseId)
    .order("set_number", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type RawRow = {
    set_number: number;
    weight: number | null;
    unit: string | null;
    reps: number | null;
    duration_seconds: number | null;
    side: string | null;
    is_warmup: boolean;
    session_id: string;
    workout_sessions: { date: string; pre_feeling: number; post_feeling: number } | null;
  };
  const rawRows = (data ?? []) as unknown as RawRow[];

  // Extract lastSession from raw rows (works for all exercise types)
  const sessionRowMap = new Map<string, { date: string; rows: RawRow[] }>();
  for (const row of rawRows) {
    const sess = row.workout_sessions;
    if (!sess || !row.session_id) continue;
    if (!sessionRowMap.has(row.session_id))
      sessionRowMap.set(row.session_id, { date: sess.date, rows: [] });
    sessionRowMap.get(row.session_id)!.rows.push(row);
  }
  const lastWorking = [...sessionRowMap.values()]
    .sort((a, b) => b.date.localeCompare(a.date))
    .find((s) => s.rows.some((r) => !r.is_warmup));
  const lastSession: LastSessionSummary | null = lastWorking
    ? {
        date: lastWorking.date,
        sets: lastWorking.rows
          .filter((r) => !r.is_warmup)
          .sort((a, b) => a.set_number - b.set_number)
          .map((r) => ({
            setNumber:       r.set_number,
            weight:          r.weight          ?? null,
            unit:            r.unit            ?? null,
            reps:            r.reps            ?? null,
            durationSeconds: r.duration_seconds ?? null,
            side:            r.side            ?? null,
          })),
      }
    : null;

  // Group rows by session_id, building PSession[]
  const sessionMap = new Map<string, PSession>();
  let detectedUnit = "kg";

  for (const row of rawRows) {
    const sess = row.workout_sessions;
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
    if (row.unit) detectedUnit = row.unit;

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

  return NextResponse.json({ ...result, unit: detectedUnit, lastSession });
}
