"use client";

import { useState } from "react";
import { BJJClassType } from "@/lib/types";
import FeelingRating from "@/components/shared/FeelingRating";

// Peach-glow palette for BJJ
const PEACH      = "rgba(255, 192, 159, 0.22)";
const PEACH_DEEP = "rgba(255, 192, 159, 0.30)";

export default function BJJPage() {
  const [classType,      setClassType]      = useState<BJJClassType>("fundamentals");
  const [date,           setDate]           = useState(new Date().toISOString().split("T")[0]);
  const [techniques,     setTechniques]     = useState("");
  const [rounds,         setRounds]         = useState<number | undefined>(undefined);
  const [roundDuration,  setRoundDuration]  = useState(300);
  const [breakDuration,  setBreakDuration]  = useState(60);
  const [intensity,      setIntensity]      = useState(3);
  const [notes,          setNotes]          = useState("");
  const [saved,          setSaved]          = useState(false);

  async function save() {
    const payload = {
      date, classType, durationMinutes: 60, techniques,
      rounds:        classType === "advanced" ? rounds         : undefined,
      roundDuration: classType === "advanced" ? roundDuration  : undefined,
      breakDuration: classType === "advanced" ? breakDuration  : undefined,
      intensity, notes,
    };
    try {
      await fetch("/api/bjj", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch { /* offline */ }
    setSaved(true);
  }

  if (saved) {
    return (
      <div className="pt-20 pb-6 flex flex-col items-center gap-6 text-center">
        <div className="text-5xl">🥋</div>
        <div>
          <h2 className="text-2xl font-bold text-[#495057] tracking-tight">Session logged</h2>
          <p className="text-gray-400 text-sm mt-2">Keep rolling.</p>
        </div>
        <button onClick={() => setSaved(false)} className="text-sm text-gray-400 underline underline-offset-2">
          Log another
        </button>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-6 space-y-8">

      <div>
        <h2 className="text-3xl font-bold text-[#495057] tracking-tight">Log BJJ Session</h2>
        <p className="text-gray-400 text-sm mt-1.5">Track your training</p>
      </div>

      {/* Class type + date — peach-glow panel */}
      <section className="rounded-3xl p-5 space-y-4" style={{ background: PEACH }}>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Class type</p>

        <div className="space-y-3">
          {(["fundamentals", "advanced"] as BJJClassType[]).map((type) => {
            const selected = classType === type;
            return (
              <button
                key={type}
                onClick={() => setClassType(type)}
                className="w-full bg-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm border border-white/80 text-left transition-opacity"
                style={{ opacity: selected ? 1 : 0.5 }}
              >
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-500">
                  {type === "fundamentals" ? "F" : "A"}
                </div>
                <div>
                  <p className="font-semibold text-[#495057] text-base capitalize">{type}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {type === "fundamentals" ? "Drilling & technique" : "Live rolling"}
                  </p>
                </div>
                {selected && <div className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#ffc09f" }} />}
              </button>
            );
          })}
        </div>

        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Date</p>
          <div className="w-full overflow-hidden rounded-2xl bg-white border border-white/80 shadow-sm">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-w-0 px-5 py-4 text-[#495057] text-sm bg-transparent focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Techniques */}
      <section className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">Techniques / drills</p>
        <textarea
          value={techniques}
          onChange={(e) => setTechniques(e.target.value)}
          placeholder="e.g. single leg takedown, half guard sweep..."
          className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-[#495057] text-sm resize-none h-24 focus:outline-none focus:border-gray-300 placeholder:text-gray-300 shadow-sm"
        />
      </section>

      {/* Rolling details — deeper peach panel */}
      {classType === "advanced" && (
        <section className="rounded-3xl p-5 space-y-4" style={{ background: PEACH_DEEP }}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Rolling details</p>

          <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-white/80 space-y-1">
            <p className="text-xs text-gray-400">Rounds completed</p>
            <input
              type="number" min={0}
              value={rounds ?? ""}
              onChange={(e) => setRounds(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="e.g. 5"
              className="w-full text-[#495057] font-semibold text-lg focus:outline-none placeholder:text-gray-300 placeholder:font-normal placeholder:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl px-4 py-4 shadow-sm border border-white/80 space-y-1">
              <p className="text-xs text-gray-400">Round (sec)</p>
              <input
                type="number" value={roundDuration}
                onChange={(e) => setRoundDuration(parseInt(e.target.value))}
                className="w-full text-[#495057] font-semibold text-lg focus:outline-none"
              />
            </div>
            <div className="bg-white rounded-2xl px-4 py-4 shadow-sm border border-white/80 space-y-1">
              <p className="text-xs text-gray-400">Break (sec)</p>
              <input
                type="number" value={breakDuration}
                onChange={(e) => setBreakDuration(parseInt(e.target.value))}
                className="w-full text-[#495057] font-semibold text-lg focus:outline-none"
              />
            </div>
          </div>
        </section>
      )}

      {/* Intensity */}
      <section className="bg-white rounded-3xl p-5 space-y-4 shadow-sm border border-gray-100">
        <FeelingRating label="Intensity" value={intensity} onChange={setIntensity} color="#ffc09f" />
      </section>

      {/* Notes */}
      <section className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">Notes</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes..."
          className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-[#495057] text-sm resize-none h-20 focus:outline-none focus:border-gray-300 placeholder:text-gray-300 shadow-sm"
        />
      </section>

      <button onClick={save} className="w-full rounded-2xl py-5 font-semibold text-base transition-opacity shadow-sm active:opacity-75 text-[#495057]" style={{ background: "#ffc09f" }}>
        Save Session
      </button>
    </div>
  );
}
