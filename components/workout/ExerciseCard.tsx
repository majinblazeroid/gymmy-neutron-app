"use client";

import { useState, useEffect } from "react";
import { Exercise, WorkoutSet, BackExtensionMode, WeightUnit } from "@/lib/types";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import SetInput from "./SetInput";
import { cn } from "@/lib/utils";
import {
  ProgressionResult,
  ACTION_NO_DATA,
  ACTION_INCREASE_WAVE,
  ACTION_HOLD,
  ACTION_DELOAD_SMART,
  ACTION_DELOAD_FULL,
  ACTION_BAD_DAY_RECOVERY,
  ACTION_RAMP_UP,
  ACTION_ADD_WEIGHT_BW,
  ACTION_INCREASE_REPS_BW,
} from "@/lib/progressionV2";

interface ExerciseCardProps {
  exercise: Exercise;
  sets: WorkoutSet[];
  onSetsChange: (sets: WorkoutSet[]) => void;
}

const MODES: { value: BackExtensionMode; label: string }[] = [
  { value: "hold",     label: "Hold" },
  { value: "reps",     label: "Reps" },
  { value: "weighted", label: "Weighted" },
];

// ── Suggestion display helpers ────────────────────────────────────────────────

interface SuggestionStyle {
  bg: string;
  text: string;
  border: string;
  icon: string;
  label: string;
}

function getSuggestionStyle(action: string): SuggestionStyle {
  switch (action) {
    case ACTION_INCREASE_WAVE:
      return { bg: "bg-green-50", text: "text-green-700", border: "border-green-100", icon: "↑", label: "Increase" };
    case ACTION_DELOAD_SMART:
      return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", icon: "↘", label: "Smart deload" };
    case ACTION_DELOAD_FULL:
      return { bg: "bg-red-50", text: "text-red-600", border: "border-red-100", icon: "⬇", label: "Full deload" };
    case ACTION_BAD_DAY_RECOVERY:
      return { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100", icon: "⟳", label: "Recovery" };
    case ACTION_RAMP_UP:
      return { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100", icon: "↗", label: "Ramp up" };
    case ACTION_ADD_WEIGHT_BW:
      return { bg: "bg-green-50", text: "text-green-700", border: "border-green-100", icon: "↑", label: "Add weight" };
    case ACTION_INCREASE_REPS_BW:
      return { bg: "bg-green-50", text: "text-green-700", border: "border-green-100", icon: "+", label: "Add reps" };
    default: // hold
      return { bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-100", icon: "—", label: "Hold" };
  }
}

function getSuggestionSummary(result: ProgressionResult): string {
  const { action, suggestedSets } = result;
  const u = result.unit ?? "kg";

  if (action === ACTION_INCREASE_WAVE) {
    const bumped = suggestedSets.find((s) => s.note.includes("↑"));
    if (bumped) return `Bump set ${bumped.setNumber} → ${bumped.weight}${u}`;
    return "Increase";
  }
  if (action === ACTION_HOLD) {
    const tw = suggestedSets.length > 0 ? Math.max(...suggestedSets.map((s) => s.weight)) : null;
    return tw ? `Hold at ${tw}${u}` : "Hold";
  }
  if (action === ACTION_DELOAD_SMART) {
    const feeder = suggestedSets[0];
    return feeder ? `Smart deload — feeder sets at ${feeder.weight}${u}` : "Smart deload";
  }
  if (action === ACTION_DELOAD_FULL) {
    const w = suggestedSets[0]?.weight;
    return w != null ? `Full deload → ${w}${u}` : "Full deload";
  }
  if (action === ACTION_BAD_DAY_RECOVERY) {
    return "Recovery — match last good session";
  }
  if (action === ACTION_RAMP_UP) {
    return "Ramp up — gap detected (>14 days)";
  }
  if (action === ACTION_ADD_WEIGHT_BW) return "Add weight or increase reps target";
  if (action === ACTION_INCREASE_REPS_BW) return "Add 1–2 reps per set";
  return "";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExerciseCard({ exercise, sets, onSetsChange }: ExerciseCardProps) {
  const isBackExtension = exercise.name === "Back Extensions";
  const isFrontRackCarry = exercise.name === "Front Rack Carry";
  const [mode, setMode]               = useState<BackExtensionMode>("reps");
  const [unit, setUnit]               = useState<WeightUnit>(exercise.defaultUnit ?? "kg");
  const [showNotes, setShowNotes]     = useState(false);
  const [suggestion, setSuggestion]   = useState<ProgressionResult | null>(null);

  const effectiveType = isBackExtension
    ? mode === "hold" ? "timed" : mode === "weighted" ? "weighted" : "bodyweight"
    : exercise.type;

  const hasNotes = isFrontRackCarry || !!exercise.notes;

  // Fetch progression suggestion for weighted / timed_carry / bodyweight exercises
  useEffect(() => {
    const fetchableTypes = ["weighted", "bodyweight"];
    if (!fetchableTypes.includes(exercise.type)) return;

    const params = new URLSearchParams({
      exerciseId:    exercise.id,
      exerciseName:  exercise.name,
      exerciseType:  exercise.type,
      suggestedReps: exercise.suggestedReps,
      suggestedSets: String(exercise.suggestedSets),
    });

    fetch(`/api/progression?${params}`)
      .then((r) => r.json())
      .then((data: ProgressionResult) => {
        // Don't show anything if there's no data yet
        if (data.action !== ACTION_NO_DATA) setSuggestion(data);
      })
      .catch(() => {/* offline — skip silently */});
  }, [exercise.id, exercise.name, exercise.type, exercise.suggestedReps, exercise.suggestedSets]);

  const handleUnitChange = (newUnit: WeightUnit) => {
    setUnit(newUnit);
    onSetsChange(sets.map((s) => ({ ...s, unit: newUnit })));
  };

  const addSet = () => {
    onSetsChange([...sets, {
      exerciseId: exercise.id,
      setNumber:  sets.length + 1,
      isWarmup:   false,
      unit,
    }]);
  };

  const updateSet = (i: number, updated: WorkoutSet) => {
    const next = [...sets]; next[i] = updated; onSetsChange(next);
  };

  const removeSet = (i: number) =>
    onSetsChange(sets.filter((_, j) => j !== i).map((s, j) => ({ ...s, setNumber: j + 1 })));

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-white/80">

      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-bold text-[#495057] text-lg leading-tight">{exercise.name}</h3>
            <p className="text-gray-400 text-sm mt-1">
              {exercise.suggestedSets} sets × {exercise.suggestedReps}
              {exercise.defaultUnit ? ` · ${exercise.defaultUnit}` : ""}
            </p>
          </div>
          {hasNotes && (
            <button
              onClick={() => setShowNotes((v) => !v)}
              className="text-gray-300 hover:text-gray-500 p-1 flex-shrink-0 transition-colors"
            >
              {showNotes ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          )}
        </div>

        {showNotes && hasNotes && (
          <div className="mt-3 bg-gray-50 rounded-xl px-4 py-3 space-y-1">
            {isFrontRackCarry && (
              <p className="text-gray-500 text-xs">Format: 10s per leg, 40s total per set</p>
            )}
            {exercise.notes && <p className="text-gray-500 text-xs">{exercise.notes}</p>}
          </div>
        )}

        {/* Back Extensions mode switcher */}
        {isBackExtension && (
          <div className="flex gap-1 mt-4 bg-gray-100 rounded-xl p-1">
            {MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors",
                  mode === m.value
                    ? "bg-white text-[#495057] shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        {/* Progression suggestion */}
        {suggestion && (
          <SuggestionBanner result={suggestion} />
        )}
      </div>

      {/* Sets */}
      {sets.length > 0 && (
        <div className="px-5 space-y-2.5 pb-3">
          {sets.map((set, i) => (
            <SetInput
              key={i}
              set={set}
              index={i}
              exerciseType={effectiveType as Exercise["type"]}
              unit={unit}
              onUnitChange={handleUnitChange}
              onChange={(updated) => updateSet(i, updated)}
              onRemove={() => removeSet(i)}
            />
          ))}
        </div>
      )}

      {/* Add set */}
      <div className="px-5 pb-5">
        <button
          onClick={addSet}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-200 rounded-xl py-3 text-gray-400 hover:text-gray-600 hover:border-gray-300 text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          Add Set
        </button>
      </div>
    </div>
  );
}

// ── Suggestion banner ─────────────────────────────────────────────────────────

function SuggestionBanner({ result }: { result: ProgressionResult }) {
  const style   = getSuggestionStyle(result.action);
  const summary = getSuggestionSummary(result);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`mt-4 rounded-xl border ${style.bg} ${style.border} overflow-hidden`}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-2.5 flex items-center gap-2 text-left"
      >
        <span className={`text-sm font-bold ${style.text} leading-none`}>{style.icon}</span>
        <span className={`text-xs font-semibold ${style.text} flex-1`}>{summary}</span>
        {/* Suggested weights inline */}
        {result.suggestedSets.length > 0 && !expanded && (
          <span className={`text-xs ${style.text} opacity-60 font-mono`}>
            {result.suggestedSets.map((s) => `${s.weight}`).join(" / ")}
          </span>
        )}
        <span className={`text-xs ${style.text} opacity-40 ml-1`}>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className={`px-4 pb-3 border-t ${style.border}`}>
          {/* Set-by-set breakdown */}
          {result.suggestedSets.length > 0 && (
            <div className="mt-2.5 space-y-1">
              {result.suggestedSets.map((s) => {
                const isUp = s.note.includes("↑") || s.note.includes("+2.5") || s.note.includes("ramp");
                return (
                  <div key={s.setNumber} className="flex items-center gap-2">
                    <span className={`text-xs ${style.text} opacity-50 w-10`}>Set {s.setNumber}</span>
                    <span className={`text-xs font-semibold ${style.text}`}>
                      {s.weight}{result.unit ?? "kg"} × {s.targetReps}
                    </span>
                    {isUp && (
                      <span className={`text-xs ${style.text} opacity-70`}>↑</span>
                    )}
                    <span className={`text-xs ${style.text} opacity-40 ml-auto`}>{s.note}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Confidence */}
          <p className={`text-xs ${style.text} opacity-40 mt-2`}>
            Confidence: {result.confidence}
          </p>
        </div>
      )}
    </div>
  );
}
