"use client";

import useSWR from "swr";
import Link from "next/link";
import { Dumbbell, Shield, CheckCircle, ChevronRight } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface WeekStatus {
  dayA: { done: boolean; date?: string };
  dayB: { done: boolean; date?: string };
  bjjCount: number;
}

// Lemon-chiffon card background — warm, neutral, holds both sections
const CARD_BG  = "rgba(252, 245, 199, 0.55)";  // lemon-chiffon

export default function Dashboard() {
  const { data } = useSWR<WeekStatus>("/api/workouts/week", fetcher);
  const weekStatus = data ?? { dayA: { done: false }, dayB: { done: false }, bjjCount: 0 };

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

      {/* Stats row — always white, no tint */}
      <div className="grid grid-cols-3 gap-3">
        <StatChip label="Gym"   value={gymDone} max={2} />
        <StatChip label="BJJ"   value={weekStatus.bjjCount} />
        <StatChip label="Total" value={total} />
      </div>

      {/* One unified action card — no dividers, all three equally spaced */}
      <div className="rounded-3xl p-5 border border-[#f0e8a0]/60" style={{ background: CARD_BG }}>

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
        </div>

      </div>
    </div>
  );
}

function StatChip({ label, value, max }: { label: string; value: number; max?: number }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <p className="text-2xl font-bold text-[#495057] leading-none">
        {value}{max && <span className="text-base text-gray-400 font-medium">/{max}</span>}
      </p>
      <p className="text-gray-500 text-xs mt-1.5 font-medium">{label}</p>
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
