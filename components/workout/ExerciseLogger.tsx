"use client";

import { useState } from "react";
import { Exercise, WorkoutSet, WorkoutDay } from "@/lib/types";
import ExerciseCard from "./ExerciseCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ExerciseLoggerProps {
  exercises: Exercise[];
  day: WorkoutDay;
  sets: WorkoutSet[];
  onSetsChange: (sets: WorkoutSet[]) => void;
  onFinish: () => void;
}

// Mint for gym — the card floats inside a very subtle mint panel
const PANEL_BG = "rgba(173, 247, 182, 0.18)";

export default function ExerciseLogger({ exercises, day, sets, onSetsChange, onFinish }: ExerciseLoggerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const getSetsFor  = (id: string) => sets.filter((s) => s.exerciseId === id);
  const updateSetsFor = (id: string, newSets: WorkoutSet[]) =>
    onSetsChange([...sets.filter((s) => s.exerciseId !== id), ...newSets]);

  if (exercises.length === 0) {
    return (
      <div className="pt-8 pb-6 space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-[#495057] tracking-tight">Day {day}</h2>
          <p className="text-gray-400 text-sm mt-1.5">No exercises loaded</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center shadow-sm">
          <p className="text-gray-400 text-sm">Connect Supabase to see your workout template.</p>
        </div>
        <button onClick={onFinish} className="w-full bg-[#6c757d] text-white rounded-2xl py-5 font-semibold">
          Finish Workout
        </button>
      </div>
    );
  }

  const isFirst   = currentIndex === 0;
  const isLast    = currentIndex === exercises.length - 1;
  const current   = exercises[currentIndex];
  const progress  = ((currentIndex + 1) / exercises.length) * 100;

  return (
    <div className="pt-8 pb-6 space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-[#495057] tracking-tight">Day {day}</h2>
        <p className="text-gray-400 text-sm mt-1.5">
          {currentIndex + 1} of {exercises.length} exercises
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#6c757d] rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Card floats inside mint panel */}
      <section
        className="rounded-3xl p-4"
        style={{ background: PANEL_BG }}
      >
        <ExerciseCard
          key={current.id}
          exercise={current}
          sets={getSetsFor(current.id)}
          onSetsChange={(s) => updateSetsFor(current.id, s)}
        />
      </section>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => setCurrentIndex((i) => i - 1)}
          disabled={isFirst}
          className="flex items-center gap-2 px-5 py-4 bg-white border border-gray-100 text-gray-600 rounded-2xl font-semibold text-sm shadow-sm disabled:opacity-25 transition-opacity"
        >
          <ChevronLeft size={16} />
          Back
        </button>

        {isLast ? (
          <button
            onClick={onFinish}
            className="flex-1 bg-[#6c757d] hover:bg-[#5a6268] text-white rounded-2xl py-4 font-semibold text-sm transition-colors shadow-sm"
          >
            Finish Workout
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex((i) => i + 1)}
            className="flex-1 bg-[#6c757d] hover:bg-[#5a6268] text-white rounded-2xl py-4 font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            Next
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 pt-1">
        {exercises.map((_, i) => {
          const hasSets = getSetsFor(exercises[i].id).length > 0;
          return (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`rounded-full transition-all ${
                i === currentIndex ? "w-5 h-2 bg-[#6c757d]"
                : hasSets          ? "w-2 h-2 bg-gray-400"
                                   : "w-2 h-2 bg-gray-200"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}