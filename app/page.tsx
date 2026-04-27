"use client";

import useSWR from "swr";
import Link from "next/link";
import { Dumbbell, Shield, CheckCircle, Activity } from "lucide-react";
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

  const lastRunLabel = lastRun
    ? `Last ${formatDistance(lastRun.distance_meters ?? 0, unit)} ${unit}${lastRun.duration_seconds ? ` · ${formatDuration(lastRun.duration_seconds)}` : ""}`
    : "Track distance & pace";

  return (
    <div
      className="flex flex-col pt-8 pb-2"
      style={{ minHeight: "calc(100dvh - env(safe-area-inset-top) - 6rem - env(safe-area-inset-bottom))" }}
    >
      {/* Header */}
      <div className="space-y-1 mb-6">
        <h1 className="text-3xl font-bold text-[#495057] tracking-tight">Gymmy Neutron</h1>
        <p className="text-gray-400 text-sm">{today}</p>
      </div>

      {/* HUD stats */}
      <div className="flex gap-8 mb-6">
        <HudStat label="Gym"   value={gymDone} max={2} />
        <HudStat label="BJJ"   value={weekStatus.bjjCount} />
        <HudStat label="Total" value={total} />
      </div>

      {/* 2×2 tile grid — fills remaining height */}
      <div className="flex-1 grid grid-cols-2 gap-3" style={{ minHeight: 0 }}>
        <BigTile
          href={weekStatus.dayA.done ? "/workout?day=A&view=true" : "/workout?day=A"}
          onClick={!weekStatus.dayA.done ? () => { try { localStorage.removeItem("gymmy_workout_draft"); } catch {} } : undefined}
          label="Day A"
          sublabel={weekStatus.dayA.done ? (weekStatus.dayA.date ? `Done ${weekStatus.dayA.date}` : "Completed") : "Ready to log"}
          icon={<Dumbbell size={34} />}
          color="#adf7b6"
          done={weekStatus.dayA.done}
        />
        <BigTile
          href={weekStatus.dayB.done ? "/workout?day=B&view=true" : "/workout?day=B"}
          onClick={!weekStatus.dayB.done ? () => { try { localStorage.removeItem("gymmy_workout_draft"); } catch {} } : undefined}
          label="Day B"
          sublabel={weekStatus.dayB.done ? (weekStatus.dayB.date ? `Done ${weekStatus.dayB.date}` : "Completed") : "Ready to log"}
          icon={<Dumbbell size={34} />}
          color="#ffee93"
          done={weekStatus.dayB.done}
        />
        <BigTile
          href="/bjj"
          label="BJJ"
          sublabel={weekStatus.bjjCount > 0 ? `${weekStatus.bjjCount} this week` : "Track training"}
          icon={<Shield size={34} />}
          color="#ffc09f"
        />
        <BigTile
          href="/run"
          label="Run"
          sublabel={lastRunLabel}
          icon={<Activity size={34} />}
          color="#79addc"
        />
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

function BigTile({
  href,
  onClick,
  label,
  sublabel,
  icon,
  color,
  done = false,
}: {
  href: string;
  onClick?: () => void;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
  done?: boolean;
}) {
  return (
    <Link href={href} onClick={onClick} className="min-h-0">
      <div
        className="rounded-3xl h-full flex flex-col p-5 transition-opacity active:opacity-75"
        style={{ background: color, opacity: done ? 0.6 : 1 }}
      >
        {/* Icon — upper area */}
        <div className="flex-1 flex items-center justify-center" style={{ color: "rgba(73,80,87,0.35)" }}>
          {icon}
        </div>

        {/* Label — lower third, caps */}
        <div>
          {done && (
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle size={11} style={{ color: "rgba(73,80,87,0.5)" }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(73,80,87,0.5)" }}>Done</span>
            </div>
          )}
          <p className="text-[11px] font-medium uppercase tracking-wider leading-none mb-1.5 truncate" style={{ color: "rgba(73,80,87,0.55)" }}>
            {sublabel}
          </p>
          <p className="text-xl font-black uppercase tracking-wide leading-none" style={{ color: "#495057" }}>
            {label}
          </p>
        </div>
      </div>
    </Link>
  );
}
