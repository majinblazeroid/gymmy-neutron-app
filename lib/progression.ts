import { WorkoutSession, WorkoutSet, ProgressionSuggestion, ProgressionAction } from "./types";

function parseRepRange(repsStr: string): { min: number; max: number } {
  const match = repsStr.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (match) return { min: parseInt(match[1]), max: parseInt(match[2]) };
  const single = repsStr.match(/(\d+)/);
  if (single) return { min: parseInt(single[1]), max: parseInt(single[1]) };
  return { min: 0, max: 999 };
}

export function computeProgression(
  exerciseId: string,
  exerciseName: string,
  exerciseType: string,
  suggestedReps: string,
  recentSessions: WorkoutSession[]
): ProgressionSuggestion {
  const sessionSets = recentSessions.map((s) =>
    s.sets.filter((set) => set.exerciseId === exerciseId && !set.isWarmup)
  );

  const noData: ProgressionSuggestion = {
    exerciseId,
    exerciseName,
    action: "hold",
    reasoning: "Not enough data yet — keep logging",
    confidence: "low",
  };

  if (sessionSets.length < 2) return noData;

  if (exerciseType === "weighted" || exerciseType === "timed_carry") {
    const { min, max } = parseRepRange(suggestedReps);

    const getTopWeight = (sets: WorkoutSet[]) =>
      sets.reduce((acc, s) => Math.max(acc, s.weight ?? 0), 0);

    const allAtMax = (sets: WorkoutSet[]) =>
      sets.length > 0 && sets.every((s) => (s.reps ?? 0) >= max);

    const anyBelowMin = (sets: WorkoutSet[]) =>
      sets.some((s) => (s.reps ?? 0) < min);

    const last2 = sessionSets.slice(-2);
    const last4 = sessionSets.slice(-4);
    const currentWeight = getTopWeight(last2[last2.length - 1] ?? []);

    // Rule 1: increase
    if (last2.every(allAtMax)) {
      const increase = exerciseName.toLowerCase().includes("squat") ||
        exerciseName.toLowerCase().includes("rdl") ||
        exerciseName.toLowerCase().includes("deadlift") ? 2.5 : 2.5;
      return {
        exerciseId,
        exerciseName,
        action: "increase",
        currentWeight,
        suggestedWeight: currentWeight + increase,
        reasoning: `Hit ${max}+ reps on all sets for 2 sessions — time to go up`,
        confidence: "high",
      };
    }

    // Rule 3: deload
    if (last2.every(anyBelowMin)) {
      const deload = Math.round(currentWeight * 0.9 * 2) / 2;
      return {
        exerciseId,
        exerciseName,
        action: "deload",
        currentWeight,
        suggestedWeight: deload,
        reasoning: "Missed bottom of rep range 2 sessions in a row",
        confidence: "high",
      };
    }

    // Rule 5: stall detection
    if (last4.length === 4) {
      const weights = last4.map(getTopWeight);
      const reps = last4.map((s) => s.reduce((acc, set) => acc + (set.reps ?? 0), 0));
      if (new Set(weights).size === 1 && new Set(reps).size === 1) {
        return {
          exerciseId,
          exerciseName,
          action: "increase",
          currentWeight,
          suggestedWeight: currentWeight + 2.5,
          reasoning: "Same weight and reps for 4 sessions — forced small jump",
          confidence: "medium",
        };
      }
    }

    return {
      exerciseId,
      exerciseName,
      action: "hold",
      currentWeight,
      reasoning: `Stay at ${currentWeight}kg — aim for ${max}/${max}/${max}`,
      confidence: "medium",
    };
  }

  if (exerciseType === "bodyweight") {
    const totalReps = sessionSets.map((sets) =>
      sets.reduce((acc, s) => acc + (s.reps ?? 0), 0)
    );
    const last3 = totalReps.slice(-3);
    if (last3.length >= 2 && last3[last3.length - 1] > last3[0]) {
      return {
        exerciseId,
        exerciseName,
        action: "hold",
        reasoning: "Rep count trending up — keep progressing",
        confidence: "medium",
      };
    }
    if (last3.length >= 3 && new Set(last3).size === 1) {
      return {
        exerciseId,
        exerciseName,
        action: "increase",
        reasoning: "Reps plateaued — consider adding weight",
        confidence: "medium",
      };
    }
    return noData;
  }

  return noData;
}
