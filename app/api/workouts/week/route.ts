import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

export async function GET() {
  try {
    const { start, end } = getWeekRange();

    const [gymRes, bjjRes] = await Promise.all([
      supabase
        .from("workout_sessions")
        .select("id, date, day")
        .gte("date", start)
        .lte("date", end),
      supabase
        .from("bjj_sessions")
        .select("id, date")
        .gte("date", start)
        .lte("date", end),
    ]);

    const gymSessions = gymRes.data ?? [];
    const bjjSessions = bjjRes.data ?? [];

    const dayA = gymSessions.find((s) => s.day === "A");
    const dayB = gymSessions.find((s) => s.day === "B");

    return NextResponse.json({
      dayA: {
        done: !!dayA,
        date: dayA?.date,
      },
      dayB: {
        done: !!dayB,
        date: dayB?.date,
      },
      bjjCount: bjjSessions.length,
    });
  } catch {
    return NextResponse.json({ dayA: { done: false }, dayB: { done: false }, bjjCount: 0 });
  }
}
