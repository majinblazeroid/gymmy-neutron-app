"use client";

import { Download } from "lucide-react";
import { useRunUnit } from "@/lib/useRunUnit";

export default function SettingsPage() {
  const { unit, setExplicit } = useRunUnit();

  async function exportData() {
    try {
      const [workoutsRes, bjjRes] = await Promise.all([
        fetch("/api/workouts"),
        fetch("/api/bjj"),
      ]);
      const workouts = workoutsRes.ok ? await workoutsRes.json() : [];
      const bjj      = bjjRes.ok     ? await bjjRes.json()      : [];
      const blob = new Blob([JSON.stringify({ workouts, bjj }, null, 2)], { type: "application/json" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = "gym-tracker-export.json"; a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed — Supabase not connected");
    }
  }

  return (
    <div className="pt-8 pb-6 space-y-8">

      <div>
        <h2 className="text-3xl font-bold text-[#495057] tracking-tight">Settings</h2>
        <p className="text-gray-400 text-sm mt-1.5">App configuration</p>
      </div>

      {/* Config section — subtle mint panel */}
      <section
        className="rounded-3xl p-5 space-y-3"
        style={{ background: "rgba(173, 247, 182, 0.18)" }}
      >
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Database</p>

        {/* Database card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-white/80 space-y-3">
          <p className="font-semibold text-[#495057] text-sm">Supabase connection</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            Update{" "}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 text-xs">.env.local</code>
            {" "}with your project URL and anon key.
          </p>
          <div className="bg-gray-50 rounded-xl p-3 font-mono text-xs text-gray-500 space-y-1 leading-relaxed">
            <p>NEXT_PUBLIC_SUPABASE_URL=...</p>
            <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=...</p>
          </div>
        </div>

        {/* Migration card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-white/80 space-y-3">
          <p className="font-semibold text-[#495057] text-sm">Data migration</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            Import from{" "}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 text-xs">Gym_Ting.xlsx</code>
            {" "}using the Python migration script.
          </p>
          <div className="bg-gray-50 rounded-xl p-3 font-mono text-xs text-gray-500 space-y-1 leading-relaxed">
            <p>cd migration</p>
            <p>python migrate.py --file ../Gym_Ting.xlsx</p>
          </div>
        </div>
      </section>

      {/* Run preferences */}
      <section
        className="rounded-3xl p-5 space-y-3"
        style={{ background: "rgba(121, 173, 220, 0.18)" }}
      >
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Running</p>
        <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-white/80 flex items-center justify-between">
          <div>
            <p className="font-semibold text-[#495057] text-sm">Distance Unit</p>
            <p className="text-gray-400 text-xs mt-0.5">Applies to all run stats and history</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setExplicit("km")}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${unit === "km" ? "bg-white text-[#495057] shadow-sm" : "text-gray-400"}`}
            >
              km
            </button>
            <button
              onClick={() => setExplicit("mi")}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${unit === "mi" ? "bg-white text-[#495057] shadow-sm" : "text-gray-400"}`}
            >
              mi
            </button>
          </div>
        </div>
      </section>

      {/* Data export */}
      <section
        className="rounded-3xl p-5"
        style={{ background: "rgba(255, 192, 159, 0.20)" }}
      >
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Data</p>
        <button
          onClick={exportData}
          className="w-full flex items-center justify-center gap-2 bg-white border border-white/80 text-gray-700 rounded-2xl py-5 font-semibold text-sm shadow-sm transition-opacity active:opacity-70"
        >
          <Download size={16} />
          Export Data as JSON
        </button>
      </section>

    </div>
  );
}