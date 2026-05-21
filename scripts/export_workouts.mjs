import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";

const SUPABASE_URL     = "https://lhkxmgqezwwxykeujyzr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_fwmepzMvZi-sRwUIgHy2uw_68wMwiHY";
const OUT_PATH = "/Users/nirvikgill/gym bjj webapp/Workout_Log.xlsx";

const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── fetch ─────────────────────────────────────────────────────────────────────
const [{ data: sessions }, { data: templates }] = await Promise.all([
  db.from("workout_sessions")
    .select("id, date, day, pre_feeling, pre_notes, post_feeling, post_notes, warmup_completed, workout_sets(id, set_number, weight, unit, reps, duration_seconds, side, is_warmup, note, exercise:exercises(name, type))")
    .order("date", { ascending: true }),
  db.from("workout_templates")
    .select('day, order, exercise:exercises(name, type, suggested_sets, suggested_reps, notes)')
    .order("day").order("order"),
]);

const dayAExercises = templates.filter(t => t.day === "A").sort((a, b) => a.order - b.order).map(t => t.exercise);
const dayBExercises = templates.filter(t => t.day === "B").sort((a, b) => a.order - b.order).map(t => t.exercise);

// ── helpers ───────────────────────────────────────────────────────────────────
function fmtDate(s) {
  const [y, m, d] = s.split("-");
  return `${m}/${d}/${y}`;
}

function prescription(ex) {
  if (ex.type === "unilateral") return ex.notes ?? `${ex.suggested_sets} Sets - ${ex.suggested_reps}`;
  return `${ex.suggested_sets} Set${ex.suggested_sets > 1 ? "s" : ""} - ${ex.suggested_reps}`;
}

function formatSet(s) {
  if (s.duration_seconds != null && s.weight == null) {
    const m = Math.floor(s.duration_seconds / 60);
    const sec = s.duration_seconds % 60;
    return m > 0 ? `${m}:${String(sec).padStart(2, "0")}` : `${sec}s`;
  }
  if (s.duration_seconds != null && s.weight != null)
    return `${s.weight}*${s.duration_seconds}s`;
  if (s.weight != null && s.reps != null) {
    const side = s.side ? (s.side === "left" ? "L:" : "R:") : "";
    return `${side}${s.weight}*${s.reps}`;
  }
  if (s.reps != null && s.side)
    return `${s.side === "left" ? "L" : "R"}:${s.reps}`;
  if (s.reps != null) return `${s.reps}`;
  return "";
}

function summarise(sets) {
  if (!sets || sets.length === 0) return "";
  return [...sets]
    .sort((a, b) => a.set_number - b.set_number)
    .map(s => {
      const raw = formatSet(s);
      return raw ? (s.is_warmup ? `(${raw})` : raw) : "";
    })
    .filter(Boolean)
    .join(" + ");
}

// ── index data ────────────────────────────────────────────────────────────────
// allDates: sorted unique dates
const allDates = [...new Set(sessions.map(s => s.date))].sort();

// sessionMap: date → day → session
const sessionMap = {};
for (const s of sessions) {
  if (!sessionMap[s.date]) sessionMap[s.date] = {};
  sessionMap[s.date][s.day] = s;
}

// setsMap: sessionId → exerciseName → all sets (warmup sets included, shown in parens)
const setsMap = {};
for (const s of sessions) {
  setsMap[s.id] = {};
  for (const ws of (s.workout_sets ?? [])) {
    const name = ws.exercise?.name;
    if (!name) continue;
    if (!setsMap[s.id][name]) setsMap[s.id][name] = [];
    setsMap[s.id][name].push(ws);
  }
}

// ── workbook ──────────────────────────────────────────────────────────────────
const wb = new ExcelJS.Workbook();
wb.creator = "Gymmy Neutron";

const ws = wb.addWorksheet("Workout Log", {
  views: [{ state: "frozen", xSplit: 2, ySplit: 2 }],
});

const NUM_COLS = 2 + allDates.length; // A=exercise, B=prescription, C+=dates

// column widths
ws.getColumn(1).width = 24;
ws.getColumn(2).width = 32;
for (let i = 3; i <= NUM_COLS; i++) ws.getColumn(i).width = 17;

// ── colours ───────────────────────────────────────────────────────────────────
const C = {
  celadon:   "FFADF7B6",
  gold:      "FFFFEE93",
  peach:     "FFFFC09F",
  white:     "FFFFFFFF",
  offwhite:  "FFF9F9F8",
  steel:     "FF495057",
  gray:      "FF888888",
  lightgray: "FFD8D8D8",
  headerbg:  "FFE8E8E8",
};

function solid(argb) {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}
function border(colour = C.lightgray) {
  return { style: "thin", color: { argb: colour } };
}
function allBorders(c = C.lightgray) {
  return { top: border(c), left: border(c), bottom: border(c), right: border(c) };
}

// ── ROW 1: date headers ───────────────────────────────────────────────────────
const row1 = ws.getRow(1);
row1.height = 28;
row1.getCell(1).value = "";
row1.getCell(2).value = "Date";
row1.getCell(2).font  = { bold: true, size: 11, color: { argb: C.steel } };
row1.getCell(2).alignment = { vertical: "middle" };

for (let i = 0; i < allDates.length; i++) {
  const cell = row1.getCell(3 + i);
  cell.value = fmtDate(allDates[i]);
  cell.font  = { bold: true, size: 11, color: { argb: C.steel } };
  cell.fill  = solid(C.headerbg);
  cell.alignment = { horizontal: "center", vertical: "middle" };
  cell.border = allBorders();

  // tint column header with day colour if only one day on that date
  const sess = sessionMap[allDates[i]];
  if (sess && sess["A"] && !sess["B"]) cell.fill = solid(C.celadon);
  if (sess && sess["B"] && !sess["A"]) cell.fill = solid(C.gold);
}

// ── ROW 2: "Weight x Sets" sub-header ─────────────────────────────────────────
const row2 = ws.getRow(2);
row2.height = 16;
row2.getCell(1).value = "";
row2.getCell(2).value = "";
for (let i = 0; i < allDates.length; i++) {
  const cell = row2.getCell(3 + i);
  cell.value = "Weight × Sets";
  cell.font  = { size: 8, italic: true, color: { argb: C.gray } };
  cell.alignment = { horizontal: "center", vertical: "middle" };
  cell.fill  = solid(C.headerbg);
  cell.border = allBorders();
}

let rowIdx = 3;

// ── helper: write a day section ───────────────────────────────────────────────
function writeDay(label, exercises, dayKey, bgColour) {
  // Section header
  const hRow = ws.getRow(rowIdx++);
  hRow.height = 22;
  const hCell = hRow.getCell(1);
  hCell.value = label;
  hCell.font  = { bold: true, size: 13, color: { argb: C.steel } };
  hCell.fill  = solid(bgColour);
  hCell.alignment = { vertical: "middle" };
  ws.mergeCells(rowIdx - 1, 1, rowIdx - 1, NUM_COLS);

  // Exercise rows
  for (const ex of exercises) {
    const r = ws.getRow(rowIdx++);
    r.height = 36;

    // Col A — exercise name
    const nameCell = r.getCell(1);
    nameCell.value = ex.name;
    nameCell.font  = { bold: true, size: 10, color: { argb: C.steel } };
    nameCell.fill  = solid(bgColour);
    nameCell.alignment = { vertical: "middle", wrapText: false };
    nameCell.border = allBorders();

    // Col B — prescription
    const presCell = r.getCell(2);
    presCell.value = prescription(ex);
    presCell.font  = { size: 9, color: { argb: C.steel } };
    presCell.fill  = solid(bgColour);
    presCell.alignment = { vertical: "middle", wrapText: true };
    presCell.border = allBorders();

    // Data cols
    for (let i = 0; i < allDates.length; i++) {
      const date = allDates[i];
      const cell = r.getCell(3 + i);
      const sess = sessionMap[date]?.[dayKey];
      const setData = sess ? setsMap[sess.id]?.[ex.name] : null;
      const text = setData ? summarise(setData) : "";

      cell.value = text || null;
      cell.font  = { size: 9, color: { argb: C.steel } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.fill  = solid(text ? C.white : C.offwhite);
      cell.border = allBorders();
    }
  }

  // Spacer row
  const spacer = ws.getRow(rowIdx++);
  spacer.height = 10;
  for (let c = 1; c <= NUM_COLS; c++) {
    spacer.getCell(c).fill = solid(C.white);
  }
}

writeDay("DAY A", dayAExercises, "A", C.celadon);
writeDay("DAY B", dayBExercises, "B", C.gold);

// ── save ──────────────────────────────────────────────────────────────────────
await wb.xlsx.writeFile(OUT_PATH);
console.log(`✓ Saved to: ${OUT_PATH}`);
console.log(`  Sessions: ${sessions.length}  |  Dates: ${allDates.length}  |  Day A: ${dayAExercises.length} exercises  |  Day B: ${dayBExercises.length} exercises`);