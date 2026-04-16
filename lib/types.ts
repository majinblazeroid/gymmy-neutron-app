export type ExerciseType = "weighted" | "bodyweight" | "timed" | "timed_carry" | "unilateral";
export type WeightUnit = "kg" | "lbs";
export type BackExtensionMode = "hold" | "reps" | "weighted";
export type WorkoutDay = "A" | "B";
export type BJJClassType = "fundamentals" | "advanced";
export type ProgressionAction = "increase" | "hold" | "deload" | "fatigue_skip";

export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  defaultUnit?: WeightUnit;
  suggestedSets: number;
  suggestedReps: string;
  notes?: string;
  created_at?: string;
}

export interface WorkoutTemplate {
  id: string;
  day: WorkoutDay;
  exerciseId: string;
  order: number;
  exercise?: Exercise;
}

export interface Warmup {
  id: string;
  day: WorkoutDay;
  name: string;
  prescription: string;
  order: number;
}

export interface WorkoutSet {
  id?: string;
  sessionId?: string;
  exerciseId: string;
  exerciseName?: string;
  setNumber: number;
  weight?: number;
  unit?: WeightUnit;
  reps?: number;
  durationSeconds?: number;
  isWarmup: boolean;
  side?: "left" | "right";
  note?: string;
}

export interface WorkoutSession {
  id?: string;
  date: string;
  day: WorkoutDay;
  preFeeling: number;
  preNotes?: string;
  postFeeling: number;
  postNotes?: string;
  warmupCompleted: boolean;
  sets: WorkoutSet[];
  created_at?: string;
}

export interface BJJSession {
  id?: string;
  date: string;
  classType: BJJClassType;
  durationMinutes: number;
  techniques: string;
  rounds?: number;
  roundDuration?: number;
  breakDuration?: number;
  intensity: number;
  notes?: string;
  created_at?: string;
}

export interface ProgressionSuggestion {
  exerciseId: string;
  exerciseName: string;
  action: ProgressionAction;
  currentWeight?: number;
  suggestedWeight?: number;
  reasoning: string;
  confidence: "high" | "medium" | "low";
}

export interface UserPreferences {
  unitOverrides: Record<string, WeightUnit>;
}
