export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET() {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("name");

  if (error) return NextResponse.json([], { status: 200 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await supabase
    .from("exercises")
    .insert({
      name: body.name,
      type: body.type,
      default_unit: body.defaultUnit ?? null,
      suggested_sets: body.suggestedSets ?? 3,
      suggested_reps: body.suggestedReps ?? "8-10",
      notes: body.notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
