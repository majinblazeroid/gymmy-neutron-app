import { Exercise, Warmup, WorkoutTemplate } from "./types";

export const EXERCISES: Omit<Exercise, "id" | "created_at">[] = [
  // Day A
  { name: "Back Extensions", type: "bodyweight", suggestedSets: 1, suggestedReps: "20 reps", notes: "Supports timed hold, reps, or weighted reps" },
  { name: "Side Hyper Extensions", type: "unilateral", suggestedSets: 2, suggestedReps: "AMRAP", notes: "Left side first always. Match reps on right." },
  { name: "RDL", type: "weighted", defaultUnit: "kg", suggestedSets: 3, suggestedReps: "6-8" },
  { name: "Pull Ups", type: "bodyweight", suggestedSets: 3, suggestedReps: "AMRAP", notes: "Optional weight for weighted pull-ups." },
  { name: "Bench Press", type: "weighted", defaultUnit: "kg", suggestedSets: 3, suggestedReps: "6-8" },
  { name: "Front Rack Carry", type: "timed_carry", defaultUnit: "lbs", suggestedSets: 3, suggestedReps: "30-40s", notes: "Weight is per side." },
  // Day B only
  { name: "Barbell Squat", type: "weighted", defaultUnit: "kg", suggestedSets: 3, suggestedReps: "8-10" },
  { name: "Chest Supported Row", type: "weighted", defaultUnit: "lbs", suggestedSets: 3, suggestedReps: "8-10" },
  { name: "Dead Bug", type: "bodyweight", suggestedSets: 3, suggestedReps: "8 per side", notes: "Optional weight." },
  { name: "OHP", type: "weighted", defaultUnit: "kg", suggestedSets: 3, suggestedReps: "5-6" },
  { name: "Incline DB Bench", type: "weighted", defaultUnit: "kg", suggestedSets: 3, suggestedReps: "4-6", notes: "Optional — only done some weeks." },
];

export const DAY_A_ORDER = [
  "Back Extensions",
  "Side Hyper Extensions",
  "RDL",
  "Pull Ups",
  "Bench Press",
  "Front Rack Carry",
];

export const DAY_B_ORDER = [
  "Back Extensions",
  "Side Hyper Extensions",
  "Barbell Squat",
  "Chest Supported Row",
  "Dead Bug",
  "OHP",
  "Incline DB Bench",
];

export const WARMUPS_A: Omit<Warmup, "id">[] = [
  { day: "A", name: "Hamstring Sweeps", prescription: "10-12 a side", order: 1 },
  { day: "A", name: "Glute Bridges", prescription: "10-12 reps, 1s pause at top", order: 2 },
  { day: "A", name: "Lateral Lunges", prescription: "6-8 a side", order: 3 },
  { day: "A", name: "Lat Stretch", prescription: "20-30s hold", order: 4 },
  { day: "A", name: "Light RDL", prescription: "8 reps light + 5 reps at 50% weight", order: 5 },
];

export const WARMUPS_B: Omit<Warmup, "id">[] = [
  { day: "B", name: "Knee Over Toe Rocks", prescription: "12-15 a side", order: 1 },
  { day: "B", name: "Ankle Pulses", prescription: "10-15 a side", order: 2 },
  { day: "B", name: "90-90 Hips", prescription: "6-8 a side", order: 3 },
  { day: "B", name: "Couch Stretch", prescription: "20-30s a side", order: 4 },
  { day: "B", name: "Light Abductor Machine", prescription: "2-3 sets, find height", order: 5 },
  { day: "B", name: "Bodyweight Squats", prescription: "8-10 reps", order: 6 },
];
