"use client";

import useSWR from "swr";
import Link from "next/link";
import { Dumbbell, Shield, CheckCircle, ChevronRight, Activity } from "lucide-react";
import { formatDistance, formatDuration } from "@/lib/runUtils";
import { useRunUnit } from "@/lib/useRunUnit";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface WeekStatus {
  dayA: { done: boolean; date?: string };
  dayB: { done: boolean; date?: string };
  bjjCount: number;
}

interface RunSession {
  id: string;
  date: string;
  duration_seconds: number | null;
  distance_meters: number | null;
}

export default function Dashboard() {
  const { data } = useSWR<WeekStatus>("/api/workouts/week", fetcher);
  const { data: runs } = useSWR<RunSession[]>("/api/runs", fetcher);
  const { unit } = useRunUnit();
  const weekStatus = data ?? { dayA: { done: false }, dayB: { done: false }, bjjCount: 0 };
  const lastRun = runs && runs.length > 0 ? runs[0] : null;

  const today = new Date().toLocaleDateString("en-AU", {
    weekday: "long", month: "long", day: "numeric",
  });

  const gymDone = (weekStatus.dayA.done ? 1 : 0) + (weekStatus.dayB.done ? 1 : 0);
  const total   = gymDone + weekStatus.bjjCount;

  return (
    <div className="pt-10 pb-6 space-y-8">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-[#495057] tracking-tight">Gymmy Neutron</h1>
        <p className="text-gray-400 text-sm">{today}</p>
      </div>

      {/* HUD stats */}
      <div className="flex gap-8">
        <HudStat label="Gym"   value={gymDone} max={2} />
        <HudStat label="BJJ"   value={weekStatus.bjjCount} />
        <HudStat label="Total" value={total} />
      </div>

      {/* Action rows */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">This week</p>

        <div className="flex flex-col gap-4">
          <DayRow day="A" done={weekStatus.dayA.done} date={weekStatus.dayA.date} />
          <DayRow day="B" done={weekStatus.dayB.done} date={weekStatus.dayB.date} />

          <Link href="/bjj">
            <div className="bg-white rounded-2xl px-5 py-5 flex items-center justify-between shadow-sm border border-white/80">
              <div className="flex items-center gap-4">
                <Shield size={18} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#495057] text-base">Log BJJ Session</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {weekStatus.bjjCount > 0
                      ? `${weekStatus.bjjCount} session${weekStatus.bjjCount !== 1 ? "s" : ""} this week`
                      : "Track your training"}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </div>
          </Link>

          <Link href="/run">
            <div className="bg-white rounded-2xl px-5 py-5 flex items-center justify-between shadow-sm border border-white/80 active:opacity-80 transition-opacity">
              <div className="flex items-center gap-4">
                <Activity size={18} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#495057] text-base">Start a Run</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {lastRun
                      ? `Last: ${formatDistance(lastRun.distance_meters ?? 0, unit)} ${unit}${lastRun.duration_seconds ? ` · ${formatDuration(lastRun.duration_seconds)}` : ""}`
                      : "Track distance, pace & route"}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function HudStat({ label, value, max }: { label: string; value: number; max?: number }) {
  return (
    <div>
      <p className="text-4xl font-black text-[#495057] leading-none">
        {value}
        {max !== undefined && (
          <span className="text-2xl font-semibold text-[#495057]/30">/{max}</span>
        )}
      </p>
      <p className="text-[11px] font-semibold text-[#495057]/50 mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function DayRow({ day, done, date }: { day: "A" | "B"; done: boolean; date?: string }) {
  if (done) {
    return (
      <Link href={`/workout?day=${day}&view=true`}>
        <div className="bg-white rounded-2xl px-5 py-5 flex items-center justify-between shadow-sm border border-white/80 opacity-55">
          <div className="flex items-center gap-4">
            <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-700 text-base">Day {day}</p>
              <p className="text-gray-400 text-xs mt-0.5">{date ? `Done ${date}` : "Completed"}</p>
            </div>
          </div>
          <span className="text-xs bg-green-50 text-green-600 font-semibold px-3 py-1 rounded-full">Done</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/workout?day=${day}`}
      onClick={() => { try { localStorage.removeItem("gymmy_workout_draft"); } catch {} }}
    >
      <div className="bg-white rounded-2xl px-5 py-5 flex items-center justify-between shadow-sm border border-white/80 active:opacity-80 transition-opacity">
        <div className="flex items-center gap-4">
          <Dumbbell size={18} className="text-gray-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-[#495057] text-base">Day {day}</p>
            <p className="text-gray-400 text-xs mt-0.5">Ready to log</p>
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
      </div>
    </Link>
  );
}
