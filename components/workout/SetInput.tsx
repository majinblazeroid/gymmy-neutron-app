"use client";

import { WorkoutSet, WeightUnit } from "@/lib/types";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SetInputProps {
  set: WorkoutSet;
  index: number;
  exerciseType: "weighted" | "bodyweight" | "timed" | "timed_carry" | "unilateral";
  unit: WeightUnit;
  onUnitChange: (u: WeightUnit) => void;
  onChange: (set: WorkoutSet) => void;
  onRemove: () => void;
}

function NumInput({
  value,
  onChange,
  placeholder,
  min = 0,
  className,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder: string;
  min?: number;
  className?: string;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      min={min}
      value={value ?? ""}
      onChange={(e) => {
        if (e.target.value === "") { onChange(undefined); return; }
        const v = parseFloat(e.target.value);
        if (!isNaN(v) && v >= min) onChange(v);
      }}
      placeholder={placeholder}
      className={cn(
        "bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[#495057] text-sm text-center focus:outline-none focus:border-gray-400 focus:bg-white w-full placeholder:text-gray-300 transition-colors",
        className
      )}
    />
  );
}

function UnitToggle({ unit, onChange }: { unit: WeightUnit; onChange: (u: WeightUnit) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(unit === "kg" ? "lbs" : "kg")}
      className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 hover:bg-gray-100 transition-colors whitespace-nowrap font-medium"
    >
      {unit}
    </button>
  );
}

export default function SetInput({ set, index, exerciseType, unit, onUnitChange, onChange, onRemove }: SetInputProps) {
  const update = (patch: Partial<WorkoutSet>) => onChange({ ...set, ...patch });

  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-300 text-xs w-5 text-center flex-shrink-0 font-medium">{index + 1}</span>

      {/* Weighted */}
      {(exerciseType === "weighted" || exerciseType === "timed_carry") && (
        <>
          <NumInput value={set.weight} onChange={(v) => update({ weight: v })} placeholder="wt" />
          <UnitToggle unit={unit} onChange={onUnitChange} />
          {exerciseType === "weighted" && (
            <NumInput value={set.reps} onChange={(v) => update({ reps: v })} placeholder="reps" />
          )}
          {exerciseType === "timed_carry" && (
            <NumInput value={set.durationSeconds} onChange={(v) => update({ durationSeconds: v })} placeholder="sec" />
          )}
        </>
      )}

      {/* Bodyweight */}
      {exerciseType === "bodyweight" && (
        <NumInput value={set.reps} onChange={(v) => update({ reps: v })} placeholder="reps" />
      )}

      {/* Timed */}
      {exerciseType === "timed" && (
        <NumInput value={set.durationSeconds} onChange={(v) => update({ durationSeconds: v })} placeholder="sec" />
      )}

      {/* Unilateral */}
      {exerciseType === "unilateral" && (
        <>
          <select
            value={set.side ?? "left"}
            onChange={(e) => update({ side: e.target.value as "left" | "right" })}
            className="bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-[#495057] text-xs focus:outline-none"
          >
            <option value="left">L</option>
            <option value="right">R</option>
          </select>
          <NumInput value={set.reps} onChange={(v) => update({ reps: v })} placeholder="reps" />
        </>
      )}

      {/* Warmup toggle */}
      <label className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0 cursor-pointer">
        <input
          type="checkbox"
          checked={set.isWarmup}
          onChange={(e) => update({ isWarmup: e.target.checked })}
          className="accent-gray-700 w-3.5 h-3.5"
        />
        W
      </label>

      <button onClick={onRemove} className="text-gray-300 hover:text-red-400 flex-shrink-0 transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}