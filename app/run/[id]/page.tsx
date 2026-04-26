"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatElevation,
  paceLabel,
  splitLabel,
  type Split,
} from "@/lib/runUtils";
import { useRunUnit } from "@/lib/useRunUnit";

const RunMap = dynamic(() => import("@/components/run/RunMap"), { ssr: false });

const BLUE_BG = "rgba(121, 173, 220, 0.18)";
const BLUE_BORDER = "rgba(121, 173, 220, 0.40)";

interface RunSession {
  id: string;
  date: string;
  started_at: string | null;
  duration_seconds: number | null;
  distance_meters: number | null;
  elevation_gain_meters: number | null;
  avg_pace_sec_per_km: number | null;
  splits: Split[];
  notes: string | null;
  route_points: { lat: number; lng: number; alt: number | null; t: number }[];
  created_at: string;
}

export default function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { unit, toggle } = useRunUnit();
  const [run, setRun] = useState<RunSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/runs/${id}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) { setRun(data); setLoading(false); }
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div className="pt-10 pb-6">
        <div className="h-48 rounded-3xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (notFound || !run) {
    return (
      <div className="pt-10 pb-6 space-y-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 text-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <p className="text-gray-500">Run not found.</p>
      </div>
    );
  }

  const mapPoints = (run.route_points ?? []).map((p) => ({ lat: p.lat, lng: p.lng }));
  const runDate = new Date(run.date).toLocaleDateString("en-AU", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const startTime = run.started_at
    ? new Date(run.started_at).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="pt-10 pb-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:opacity-70 transition-opacity flex-shrink-0"
        >
          <ArrowLeft size={18} className="text-[#495057]" />
        </button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#495057] tracking-tight leading-tight">Run</h1>
          <p className="text-gray-400 text-sm truncate">
            {runDate}{startTime ? ` · ${startTime}` : ""}
          </p>
        </div>
        <button
          onClick={toggle}
          className="ml-auto text-xs font-semibold bg-white border border-gray-200 rounded-full px-3 py-1.5 text-[#495057] shadow-sm flex-shrink-0"
        >
          {unit.toUpperCase()}
        </button>
      </div>

      {/* Map */}
      {mapPoints.length > 0 && (
        <div
          className="rounded-3xl overflow-hidden"
          style={{ height: 280, border: `1px solid ${BLUE_BORDER}` }}
        >
          <RunMap points={mapPoints} currentPos={null} isLive={false} />
        </div>
      )}

      {/* Stats */}
      <div
        className="rounded-3xl p-5 space-y-5"
        style={{ background: BLUE_BG, border: `1px solid ${BLUE_BORDER}` }}
      >
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Stats</p>

        <div className="grid grid-cols-2 gap-3">
          <StatTile
            label={`Distance (${unit})`}
            value={run.distance_meters != null ? formatDistance(run.distance_meters, unit) : "—"}
            large
          />
          <StatTile
            label="Duration"
            value={run.duration_seconds != null ? formatDuration(run.duration_seconds) : "—"}
            large
          />
          <StatTile
            label={`Avg Pace${paceLabel(unit)}`}
            value={
              run.avg_pace_sec_per_km != null
                ? formatPace(run.avg_pace_sec_per_km, unit)
                : "--:--"
            }
          />
          <StatTile
            label={`Elevation${unit === "mi" ? " (ft)" : " (m)"}`}
            value={formatElevation(run.elevation_gain_meters ?? null, unit)}
          />
        </div>
      </div>

      {/* Splits */}
      {run.splits && run.splits.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Splits</p>
          <div className="space-y-2">
            {run.splits.map((s) => (
              <div
                key={s.km}
                className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0"
              >
                <span className="text-gray-500 text-sm">{splitLabel(s.km, unit)}</span>
                <span className="font-semibold text-[#495057] text-sm">
                  {formatPace(s.pace_sec, unit)}{paceLabel(unit)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {run.notes && (
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Notes</p>
          <p className="text-sm text-[#495057]">{run.notes}</p>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <div className="bg-white rounded-2xl px-4 py-4 border border-white/80 shadow-sm">
      <p className={`font-bold text-[#495057] leading-none ${large ? "text-3xl" : "text-2xl"}`}>
        {value}
      </p>
      <p className="text-gray-400 text-xs mt-1.5 font-medium">{label}</p>
    </div>
  );
}
