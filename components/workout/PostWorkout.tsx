"use client";

import { useState } from "react";
import FeelingRating from "@/components/shared/FeelingRating";
import { WorkoutSet } from "@/lib/types";

interface PostWorkoutProps {
  sets: WorkoutSet[];
  exercises?: unknown[];
  feeling: number;
  notes: string;
  onSave: (feeling: number, notes: string) => void;
}

export default function PostWorkout({ sets, feeling, notes, onSave }: PostWorkoutProps) {
  const [f, setF] = useState(feeling);
  const [n, setN] = useState(notes);

  const workingSets  = sets.filter((s) => !s.isWarmup);
  const totalVolume  = workingSets.reduce((acc, s) =>
    s.weight && s.reps ? acc + s.weight * s.reps : acc, 0);

  return (
    <div className="pt-8 pb-6 space-y-8">

      <div>
        <h2 className="text-3xl font-bold text-[#495057] tracking-tight">Wrap up</h2>
        <p className="text-gray-400 text-sm mt-1.5">How did it go?</p>
      </div>

      {/* Summary stats — mint panel */}
      <section
        className="rounded-3xl p-5 grid grid-cols-2 gap-4"
        style={{ background: "rgba(121, 173, 220, 0.18)" }}
      >
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-white/80">
          <p className="text-3xl font-bold text-[#495057] leading-none">{workingSets.length}</p>
          <p className="text-gray-400 text-xs mt-1.5">Working sets</p>
        </div>
        {totalVolume > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-white/80">
            <p className="text-3xl font-bold text-[#495057] leading-none">{totalVolume.toLocaleString()}</p>
            <p className="text-gray-400 text-xs mt-1.5">Total volume</p>
          </div>
        )}
      </section>

      {/* Feeling — white panel */}
      <section className="bg-white rounded-3xl p-5 space-y-4 shadow-sm border border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Post-workout feeling</p>
        <FeelingRating value={f} onChange={setF} color="#adf7b6" />
      </section>

      {/* Notes */}
      <section className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">Notes</p>
        <textarea
          value={n}
          onChange={(e) => setN(e.target.value)}
          placeholder="e.g. felt strong, left knee a bit sore..."
          className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-[#495057] text-sm resize-none h-24 focus:outline-none focus:border-gray-300 placeholder:text-gray-300 shadow-sm"
        />
      </section>

      <button
        onClick={() => onSave(f, n)}
        className="w-full rounded-2xl py-5 font-semibold text-base transition-opacity shadow-sm active:opacity-75 text-[#495057]"
        style={{ background: "#adf7b6" }}
      >
        Save Workout
      </button>
    </div>
  );
}