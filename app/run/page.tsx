"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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

  // Pre-center map on user's location before run starts
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const mapPoints = routePoints.map((p) => ({ lat: p.lat, lng: p.lng }));
  const currentKmInProgress = splits.length + 1;
  const currentSplitElapsed =
    routePoints.length > 0 && splits.length < nextKmRef.current - 1
      ? Math.floor((Date.now() - splitStartTimeRef.current) / 1000)
      : null;

  const STAT_SHADOW = "0 0 10px rgba(255,255,255,0.95), 0 1px 3px rgba(0,0,0,0.12)";
  const BTN_GLASS = {
    background: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.55)",
  } as React.CSSProperties;

  return (
    <div className="fixed inset-0 z-[60]">

      {/* Map — always full screen */}
      <div className="absolute inset-0 z-0">
        <RunMap points={mapPoints} currentPos={currentPos} isLive={phase === "active"} />
      </div>

      {/* TOP STATS HUD — frosted strip, fades in when running or paused */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex justify-center px-6"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 4.5rem)",
          opacity: phase === "active" || phase === "paused" ? 1 : 0,
          transition: "opacity 0.35s ease",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.45)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderRadius: "1rem",
            padding: "0.6rem 1.5rem",
          }}
        >
          <div className="flex items-start gap-8">
            <MapStat label={`Pace ${paceLabel(unit)}`} value={avgPaceSec > 0 ? formatPace(avgPaceSec, unit) : "--:--"} shadow={STAT_SHADOW} />
            <MapStat label="Duration" value={formatDuration(elapsedSeconds)} shadow={STAT_SHADOW} />
            <MapStat label={unit === "mi" ? "Elev (ft)" : "Elev (m)"} value={formatElevation(elevationGain, unit)} shadow={STAT_SHADOW} />
          </div>
        </div>
      </div>

      {/* BOTTOM CONTROLS — all states stacked in same grid cell, crossfade via opacity */}
      {phase !== "summary" && (
        <div
          className="absolute bottom-0 left-0 right-0 z-10 px-6"
          style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        >
          <div style={{ display: "grid" }}>

            {/* ── READY ──────────────────────────────────────────────── */}
            <div
              style={{
                gridArea: "1 / 1",
                opacity: phase === "ready" ? 1 : 0,
                pointerEvents: phase === "ready" ? "auto" : "none",
                transition: "opacity 0.35s ease",
              }}
            >
              {gpsError && (
                <div className="bg-red-50/90 border border-red-200 rounded-2xl px-4 py-3 mb-3">
                  <p className="text-red-600 text-sm">{gpsError}</p>
                </div>
              )}
              <div className="flex justify-center mb-3">
                <button
                  onClick={toggle}
                  className="text-sm font-semibold text-black/50 uppercase tracking-wider"
                  style={{ textShadow: STAT_SHADOW }}
                >
                  {unitLabel(unit)}
                </button>
              </div>
              <button
                onClick={handleStart}
                className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-[#495057] text-lg active:opacity-70 transition-opacity"
                style={BTN_GLASS}
              >
                <Play size={20} />
                Start Run
              </button>
            </div>

            {/* ── ACTIVE ─────────────────────────────────────────────── */}
            <div
              style={{
                gridArea: "1 / 1",
                opacity: phase === "active" ? 1 : 0,
                pointerEvents: phase === "active" ? "auto" : "none",
                transition: "opacity 0.35s ease",
              }}
            >
              {currentSplitElapsed !== null && (
                <p className="text-center text-xs font-semibold text-black/50 mb-2"
                   style={{ textShadow: STAT_SHADOW }}>
                  {splitLabel(currentKmInProgress, unit)} · {formatDuration(currentSplitElapsed)} so far
                </p>
              )}
              <p className="text-center font-black text-black leading-none mb-4"
                 style={{ fontSize: "3.5rem", textShadow: STAT_SHADOW }}>
                {formatDistance(distanceMeters, unit)}
                <span className="text-xl font-semibold text-black/40 ml-2">{unit}</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handlePause}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-4 font-semibold text-[#495057] active:opacity-70 transition-opacity"
                  style={BTN_GLASS}
                >
                  <Pause size={18} />
                  Pause
                </button>
                <button
                  onClick={handleFinish}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-4 font-semibold text-white active:opacity-70 transition-opacity"
                  style={{ background: "rgba(73,80,87,0.88)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
                >
                  <Square size={18} />
                  Finish
                </button>
              </div>
            </div>

            {/* ── PAUSED ─────────────────────────────────────────────── */}
            <div
              style={{
                gridArea: "1 / 1",
                opacity: phase === "paused" ? 1 : 0,
                pointerEvents: phase === "paused" ? "auto" : "none",
                transition: "opacity 0.35s ease",
              }}
            >
              <p className="text-center text-xs font-semibold text-black/50 uppercase tracking-widest mb-2"
                 style={{ textShadow: STAT_SHADOW }}>
                Paused
              </p>
              <p className="text-center font-black text-black leading-none mb-4"
                 style={{ fontSize: "3.5rem", textShadow: STAT_SHADOW }}>
                {formatDistance(distanceMeters, unit)}
                <span className="text-xl font-semibold text-black/40 ml-2">{unit}</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleResume}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-4 font-semibold text-white active:opacity-70 transition-opacity"
                  style={{ background: "rgba(73,80,87,0.88)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
                >
                  <Play size={18} />
                  Resume
                </button>
                <button
                  onClick={handleFinish}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-4 font-semibold text-[#495057] active:opacity-70 transition-opacity"
                  style={BTN_GLASS}
                >
                  <Square size={18} />
                  Finish
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── SUMMARY overlay (scrollable) ─────────────────────────────── */}
      {phase === "summary" && (
        <div
          className="absolute inset-x-0 bottom-0 max-w-lg mx-auto px-4 overflow-y-auto z-10"
          style={{
            maxHeight: "80vh",
            paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))",
          }}
        >
          <div
            className="rounded-3xl p-5 space-y-5"
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: `1px solid ${BLUE_BORDER}`,
            }}
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
                className="flex items-center justify-center gap-2 bg-white/80 border border-gray-200 text-gray-500 font-semibold py-3 rounded-2xl active:opacity-80 transition-opacity shadow-sm"
              >
                <RotateCcw size={16} />
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#495057]/90 text-white font-bold py-3 rounded-2xl active:opacity-80 transition-opacity disabled:opacity-50"
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

function MapStat({ label, value, shadow }: { label: string; value: string; shadow: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-black text-black leading-none" style={{ textShadow: shadow }}>
        {value}
      </p>
      <p className="text-[11px] font-semibold text-black/55 mt-0.5 uppercase tracking-wider"
         style={{ textShadow: shadow }}>
        {label}
      </p>
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
