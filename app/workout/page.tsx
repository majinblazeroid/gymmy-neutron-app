"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PreWorkout from "@/components/workout/PreWorkout";
import WarmupChecklist from "@/components/workout/WarmupChecklist";
import ExerciseLogger from "@/components/workout/ExerciseLogger";
import PostWorkout from "@/components/workout/PostWorkout";
import { WorkoutDay, Exercise, Warmup, WorkoutSet } from "@/lib/types";

type Step = "pre" | "warmup" | "exercises" | "post" | "saving" | "done" | "error";

const DRAFT_KEY = "gymmy_workout_draft";

interface SessionDraft {
  day: WorkoutDay;
  date: string;
  preFeeling: number;
  preNotes: string;
  warmupCompleted: boolean;
  sets: WorkoutSet[];
  postFeeling: number;
  postNotes: string;
}

function WorkoutContent() {
  const params = useSearchParams();
  const defaultDay = (params.get("day") as WorkoutDay) || "A";

  const [step, setStep] = useState<Step>(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) return (JSON.parse(raw).step as Step) ?? "pre";
    } catch {}
    return "pre";
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [warmups, setWarmups] = useState<Warmup[]>([]);
  const [session, setSession] = useState<SessionDraft>(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const { session: s } = JSON.parse(raw);
        if (s) return s;
      }
    } catch {}
    return {
      day: defaultDay,
      date: new Date().toISOString().split("T")[0],
      preFeeling: 3,
      preNotes: "",
      warmupCompleted: false,
      sets: [],
      postFeeling: 3,
      postNotes: "",
    };
  });

  useEffect(() => {
    if (step === "done" || step === "saving") return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, session })); } catch {}
  }, [step, session]);

  const fetchExercises = useCallback(async (day: WorkoutDay) => {
    try {
      const [exRes, wmRes] = await Promise.all([
        fetch(`/api/templates?day=${day}`),
        fetch(`/api/warmups?day=${day}`),
      ]);
      if (exRes.ok) setExercises(await exRes.json());
      if (wmRes.ok) setWarmups(await wmRes.json());
    } catch {
      // Supabase not connected
    }
  }, []);

  useEffect(() => {
    fetchExercises(session.day);
  }, [session.day, fetchExercises]);

  async function saveWorkout(postFeeling: number, postNotes: string) {
    setStep("saving");
    setSaveError(null);
    const payload = { ...session, postFeeling, postNotes };
    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSaveError(body.error ?? `Server error ${res.status}. Check Supabase RLS is disabled.`);
        setStep("error");
        return;
      }
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      setStep("done");
    } catch {
      setSaveError("Network error — check your connection.");
      setStep("error");
    }
  }

  if (step === "saving") {
    return (
      <div className="py-20 flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-gray-200 border-t-[#6c757d] animate-spin" />
        <p className="text-gray-400 text-sm">Saving your session...</p>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="py-12 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#495057] tracking-tight">Save failed</h2>
          <p className="text-gray-400 text-sm mt-1">Something went wrong</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-red-600 text-sm">{saveError}</p>
        </div>
        <p className="text-gray-400 text-sm">
          Go to Supabase → SQL Editor and run{" "}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 text-xs">002_disable_rls.sql</code>
          , then try again.
        </p>
        <button
          onClick={() => setStep("post")}
          className="w-full bg-[#6c757d] hover:bg-[#5a6268] text-white rounded-2xl py-4 font-semibold text-base transition-colors"
        >
          Go back and retry
        </button>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="py-20 flex flex-col items-center gap-6 text-center">
        <div className="text-5xl">🏋️</div>
        <div>
          <h2 className="text-2xl font-bold text-[#495057] tracking-tight">Session saved</h2>
          <p className="text-gray-400 text-sm mt-2">Great work. See you next time.</p>
        </div>
        <button
          onClick={() => { try { localStorage.removeItem(DRAFT_KEY); } catch {} setStep("pre"); setSession(s => ({ ...s, sets: [] })); }}
          className="text-sm text-gray-400 underline underline-offset-2 hover:text-gray-600 transition-colors"
        >
          Log another session
        </button>
      </div>
    );
  }

  if (step === "pre") {
    return (
      <PreWorkout
        day={session.day}
        date={session.date}
        feeling={session.preFeeling}
        notes={session.preNotes}
        onChange={(d, f, n) => setSession(s => ({ ...s, day: d, preFeeling: f, preNotes: n }))}
        onDateChange={(date) => setSession(s => ({ ...s, date }))}
        onStart={() => setStep("warmup")}
      />
    );
  }

  if (step === "warmup") {
    return (
      <WarmupChecklist
        warmups={warmups}
        onDone={(completed) => {
          setSession(s => ({ ...s, warmupCompleted: completed }));
          setStep("exercises");
        }}
      />
    );
  }

  if (step === "exercises") {
    return (
      <ExerciseLogger
        exercises={exercises}
        day={session.day}
        sets={session.sets}
        onSetsChange={(sets) => setSession(s => ({ ...s, sets }))}
        onFinish={() => setStep("post")}
      />
    );
  }

  if (step === "post") {
    return (
      <PostWorkout
        sets={session.sets}
        exercises={exercises}
        feeling={session.postFeeling}
        notes={session.postNotes}
        onSave={saveWorkout}
      />
    );
  }

  return null;
}

export default function WorkoutPage() {
  return (
    <Suspense fallback={
      <div className="py-20 flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-gray-200 border-t-[#6c757d] animate-spin" />
      </div>
    }>
      <WorkoutContent />
    </Suspense>
  );
}