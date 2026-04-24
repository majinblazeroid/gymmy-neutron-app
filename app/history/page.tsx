"use client";

import { useEffect, useState } from "react";
import { WorkoutSession, BJJSession } from "@/lib/types";
import { Dumbbell, Shield, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
type SessionEntry =
  | { type: "gym"; data: WorkoutSession }
  | { type: "bjj"; data: BJJSession };

type Filter = "all" | "gym" | "bjj";
type View   = "log" | "charts";

interface ExerciseStat {
  name: string;
  isBodyweight: boolean;
  current: number;       // most recent session avg
  previous: number | null;  // second most recent
  oldest: number | null;    // oldest session avg
  unit: string;
}

function buildExerciseStat(sessions: WorkoutSession[], exerciseId: string): ExerciseStat | null {
  const points: { value: number; isBodyweight: boolean }[] = [];

  for (const s of [...sessions].sort((a, b) => a.date.localeCompare(b.date))) {
    const ws = (s.sets ?? []).filter((w) => w.exerciseId === exerciseId && !w.isWarmup);
    if (!ws.length) continue;

    const hasWeight = ws.some((w) => (w.weight ?? 0) > 0);
    if (hasWeight) {
      const avg = ws.reduce((a, w) => a + (w.weight ?? 0), 0) / ws.length;
      points.push({ value: Math.round(avg * 10) / 10, isBodyweight: false });
    } else {
      const setsWithReps = ws.filter((w) => (w.reps ?? 0) > 0);
      if (!setsWithReps.length) continue;
      const avg = setsWithReps.reduce((a, w) => a + (w.reps ?? 0), 0) / setsWithReps.length;
      points.push({ value: Math.round(avg * 10) / 10, isBodyweight: true });
    }
  }

  if (!points.length) return null;

  const isBodyweight = points[points.length - 1].isBodyweight;
  return {
    name: "",
    isBodyweight,
    current:  points[points.length - 1].value,
    previous: points.length >= 2 ? points[points.length - 2].value : null,
    oldest:   points.length >= 2 ? points[0].value : null,
    unit:     isBodyweight ? "reps" : "kg",
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
    <div className={`flex flex-col items-center gap-0.5`}>
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
        {/* Left: name + current value */}
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

        {/* Right: deltas */}
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
  const [sessions,    setSessions]    = useState<SessionEntry[]>([]);
  const [gymSessions, setGymSessions] = useState<WorkoutSession[]>([]);
  const [filter,      setFilter]      = useState<Filter>("all");
  const [view,        setView]        = useState<View>("log");
  const [expanded,    setExpanded]    = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [gymRes, bjjRes] = await Promise.all([fetch("/api/workouts"), fetch("/api/bjj")]);
        const gym: WorkoutSession[] = gymRes.ok ? await gymRes.json() : [];
        const bjj: BJJSession[]     = bjjRes.ok ? await bjjRes.json() : [];
        setGymSessions(gym);
        setSessions([
          ...gym.map((d) => ({ type: "gym" as const, data: d })),
          ...bjj.map((d) => ({ type: "bjj" as const, data: d })),
        ].sort((a, b) => b.data.date.localeCompare(a.data.date)));
      } catch { /* offline */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = sessions.filter((s) => filter === "all" || s.type === filter);

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
          <div className="flex gap-2">
            {(["all", "gym", "bjj"] as Filter[]).map((f) => (
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
          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm">No sessions yet.</div>
          )}

          {/* Gym sessions in mint panel, BJJ in peach panel */}
          {!loading && filtered.length > 0 && (() => {
            const gymEntries = filtered.filter((e) => e.type === "gym");
            const bjjEntries = filtered.filter((e) => e.type === "bjj");
            const showGym = filter !== "bjj" && gymEntries.length > 0;
            const showBjj = filter !== "gym" && bjjEntries.length > 0;

            return (
              <div className="space-y-6">
                {showGym && (
                  <section className="rounded-3xl p-5 space-y-3" style={{ background: "rgba(173, 247, 182, 0.20)" }}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Gym</p>
                    {gymEntries.map((entry) => (
                      <SessionCard key={entry.data.id ?? ""} entry={entry} expanded={expanded} setExpanded={setExpanded} />
                    ))}
                  </section>
                )}
                {showBjj && (
                  <section className="rounded-3xl p-5 space-y-3" style={{ background: "rgba(255, 192, 159, 0.22)" }}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">BJJ</p>
                    {bjjEntries.map((entry) => (
                      <SessionCard key={entry.data.id ?? ""} entry={entry} expanded={expanded} setExpanded={setExpanded} />
                    ))}
                  </section>
                )}
                {/* "all" with mixed entries — fall back to single list */}
                {filter === "all" && !showGym && !showBjj && filtered.map((entry) => (
                  <SessionCard key={entry.data.id ?? ""} entry={entry} expanded={expanded} setExpanded={setExpanded} />
                ))}
              </div>
            );
          })()}
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
        // group by exercise
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