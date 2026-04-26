export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET() {
  const { data, error } = await supabase
    .from("run_sessions")
    .select("*")
    .order("date", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json([], { status: 200 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    date,
    started_at,
    duration_seconds,
    distance_meters,
    elevation_gain_meters,
    avg_pace_sec_per_km,
    splits,
    notes,
    route_points,
  } = body;

  const { data, error } = await supabase
    .from("run_sessions")
    .insert({
      date,
      started_at: started_at ?? null,
      duration_seconds: duration_seconds ?? null,
      distance_meters: distance_meters ?? null,
      elevation_gain_meters: elevation_gain_meters ?? null,
      avg_pace_sec_per_km: avg_pace_sec_per_km ?? null,
      splits: splits ?? [],
      notes: notes ?? null,
      route_points: route_points ?? [],
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
