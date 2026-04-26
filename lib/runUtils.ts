export type DistanceUnit = "km" | "mi";

export interface GpsPoint {
  lat: number;
  lng: number;
  alt: number | null;
  t: number;
}

export interface Split {
  km: number;
  pace_sec: number;
}

const R = 6371000; // Earth radius in metres

export function haversineDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export function calcElevationGain(points: GpsPoint[]): number | null {
  const withAlt = points.filter((p) => p.alt !== null);
  if (withAlt.length < 2) return null;
  let gain = 0;
  for (let i = 1; i < withAlt.length; i++) {
    const delta = (withAlt[i].alt as number) - (withAlt[i - 1].alt as number);
    if (delta > 0) gain += delta;
  }
  return Math.round(gain);
}

export function calcSplits(points: GpsPoint[]): Split[] {
  if (points.length < 2) return [];
  const splits: Split[] = [];
  let distAccum = 0;
  let splitStartTime = points[0].t;
  let nextKm = 1;

  for (let i = 1; i < points.length; i++) {
    distAccum += haversineDistance(points[i - 1], points[i]);
    if (distAccum >= nextKm * 1000) {
      const elapsed = (points[i].t - splitStartTime) / 1000;
      splits.push({ km: nextKm, pace_sec: Math.round(elapsed) });
      splitStartTime = points[i].t;
      nextKm++;
    }
  }
  return splits;
}

export function metersToMiles(m: number): number {
  return m / 1609.344;
}

export function metersToFeet(m: number): number {
  return m * 3.28084;
}

export function formatDistance(meters: number, unit: DistanceUnit): string {
  if (unit === "mi") return metersToMiles(meters).toFixed(2);
  return (meters / 1000).toFixed(2);
}

export function formatPace(secPerKm: number, unit: DistanceUnit): string {
  if (!isFinite(secPerKm) || secPerKm <= 0) return "--:--";
  const secs = unit === "mi" ? secPerKm * 1.60934 : secPerKm;
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatElevation(meters: number | null, unit: DistanceUnit): string {
  if (meters === null || meters === undefined) return "—";
  if (unit === "mi") return `${Math.round(metersToFeet(meters))} ft`;
  return `${Math.round(meters)} m`;
}

export function unitLabel(unit: DistanceUnit): string {
  return unit === "km" ? "Kilometers" : "Miles";
}

export function paceLabel(unit: DistanceUnit): string {
  return unit === "km" ? "/km" : "/mi";
}

export function splitLabel(km: number, unit: DistanceUnit): string {
  if (unit === "mi") {
    const mi = Math.round(km * 0.621371 * 10) / 10;
    return `mi ${mi}`;
  }
  return `km ${km}`;
}
