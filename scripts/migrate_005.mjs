import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lhkxmgqezwwxykeujyzr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_fwmepzMvZi-sRwUIgHy2uw_68wMwiHY";

const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  console.log("=== Migration 005: Update exercises + templates ===\n");

  // 1. Update existing exercises
  const updates = [
    { name: "RDL",               patch: { suggested_sets: 4 } },
    { name: "Bench Press",       patch: { suggested_sets: 4, notes: "Fresh — heaviest press of the day" } },
    { name: "Pull Ups",          patch: { suggested_sets: 4, notes: "Add weight once regularly hitting 10+" } },
    { name: "Incline DB Bench",  patch: { suggested_sets: 4, suggested_reps: "6-8", notes: "First — fresh chest, load it heavy" } },
    { name: "OHP",               patch: { notes: "After incline — shoulder finisher" } },
    { name: "Barbell Squat",     patch: { suggested_sets: 4 } },
    { name: "Front Rack Carry",  patch: { suggested_reps: "40s", notes: "10s per side. Weight is per side." } },
  ];

  for (const { name, patch } of updates) {
    const { error } = await db.from("exercises").update(patch).eq("name", name);
    if (error) { console.error(`  FAIL update "${name}":`, error.message); process.exit(1); }
    console.log(`  ✓ Updated: ${name}`);
  }

  // 2. Insert Bulgarian Split Squat (skip if exists)
  const { data: existing } = await db.from("exercises").select("id").eq("name", "Bulgarian Split Squat").maybeSingle();
  if (existing) {
    console.log("  ✓ Bulgarian Split Squat already exists — skipped insert");
  } else {
    const { error } = await db.from("exercises").insert({
      name: "Bulgarian Split Squat",
      type: "weighted",
      default_unit: "kg",
      suggested_sets: 3,
      suggested_reps: "8-12 per leg",
      notes: "Quad volume + single-leg balance.",
    });
    if (error) { console.error("  FAIL insert Bulgarian Split Squat:", error.message); process.exit(1); }
    console.log("  ✓ Inserted: Bulgarian Split Squat");
  }

  // 3. Fetch all exercise IDs we need
  const allNames = [
    "Back Extensions", "Side Hyper Extensions", "RDL", "Bench Press",
    "Pull Ups", "Bulgarian Split Squat", "Front Rack Carry",
    "Barbell Squat", "Incline DB Bench", "OHP", "Chest Supported Row", "Dead Bug",
  ];
  const { data: exercises, error: fetchErr } = await db.from("exercises").select("id, name").in("name", allNames);
  if (fetchErr) { console.error("  FAIL fetch exercises:", fetchErr.message); process.exit(1); }

  const idByName = Object.fromEntries(exercises.map(e => [e.name, e.id]));
  const missing = allNames.filter(n => !idByName[n]);
  if (missing.length > 0) { console.error("  FAIL — exercises not found:", missing.join(", ")); process.exit(1); }
  console.log("\n  ✓ Fetched all exercise IDs");

  // 4. Rebuild Day A
  const dayAOrder = [
    "Back Extensions", "Side Hyper Extensions", "RDL", "Bench Press",
    "Pull Ups", "Bulgarian Split Squat", "Front Rack Carry",
  ];
  const { error: delA } = await db.from("workout_templates").delete().eq("day", "A");
  if (delA) { console.error("  FAIL delete Day A templates:", delA.message); process.exit(1); }
  const { error: insA } = await db.from("workout_templates").insert(
    dayAOrder.map((name, i) => ({ day: "A", exercise_id: idByName[name], order: i + 1 }))
  );
  if (insA) { console.error("  FAIL insert Day A templates:", insA.message); process.exit(1); }
  console.log("  ✓ Rebuilt Day A template:", dayAOrder.join(" → "));

  // 5. Rebuild Day B
  const dayBOrder = [
    "Back Extensions", "Side Hyper Extensions", "Barbell Squat", "Incline DB Bench",
    "OHP", "Chest Supported Row", "Dead Bug",
  ];
  const { error: delB } = await db.from("workout_templates").delete().eq("day", "B");
  if (delB) { console.error("  FAIL delete Day B templates:", delB.message); process.exit(1); }
  const { error: insB } = await db.from("workout_templates").insert(
    dayBOrder.map((name, i) => ({ day: "B", exercise_id: idByName[name], order: i + 1 }))
  );
  if (insB) { console.error("  FAIL insert Day B templates:", insB.message); process.exit(1); }
  console.log("  ✓ Rebuilt Day B template:", dayBOrder.join(" → "));

  console.log("\n=== Migration complete ===");
}

run().catch(e => { console.error("Unexpected error:", e); process.exit(1); });
