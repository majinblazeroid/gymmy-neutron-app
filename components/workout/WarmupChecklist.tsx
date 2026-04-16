"use client";

import { useState } from "react";
import { Warmup } from "@/lib/types";
import { Check } from "lucide-react";

interface WarmupChecklistProps {
  warmups: Warmup[];
  onDone: (completed: boolean) => void;
}

export default function WarmupChecklist({ warmups, onDone }: WarmupChecklistProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allDone = warmups.length > 0 && checked.size === warmups.length;

  return (
    <div className="pt-8 pb-6 space-y-8">

      <div>
        <h2 className="text-3xl font-bold text-[#495057] tracking-tight">Warmup</h2>
        <p className="text-gray-400 text-sm mt-1.5">Tick off as you go</p>
      </div>

      {/* Checklist panel — mint wash, white cards inside */}
      <section
        className="rounded-3xl p-5 space-y-3"
        style={{ background: "rgba(173, 247, 182, 0.20)" }}
      >
        {warmups.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">No warmup exercises loaded.</p>
        ) : (
          warmups.map((w) => {
            const done = checked.has(w.id);
            return (
              <button
                key={w.id}
                onClick={() => toggle(w.id)}
                className="w-full bg-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm border border-white/80 text-left transition-opacity active:opacity-70"
                style={{ opacity: done ? 0.55 : 1 }}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  done ? "bg-[#6c757d] border-[#6c757d]" : "border-gray-300 bg-white"
                }`}>
                  {done && <Check size={11} strokeWidth={3} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-snug ${done ? "line-through text-gray-400" : "text-[#495057]"}`}>
                    {w.name}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">{w.prescription}</p>
                </div>
              </button>
            );
          })
        )}

        {warmups.length > 0 && (
          <p className="text-center text-xs text-gray-400 pt-1">
            {checked.size} / {warmups.length} done
          </p>
        )}
      </section>

      <div className="flex gap-3">
        <button
          onClick={() => onDone(false)}
          className="flex-1 bg-white border border-gray-100 text-gray-500 rounded-2xl py-4 font-semibold text-sm shadow-sm"
        >
          Skip
        </button>
        <button
          onClick={() => onDone(checked.size > 0)}
          className="flex-1 bg-[#6c757d] hover:bg-[#5a6268] text-white rounded-2xl py-4 font-semibold text-sm transition-colors shadow-sm"
        >
          {allDone ? "Done — Start Lifting" : "Continue"}
        </button>
      </div>
    </div>
  );
}