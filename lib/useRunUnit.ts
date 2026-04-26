"use client";

import { useState, useEffect } from "react";
import type { DistanceUnit } from "./runUtils";

const STORAGE_KEY = "runDistanceUnit";

export function useRunUnit() {
  const [unit, setUnit] = useState<DistanceUnit>("km");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as DistanceUnit | null;
      if (stored === "km" || stored === "mi") setUnit(stored);
    } catch {}
  }, []);

  const toggle = () => {
    const next: DistanceUnit = unit === "km" ? "mi" : "km";
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    setUnit(next);
  };

  const setExplicit = (u: DistanceUnit) => {
    try { localStorage.setItem(STORAGE_KEY, u); } catch {}
    setUnit(u);
  };

  return { unit, toggle, setExplicit };
}
