"use client";

import { Dumbbell } from "lucide-react";
import FeelingRating from "@/components/shared/FeelingRating";
import { WorkoutDay } from "@/lib/types";

interface PreWorkoutProps {
  day: WorkoutDay;
  feeling: number;
  notes: string;
  onChange: (day: WorkoutDay, feeling: number, notes: string) => void;
  onStart: () => void;
}

// Celadon — gym panel
const PANEL_BG = "rgba(173, 247, 182, 0.20)";

export default function PreWorkout({ day, feeling, notes, onChange, onStart }: PreWorkoutProps) {
  return (
    <div className="pt-8 pb-6 space-y-8">

      <div>
        <h2 className="text-3xl font-bold text-[#495057] tracking-tight">Start Workout</h2>
        <p className="text-gray-400 text-sm mt-1.5">Pick your day and check in</p>
      </div>

      {/* Day selector — celadon panel, white cards inside */}
      <section className="rounded-3xl p-5 space-y-3" style={{ background: PANEL_BG }}>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Select day</p>

        <div className="space-y-3">
          {(["A", "B"] as WorkoutDay[]).map((d) => {
            const selected = day === d;
            return (
              <button
                key={d}
                onClick={() => onChange(d, feeling, notes)}
                className="w-full bg-white rounded-2xl px-5 py-5 flex items-center gap-4 shadow-sm border border-white/80 text-left transition-opacity active:opacity-70"
                style={{ opacity: selected ? 1 : 0.5 }}
              >
                <Dumbbell size={18} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#495057] text-base">Day {d}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {d === "A" ? "Primary lifts" : "Accessory work"}
                  </p>
                </div>
                {selected && <div className="ml-auto w-2 h-2 rounded-full bg-[#6c757d] flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Feeling — white panel */}
      <section className="bg-white rounded-3xl p-5 space-y-4 shadow-sm border border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">How are you feeling?</p>
        <FeelingRating value={feeling} onChange={(f) => onChange(day, f, notes)} />
      </section>

      {/* Notes */}
      <section className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">Pre-workout notes</p>
        <textarea
          value={notes}
          onChange={(e) => onChange(day, feeling, e.target.value)}
          placeholder="e.g. slept well, right shoulder tight..."
          className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-[#495057] text-sm resize-none h-24 focus:outline-none focus:border-gray-300 placeholder:text-gray-300 shadow-sm"
        />
      </section>

      <button
        onClick={onStart}
        className="w-full bg-[#6c757d] hover:bg-[#5a6268] text-white rounded-2xl py-5 font-semibold text-base transition-colors shadow-sm"
      >
        Start Workout
      </button>
    </div>
  );
}
