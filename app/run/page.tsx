"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Play, Pause, Square, RotateCcw } from "lucide-react";
import {
  haversineDistance,
  calcElevationGain,
  calcSplits,
  formatDistance,
  formatDuration,
  formatPace,
  formatElevation,
  unitLabel,
  paceLabel,
  splitLabel,
  type GpsPoint,
  type Split,
} from "@/lib/runUtils";
import { useRunUnit } from "@/lib/useRunUnit";

const RunMap = dynamic(() => import("@/components/run/RunMap"), { ssr: false });

type Phase = "ready" | "active" | "paused" | "summary";

const BLUE_BG = "rgba(121, 173, 220, 0.18)";
const BLUE_BORDER = "rgba(121, 173, 220, 0.40)";

export default function RunPage() {
  const router = useRouter();
  const { unit, toggle } = useRunUnit();

  const [phase, setPhase] = useState<Phase>("ready");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [elevationGain, setElevationGain] = useState<number | null>(null);
  const [routePoints, setRoutePoints] = useState<GpsPoint[]>([]);
  const [splits, setSplits] = useState<Split[]>([]);
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);
  const [notes, setNotes] = useState("");
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const lastPointRef = useRef<GpsPoint | null>(null);
  const distanceRef = useRef(0);
  const elevationRef = useRef<number>(0);
  const elevationAvailableRef = useRef(false);
  const splitsRef = useRef<Split[]>([]);
  const splitStartTimeRef = useRef<number>(0);
  const nextKmRef = useRef(1);

  const avgPaceSec =
    distanceMeters > 10 ? elapsedSeconds / (distanceMeters / 1000) : 0;

  const acquireWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch {}
  }, []);

  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }, []);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const stopInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const onGpsPoint = useCallback((pos: GeolocationPosition) => {
    const { latitude: lat, longitude: lng, altitude: alt } = pos.coords;
    const t = Date.now();
    const newPoint: GpsPoint = { lat, lng, alt, t };

    setCurrentPos({ lat, lng });

    if (lastPointRef.current) {
      const d = haversineDistance(lastPointRef.current, newPoint);
      if (d < 50) { // ignore GPS jumps > 50 m between ticks
        distanceRef.current += d;
        setDistanceMeters(distanceRef.current);

        // elevation
        if (alt !== null && lastPointRef.current.alt !== null) {
          const delta = alt - (lastPointRef.current.alt as number);
          if (delta > 0) {
            elevationRef.current += delta;
            elevationAvailableRef.current = true;
          }
          setElevationGain(Math.round(elevationRef.current));
        }

        // splits
        const totalKmDone = Math.floor(distanceRef.current / 1000);
        if (totalKmDone >= nextKmRef.current) {
          const elapsed = (t - splitStartTimeRef.current) / 1000;
          const newSplit: Split = { km: nextKmRef.current, pace_sec: Math.round(elapsed) };
          splitsRef.current = [...splitsRef.current, newSplit];
          setSplits([...splitsRef.current]);
          splitStartTimeRef.current = t;
          nextKmRef.current++;
        }
      }
    } else {
      splitStartTimeRef.current = t;
    }

    lastPointRef.current = newPoint;
    setRoutePoints((prev) => [...prev, newPoint]);
  }, []);

  const startWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      onGpsPoint,
      (err) => {
        if (err.code === 1) setGpsError("Location access denied. On iPhone, go to Settings → Safari → Location and set to Allow.");
        else setGpsError("Unable to get your location. Please check GPS signal.");
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  }, [onGpsPoint]);

  const handleStart = useCallback(() => {
    setGpsError(null);
    const isInsecure =
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost";
    if (isInsecure) {
      setGpsError("GPS requires HTTPS. Open the app via your Vercel URL to track location.");
      return;
    }
    setStartedAt(new Date().toISOString());
    setPhase("active");         // update UI immediately
    acquireWakeLock();          // fire-and-forget
    startWatch();
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
  }, [acquireWakeLock, startWatch]);

  const handlePause = useCallback(() => {
    stopWatch();
    stopInterval();
    releaseWakeLock();
    setPhase("paused");
  }, [stopWatch, stopInterval, releaseWakeLock]);

  const handleResume = useCallback(() => {
    setPhase("active");         // update UI immediately
    acquireWakeLock();          // fire-and-forget
    startWatch();
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
  }, [acquireWakeLock, startWatch]);

  const handleFinish = useCallback(() => {
    stopWatch();
    stopInterval();
    releaseWakeLock();
    setPhase("summary");
  }, [stopWatch, stopInterval, releaseWakeLock]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const finalSplits = calcSplits(routePoints);
    const body = {
      date: new Date().toISOString().split("T")[0],
      started_at: startedAt,
      duration_seconds: elapsedSeconds,
      distance_meters: distanceMeters,
      elevation_gain_meters: elevationAvailableRef.current ? elevationGain : null,
      avg_pace_sec_per_km: avgPaceSec > 0 ? avgPaceSec : null,
      splits: finalSplits,
      notes: notes.trim() || null,
      route_points: routePoints,
    };

    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        router.push("/history");
      } else {
        setSaving(false);
      }
    } catch {
      setSaving(false);
    }
  }, [avgPaceSec, distanceMeters, elevationGain, elapsedSeconds, notes, routePoints, router, startedAt]);

  const handleDiscard = useCallback(() => {
    setPhase("ready");
    setElapsedSeconds(0);
    setDistanceMeters(0);
    setElevationGain(null);
    setRoutePoints([]);
    setSplits([]);
    setCurrentPos(null);
    setNotes("");
    setStartedAt(null);
    distanceRef.current = 0;
    elevationRef.current = 0;
    elevationAvailableRef.current = false;
    splitsRef.current = [];
    lastPointRef.current = null;
    nextKmRef.current = 1;
  }, []);

  useEffect(() => {
    return () => {
      stopWatch();
      stopInterval();
      releaseWakeLock();
    };
  }, [stopWatch, stopInterval, releaseWakeLock]);

  const mapPoints = routePoints.map((p) => ({ lat: p.lat, lng: p.lng }));
  const currentKmInProgress = splits.length + 1;
  const currentSplitElapsed =
    routePoints.length > 0 && splits.length < nextKmRef.current - 1
      ? Math.floor((Date.now() - splitStartTimeRef.current) / 1000)
      : null;

  return (
    <div className="pt-10 pb-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-[#495057] tracking-tight">Run</h1>
      </div>

      {/* READY */}
      {phase === "ready" && (
        <div
          className="rounded-3xl p-6 space-y-8"
          style={{ background: BLUE_BG, border: `1px solid ${BLUE_BORDER}` }}
        >
          <div className="text-center space-y-2">
            <button
              onClick={toggle}
              className="text-7xl font-bold text-[#495057] tracking-tight leading-none"
            >
              0.00
            </button>
            <button
              onClick={toggle}
              className="text-base text-gray-500 font-medium underline-offset-2 hover:underline"
            >
              {unitLabel(unit)}
            </button>
          </div>

          {gpsError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              <p className="text-red-600 text-sm">{gpsError}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleStart}
              className="w-full bg-[#495057] text-white font-bold text-lg py-4 rounded-2xl active:opacity-80 transition-opacity"
            >
              Start Run
            </button>
            <p className="text-center text-xs text-gray-400">
              Keep screen on for uninterrupted tracking
            </p>
          </div>
        </div>
      )}

      {/* Map — single instance, stays mounted across active/paused/summary */}
      {phase !== "ready" && (mapPoints.length > 0 || phase === "active") && (
        <div
          className="rounded-3xl overflow-hidden"
          style={{ height: 260, border: `1px solid ${BLUE_BORDER}` }}
        >
          <RunMap points={mapPoints} currentPos={currentPos} isLive={phase === "active"} />
        </div>
      )}

      {/* ACTIVE */}
      {phase === "active" && (
        <div className="space-y-4">

          <div
            className="rounded-3xl p-5 space-y-4"
            style={{ background: BLUE_BG, border: `1px solid ${BLUE_BORDER}` }}
          >
            <div className="grid grid-cols-2 gap-3">
              <StatTile label={`Distance (${unit})`} value={formatDistance(distanceMeters, unit)} />
              <StatTile label="Duration" value={formatDuration(elapsedSeconds)} />
              <StatTile
                label={`Pace${paceLabel(unit)}`}
                value={avgPaceSec > 0 ? formatPace(avgPaceSec, unit) : "--:--"}
              />
              <StatTile
                label={`Elevation${unit === "mi" ? " (ft)" : " (m)"}`}
                value={formatElevation(elevationGain, unit)}
              />
            </div>

            {currentSplitElapsed !== null && (
              <p className="text-xs text-gray-500 text-center">
                {splitLabel(currentKmInProgress, unit)} · {formatDuration(currentSplitElapsed)} so far
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePause}
                className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-[#495057] font-semibold py-3 rounded-2xl active:opacity-80 transition-opacity shadow-sm"
              >
                <Pause size={18} />
                Pause
              </button>
              <button
                onClick={handleFinish}
                className="flex items-center justify-center gap-2 bg-[#495057] text-white font-semibold py-3 rounded-2xl active:opacity-80 transition-opacity"
              >
                <Square size={18} />
                Finish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSED */}
      {phase === "paused" && (
        <div className="space-y-4">
          <div
            className="rounded-3xl p-5 space-y-4"
            style={{ background: BLUE_BG, border: `1px solid ${BLUE_BORDER}` }}
          >
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
              Paused
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatTile label={`Distance (${unit})`} value={formatDistance(distanceMeters, unit)} />
              <StatTile label="Duration" value={formatDuration(elapsedSeconds)} />
              <StatTile
                label={`Pace${paceLabel(unit)}`}
                value={avgPaceSec > 0 ? formatPace(avgPaceSec, unit) : "--:--"}
              />
              <StatTile
                label={`Elevation${unit === "mi" ? " (ft)" : " (m)"}`}
                value={formatElevation(elevationGain, unit)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleResume}
                className="flex items-center justify-center gap-2 bg-[#495057] text-white font-semibold py-3 rounded-2xl active:opacity-80 transition-opacity"
              >
                <Play size={18} />
                Resume
              </button>
              <button
                onClick={handleFinish}
                className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-[#495057] font-semibold py-3 rounded-2xl active:opacity-80 transition-opacity shadow-sm"
              >
                <Square size={18} />
                Finish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      {phase === "summary" && (
        <div className="space-y-4">
          <div
            className="rounded-3xl p-5 space-y-5"
            style={{ background: BLUE_BG, border: `1px solid ${BLUE_BORDER}` }}
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Run Summary
            </p>

            <div className="grid grid-cols-2 gap-3">
              <StatTile label={`Distance (${unit})`} value={formatDistance(distanceMeters, unit)} large />
              <StatTile label="Duration" value={formatDuration(elapsedSeconds)} large />
              <StatTile
                label={`Avg Pace${paceLabel(unit)}`}
                value={avgPaceSec > 0 ? formatPace(avgPaceSec, unit) : "--:--"}
              />
              <StatTile
                label={`Elevation${unit === "mi" ? " (ft)" : " (m)"}`}
                value={formatElevation(elevationGain, unit)}
              />
            </div>

            {splits.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Splits</p>
                <div className="space-y-1">
                  {splits.map((s) => (
                    <div key={s.km} className="flex justify-between text-sm">
                      <span className="text-gray-500">{splitLabel(s.km, unit)}</span>
                      <span className="font-semibold text-[#495057]">
                        {formatPace(s.pace_sec, unit)}{paceLabel(unit)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Notes</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did it feel?"
                rows={2}
                className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm text-[#495057] placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#79addc]/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDiscard}
                className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-500 font-semibold py-3 rounded-2xl active:opacity-80 transition-opacity shadow-sm"
              >
                <RotateCcw size={16} />
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#495057] text-white font-bold py-3 rounded-2xl active:opacity-80 transition-opacity disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Run"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  large,
}: {
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl px-4 py-4 border border-white/80 shadow-sm">
      <p className={`font-bold text-[#495057] leading-none ${large ? "text-3xl" : "text-2xl"}`}>
        {value}
      </p>
      <p className="text-gray-400 text-xs mt-1.5 font-medium">{label}</p>
    </div>
  );
}
