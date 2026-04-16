import { NextResponse } from "next/server";

// The data migration runs via the Python migration script (migration/migrate.py).
// This endpoint is a placeholder — migration goes through the Python CLI, not the web app.
export async function POST() {
  return NextResponse.json(
    { message: "Use the Python migration script: cd migration && python migrate.py --file Gym_Ting.xlsx" },
    { status: 200 }
  );
}
