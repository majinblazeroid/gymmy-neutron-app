"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { WorkoutSession, BJJSession } from "@/lib/types";
import { ChevronDown, ChevronUp, ChevronRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistance, formatDuration, formatPace, paceLabel } from "@/lib/runUtils";
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

const FILTER_ACTIVE: Record<Filter, { bg: string; text: string }> = {
  all: { bg: "#495057", text: "#ffffff" },
  gym: { bg: "#adf7b6", text: "#495057" },
  bjj: { bg: "#ffc09f", text: "#495057" },
  run: { bg: "#79addc", text: "#495057" },
};

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
    current: last.value,
    previous: points.length >= 2 ? points[points.length - 2].value : null,
    oldest:   points.length >= 2 ? points[0].value : null,
    unit: last.unit,
  };
}

function Delta({ current, compare, label }: { current: number; compare: number; label: string }) {
  const diff = Math.round((current - compare) * 10) / 10;
  if (diff === 0) return <span className="text-xs text-gray-400">— {label}</span>;
  const up = diff > 0;
  return (
    <span className={`text-xs font-semibold ${up ? "text-green-500" : "text-red-400"}`}>
      {up ? "↑" : "↓"}{Math.abs(diff)} <span className="text-gray-400 font-normal">{label}</span>
    </span>
  );
}

function ExerciseStatRow({ stat, name }: { stat: ExerciseStat; name: string }) {
  return (
    <div className="py-5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">{name}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-4xl font-black text-[#495057] leading-none">
            {stat.current}
            <span className="text-lg font-semibold text-[#495057]/40 ml-1.5">{stat.unit}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1.5">
            {stat.isBodyweight ? "avg reps / set" : "avg working weight"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {stat.previous !== null && (
            <Delta current={stat.current} compare={stat.previous} label="vs last" />
          )}
          {stat.oldest !== null && stat.oldest !== stat.previous && (
            <Delta current={stat.current} compare={stat.oldest} label="vs first" />
          )}
        </div>
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

  const { data: gym, isLoading: gymLoading, mutate: mutateGym }    = useSWR<WorkoutSession[]>("/api/workouts", fetcher);
  const { data: bjj, isLoading: bjjLoading, mutate: mutateBJJ }    = useSWR<BJJSession[]>("/api/bjj", fetcher);
  const { data: runs, isLoading: runsLoading, mutate: mutateRuns } = useSWR<RunSession[]>("/api/runs", fetcher);

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

  const gymAEntries = gymEntries
    .filter((e) => (e.data as WorkoutSession).day === "A")
    .sort((a, b) => b.data.date.localeCompare(a.data.date));
  const gymBEntries = gymEntries
    .filter((e) => (e.data as WorkoutSession).day === "B")
    .sort((a, b) => b.data.date.localeCompare(a.data.date));
  const bjjSorted = [...bjjEntries]
    .sort((a, b) => b.data.date.localeCompare(a.data.date));

  const showGymA = (filter === "all" || filter === "gym") && gymAEntries.length > 0;
  const showGymB = (filter === "all" || filter === "gym") && gymBEntries.length > 0;
  const showBjj  = (filter === "all" || filter === "bjj") && bjjSorted.length > 0;
  const showRuns = (filter === "all" || filter === "run") && runSessions.length > 0;

  return (
    <div className="pt-8 pb-6 space-y-6">

      <h2 className="text-3xl font-bold text-[#495057] tracking-tight">History</h2>

      {/* View toggle */}
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

      {/* ── Progress view ── */}
      {view === "charts" && (
        <div>
          {loading && <p className="text-gray-400 text-sm">Loading...</p>}
          {!loading && gymSessions.length === 0 && (
            <p className="text-center py-16 text-gray-400 text-sm">No workout data yet.</p>
          )}
          {!loading && gymSessions.length > 0 && (() => {
            const allSets = gymSessions.flatMap((s) => s.sets ?? []).filter((w) => !w.isWarmup);
            const ids = [...new Set(allSets.map((w) => w.exerciseId))];
            return (
              <section className="rounded-3xl p-4" style={{ background: "rgba(173,247,182,0.22)" }}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Gym progress</p>
                <div className="divide-y divide-black/[0.07]">
                  {ids.map((id) => {
                    const name = allSets.find((w) => w.exerciseId === id)?.exerciseName ?? id;
                    const stat = buildExerciseStat(gymSessions, id);
                    if (!stat) return null;
                    return <ExerciseStatRow key={id} stat={stat} name={name} />;
                  })}
                </div>
              </section>
            );
          })()}
        </div>
      )}

      {/* ── Log view ── */}
      {view === "log" && (
        <div className="space-y-6">
          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap">
            {(["all", "gym", "bjj", "run"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn("px-5 py-2.5 rounded-full text-sm font-semibold capitalize transition-all shadow-sm",
                  filter !== f && "bg-white text-gray-400 border border-gray-100")}
                style={filter === f ? { background: FILTER_ACTIVE[f].bg, color: FILTER_ACTIVE[f].text } : undefined}
              >
                {f}
              </button>
            ))}
          </div>

          {loading && <p className="text-gray-400 text-sm">Loading...</p>}
          {!loading && !showGymA && !showGymB && !showBjj && !showRuns && (
            <p className="text-center py-16 text-gray-400 text-sm">No sessions yet.</p>
          )}

          {!loading && (
            <div className="space-y-4">
              {/* Day A — celadon */}
              {showGymA && (
                <section className="rounded-3xl p-4" style={{ background: "rgba(173,247,182,0.22)" }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Day A</p>
                  <div className="divide-y divide-black/[0.07]">
                    {gymAEntries.map((entry) => (
                      <SessionRow key={entry.data.id ?? ""} entry={entry} expanded={expanded} setExpanded={setExpanded} />
                    ))}
                  </div>
                </section>
              )}

              {/* Day B — light gold */}
              {showGymB && (
                <section className="rounded-3xl p-4" style={{ background: "rgba(255,238,147,0.25)" }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Day B</p>
                  <div className="divide-y divide-black/[0.07]">
                    {gymBEntries.map((entry) => (
                      <SessionRow key={entry.data.id ?? ""} entry={entry} expanded={expanded} setExpanded={setExpanded} />
                    ))}
                  </div>
                </section>
              )}

              {/* BJJ — peach */}
              {showBjj && (
                <section className="rounded-3xl p-4" style={{ background: "rgba(255,192,159,0.25)" }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">BJJ</p>
                  <div className="divide-y divide-black/[0.07]">
                    {bjjSorted.map((entry) => (
                      <SessionRow key={entry.data.id ?? ""} entry={entry} expanded={expanded} setExpanded={setExpanded} />
                    ))}
                  </div>
                </section>
              )}

              {/* Run — cool-horizon */}
              {showRuns && (
                <section className="rounded-3xl p-4" style={{ background: "rgba(121,173,220,0.22)" }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Running</p>
                  <div className="divide-y divide-black/[0.07]">
                    {runSessions.map((run) => (
                      <button
                        key={run.id}
                        onClick={() => router.push(`/run/${run.id}`)}
                        className="w-full flex items-center gap-3 py-4 text-left active:opacity-70 transition-opacity"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#495057] text-sm">
                            {run.distance_meters != null
                              ? `${formatDistance(run.distance_meters, unit)} ${unit}`
                              : "Run"}
                          </p>
                          <p className="text-gray-400 text-xs mt-0.5">
                            {run.date}
                            {run.duration_seconds != null ? ` · ${formatDuration(run.duration_seconds)}` : ""}
                            {run.avg_pace_sec_per_km != null
                              ? ` · ${formatPace(run.avg_pace_sec_per_km, unit)}${paceLabel(unit)}`
                              : ""}
                          </p>
                        </div>
                        <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SessionRow({ entry, expanded, setExpanded }: {
  entry: SessionEntry;
  expanded: string | null;
  setExpanded: (id: string | null) => void;
}) {
  const id     = entry.data.id ?? "";
  const isOpen = expanded === id;

  const title = entry.type === "gym"
    ? `Day ${(entry.data as WorkoutSession).day}`
    : `BJJ — ${(entry.data as BJJSession).classType}`;

  return (
    <div>
      <button
        onClick={() => setExpanded(isOpen ? null : id)}
        className="w-full flex items-center gap-3 py-4 text-left active:opacity-70 transition-opacity"
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#495057] text-sm">{title}</p>
          <p className="text-gray-400 text-xs mt-0.5">{entry.data.date}</p>
        </div>
        {isOpen
          ? <ChevronUp   size={15} className="text-gray-300 flex-shrink-0" />
          : <ChevronDown size={15} className="text-gray-300 flex-shrink-0" />}
      </button>

      {isOpen && entry.type === "bjj" && (
        <div className="pl-5 pb-4 space-y-1.5">
          <p className="text-gray-500 text-sm">
            <span className="font-medium text-[#495057]">Intensity</span> {(entry.data as BJJSession).intensity}/5
          </p>
          {(entry.data as BJJSession).techniques && (
            <p className="text-gray-500 text-sm">
              <span className="font-medium text-[#495057]">Techniques</span> {(entry.data as BJJSession).techniques}
            </p>
          )}
          {(entry.data as BJJSession).rounds && (
            <p className="text-gray-500 text-sm">
              <span className="font-medium text-[#495057]">Rounds</span> {(entry.data as BJJSession).rounds}
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
          <div className="pl-5 pb-4 space-y-3">
            {exercises.length === 0 && <p className="text-gray-400 text-sm">No sets logged</p>}
            {exercises.map(([name, sets]) => (
              <div key={name}>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{name}</p>
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
