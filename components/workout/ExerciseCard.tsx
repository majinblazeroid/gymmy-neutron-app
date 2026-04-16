"use client";

import { useState } from "react";
import { Exercise, WorkoutSet, BackExtensionMode, WeightUnit } from "@/lib/types";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import SetInput from "./SetInput";
import { cn } from "@/lib/utils";

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

export default function ExerciseCard({ exercise, sets, onSetsChange }: ExerciseCardProps) {
  const isBackExtension = exercise.name === "Back Extensions";
  const isFrontRackCarry = exercise.name === "Front Rack Carry";
  const [mode, setMode]               = useState<BackExtensionMode>("reps");
  const [unit, setUnit]               = useState<WeightUnit>(exercise.defaultUnit ?? "kg");
  const [showNotes, setShowNotes]     = useState(false);

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

  const effectiveType = isBackExtension
    ? mode === "hold" ? "timed" : mode === "weighted" ? "weighted" : "bodyweight"
    : exercise.type;

  const hasNotes = isFrontRackCarry || !!exercise.notes;

  return (
    // Pure white card — no color here, color lives in the parent panel
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
              onUnitChange={setUnit}
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