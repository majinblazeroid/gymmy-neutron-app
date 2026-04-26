"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { WorkoutSession, BJJSession } from "@/lib/types";
import { Dumbbell, Shield, ChevronDown, ChevronUp, TrendingUp, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatDistance,
  formatDuration,
  formatPace,
  paceLabel,
} from "@/lib/runUtils";
import { useRunUnit } from "@/lib/useRunUnit";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface RunSession {
  id: string;
  date: string;
  duration_seconds: number | null;
  distance_meters: number | null;
  avg_pace_sec_per_km: number | null;
  elevation_gain_meters: number | null;
  notes: string | null;
}

type SessionEntry =
  | { type: "gym"; data: WorkoutSession }
  | { type: "bjj"; data: BJJSession };

type Filter = "all" | "gym" | "bjj" | "run";
type View   = "log" | "charts";

interface ExerciseStat {
  name: string;
  isBodyweight: boolean;
  current: number;
  previous: number | null;
  oldest: number | null;
  unit: string;
}

function buildExerciseStat(sessions: WorkoutSession[], exerciseId: string): ExerciseStat | null {
  const points: { value: number; isBodyweight: boolean; unit: string }[] = [];

  for (const s of [...sessions].sort((a, b) => a.date.localeCompare(b.date))) {
    const ws = (s.sets ?? []).filter((w) => w.exerciseId === exerciseId && !w.isWarmup);
    if (!ws.length) continue;

    const hasWeight = ws.some((w) => (w.weight ?? 0) > 0);
    if (hasWeight) {
      const avg = ws.reduce((a, w) => a + (w.weight ?? 0), 0) / ws.length;
      const unit = ws.find((w) => w.unit)?.unit ?? "kg";
      points.push({ value: Math.round(avg * 10) / 10, isBodyweight: false, unit });
    } else {
      const setsWithReps = ws.filter((w) => (w.reps ?? 0) > 0);
      if (!setsWithReps.length) continue;
      const avg = setsWithReps.reduce((a, w) => a + (w.reps ?? 0), 0) / setsWithReps.length;
      points.push({ value: Math.round(avg * 10) / 10, isBodyweight: true, unit: "reps" });
    }
  }

  if (!points.length) return null;

  const last = points[points.length - 1];
  return {
    name: "",
    isBodyweight: last.isBodyweight,
    current:  last.value,
    previous: points.length >= 2 ? points[points.length - 2].value : null,
    oldest:   points.length >= 2 ? points[0].value : null,
    unit:     last.unit,
  };
}

function Delta({ current, compare, label }: { current: number; compare: number; label: string }) {
  const diff = Math.round((current - compare) * 10) / 10;
  if (diff === 0) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs text-gray-400 font-medium">— {label}</span>
      </div>
    );
  }
  const up = diff > 0;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-sm font-bold ${up ? "text-green-500" : "text-red-400"}`}>
        {up ? "↑" : "↓"} {Math.abs(diff)}
      </span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}

function ExerciseStatCard({ stat, name }: { stat: ExerciseStat; name: string }) {
  return (
    <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-white/80">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{name}</p>
          <p className="text-2xl font-bold text-[#495057] leading-none">
            {stat.current}
            <span className="text-sm font-medium text-gray-400 ml-1">{stat.unit}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {stat.isBodyweight ? "avg reps / set" : "avg working weight"}
          </p>
        </div>
        {(stat.previous !== null || stat.oldest !== null) && (
          <div className="flex gap-5">
            {stat.previous !== null && (
              <Delta current={stat.current} compare={stat.previous} label="vs last" />
            )}
            {stat.oldest !== null && stat.oldest !== stat.previous && (
              <Delta current={stat.current} compare={stat.oldest} label="vs first" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [filter,   setFilter]   = useState<Filter>("all");
  const [view,     setView]     = useState<View>("log");
  const [expanded, setExpanded] = useState<string | null>(null);
  const { unit } = useRunUnit();
  const router = useRouter();

  const { data: gym, isLoading: gymLoading, mutate: mutateGym }     = useSWR<WorkoutSession[]>("/api/workouts", fetcher);
  const { data: bjj, isLoading: bjjLoading, mutate: mutateBJJ }     = useSWR<BJJSession[]>("/api/bjj", fetcher);
  const { data: runs, isLoading: runsLoading, mutate: mutateRuns }  = useSWR<RunSession[]>("/api/runs", fetcher);

  useEffect(() => {
    let startY = 0;
    const onStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onEnd   = (e: TouchEvent) => {
      const delta = e.changedTouches[0].clientY - startY;
      if (delta > 60 && window.scrollY === 0) { mutateGym(); mutateBJJ(); mutateRuns(); }
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend",   onEnd,   { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend",   onEnd);
    };
  }, [mutateGym, mutateBJJ, mutateRuns]);

  const loading     = gymLoading || bjjLoading || runsLoading;
  const gymSessions = gym ?? [];
  const runSessions = runs ?? [];

  const gymEntries = (gym ?? []).map((d) => ({ type: "gym" as const, data: d }));
  const bjjEntries = (bjj ?? []).map((d) => ({ type: "bjj" as const, data: d }));

  const sessions: SessionEntry[] = [
    ...gymEntries,
    ...bjjEntries,
  ].sort((a, b) => b.data.date.localeCompare(a.data.date));

  const filteredSessions = sessions.filter((s) =>
    filter === "all" || filter === s.type
  );
  const filteredRuns = runSessions; // always show all runs when filter is "run"

  const showGym  = (filter === "all" || filter === "gym")  && gymEntries.length > 0;
  const showBjj  = (filter === "all" || filter === "bjj")  && bjjEntries.length > 0;
  const showRuns = (filter === "all" || filter === "run")  && runSessions.length > 0;

  return (
    <div className="pt-8 pb-6 space-y-8">

      <h2 className="text-3xl font-bold text-[#495057] tracking-tight">History</h2>

      {/* View toggle pill */}
      <div className="flex gap-1.5 bg-gray-100 rounded-2xl p-1">
        <button
          onClick={() => setView("log")}
          className={cn("flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all",
            view === "log" ? "bg-white text-[#495057] shadow-sm" : "text-gray-400")}
        >
          Session Log
        </button>
        <button
          onClick={() => setView("charts")}
          className={cn("flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all",
            view === "charts" ? "bg-white text-[#495057] shadow-sm" : "text-gray-400")}
        >
          <TrendingUp size={14} />
          Progress
        </button>
      </div>

      {/* ── Charts view ── */}
      {view === "charts" && (
        <>
          {loading && <p className="text-gray-400 text-sm">Loading...</p>}
          {!loading && gymSessions.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm">
              No workout data yet. Log some sessions first.
            </div>
          )}
          {!loading && gymSessions.length > 0 && (() => {
            const allSets = gymSessions.flatMap((s) => s.sets ?? []).filter((w) => !w.isWarmup);
            const ids = [...new Set(allSets.map((w) => w.exerciseId))];
            return (
              <section className="rounded-3xl p-5 space-y-3" style={{ background: "rgba(173, 247, 182, 0.20)" }}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Gym progress</p>
                {ids.map((id) => {
                  const name = allSets.find((w) => w.exerciseId === id)?.exerciseName ?? id;
                  const stat = buildExerciseStat(gymSessions, id);
                  if (!stat) return null;
                  return <ExerciseStatCard key={id} stat={stat} name={name} />;
                })}
              </section>
            );
          })()}
        </>
      )}

      {/* ── Log view ── */}
      {view === "log" && (
        <>
          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap">
            {(["all", "gym", "bjj", "run"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn("px-5 py-2.5 rounded-full text-sm font-semibold capitalize transition-all",
                  filter === f
                    ? "bg-[#6c757d] text-white shadow-sm"
                    : "bg-white text-gray-400 border border-gray-100 shadow-sm")}
              >
                {f}
              </button>
            ))}
          </div>

          {loading && <p className="text-gray-400 text-sm">Loading...</p>}
          {!loading && !showGym && !showBjj && !showRuns && (
            <div className="text-center py-16 text-gray-400 text-sm">No sessions yet.</div>
          )}

          {!loading && (
            <div className="space-y-6">
              {showGym && (
                <section className="rounded-3xl p-5 space-y-3" style={{ background: "rgba(173, 247, 182, 0.20)" }}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Gym</p>
                  {filteredSessions
                    .filter((e) => e.type === "gym")
                    .map((entry) => (
                      <SessionCard key={entry.data.id ?? ""} entry={entry} expanded={expanded} setExpanded={setExpanded} />
                    ))}
                </section>
              )}

              {showBjj && (
                <section className="rounded-3xl p-5 space-y-3" style={{ background: "rgba(255, 192, 159, 0.22)" }}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">BJJ</p>
                  {filteredSessions
                    .filter((e) => e.type === "bjj")
                    .map((entry) => (
                      <SessionCard key={entry.data.id ?? ""} entry={entry} expanded={expanded} setExpanded={setExpanded} />
                    ))}
                </section>
              )}

              {showRuns && (
                <section className="rounded-3xl p-5 space-y-3" style={{ background: "rgba(121, 173, 220, 0.18)" }}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Running</p>
                  {filteredRuns.map((run) => (
                    <button
                      key={run.id}
                      onClick={() => router.push(`/run/${run.id}`)}
                      className="w-full bg-white rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm border border-white/80 active:opacity-80 transition-opacity text-left"
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#79addc]/20">
                        <Activity size={15} style={{ color: "#3a7baa" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#495057] font-semibold text-sm">
                          {run.distance_meters != null
                            ? `${formatDistance(run.distance_meters, unit)} ${unit}`
                            : "Run"}
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {run.date}
                          {run.duration_seconds != null
                            ? ` · ${formatDuration(run.duration_seconds)}`
                            : ""}
                          {run.avg_pace_sec_per_km != null
                            ? ` · ${formatPace(run.avg_pace_sec_per_km, unit)}${paceLabel(unit)}`
                            : ""}
                        </p>
                      </div>
                      <ChevronDown size={15} className="text-gray-300 flex-shrink-0 -rotate-90" />
                    </button>
                  ))}
                </section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SessionCard({ entry, expanded, setExpanded }: {
  entry: SessionEntry;
  expanded: string | null;
  setExpanded: (id: string | null) => void;
}) {
  const id     = entry.data.id ?? "";
  const isOpen = expanded === id;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-white/80">
      <button
        onClick={() => setExpanded(isOpen ? null : id)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
      >
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
          entry.type === "gym" ? "bg-[#adf7b6]/30" : "bg-[#ffc09f]/30"
        )}>
          {entry.type === "gym"
            ? <Dumbbell size={15} style={{ color: "#2d8a5e" }} />
            : <Shield   size={15} style={{ color: "#b55e2a" }} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#495057] font-semibold text-sm">
            {entry.type === "gym"
              ? `Day ${(entry.data as WorkoutSession).day}`
              : `BJJ — ${(entry.data as BJJSession).classType}`}
          </p>
          <p className="text-gray-400 text-xs mt-0.5">{entry.data.date}</p>
        </div>
        {isOpen
          ? <ChevronUp   size={15} className="text-gray-300 flex-shrink-0" />
          : <ChevronDown size={15} className="text-gray-300 flex-shrink-0" />}
      </button>

      {isOpen && entry.type === "bjj" && (
        <div className="px-5 pb-4 space-y-2 border-t border-gray-100 pt-3">
          <p className="text-gray-500 text-sm">
            <span className="text-gray-700 font-medium">Intensity:</span>{" "}
            {(entry.data as BJJSession).intensity}/5
          </p>
          {(entry.data as BJJSession).techniques && (
            <p className="text-gray-500 text-sm">
              <span className="text-gray-700 font-medium">Techniques:</span>{" "}
              {(entry.data as BJJSession).techniques}
            </p>
          )}
          {(entry.data as BJJSession).rounds && (
            <p className="text-gray-500 text-sm">
              <span className="text-gray-700 font-medium">Rounds:</span>{" "}
              {(entry.data as BJJSession).rounds}
            </p>
          )}
        </div>
      )}

      {isOpen && entry.type === "gym" && (() => {
        const workingSets = ((entry.data as WorkoutSession).sets ?? []).filter((s) => !s.isWarmup);
        const byExercise = workingSets.reduce<Record<string, typeof workingSets>>((acc, s) => {
          const key = s.exerciseName ?? s.exerciseId;
          (acc[key] ??= []).push(s);
          return acc;
        }, {});
        const exercises = Object.entries(byExercise);
        return (
          <div className="px-5 pb-4 border-t border-gray-100 pt-3 space-y-3">
            {exercises.length === 0 && (
              <p className="text-gray-400 text-sm">No sets logged</p>
            )}
            {exercises.map(([name, sets]) => (
              <div key={name}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{name}</p>
                <div className="space-y-0.5">
                  {sets.map((s, i) => (
                    <p key={i} className="text-gray-500 text-sm">
                      Set {s.setNumber}
                      {s.weight != null ? ` · ${s.weight}${s.unit ?? "kg"}` : ""}
                      {s.reps != null ? ` × ${s.reps}` : ""}
                      {s.durationSeconds != null ? ` · ${s.durationSeconds}s` : ""}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
