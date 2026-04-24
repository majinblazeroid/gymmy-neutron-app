"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Clock, Dumbbell, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function goGym() {
    setOpen(false);
    try { localStorage.removeItem("gymmy_workout_draft"); } catch {}
    router.push("/workout");
  }

  function goBJJ() {
    setOpen(false);
    router.push("/bjj");
  }

  const historyActive = pathname === "/history";

  return (
    <>
      {/* Picker */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed left-0 right-0 z-50 max-w-lg mx-auto px-4 pb-3 space-y-2"
            style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
          >
            <button
              onClick={goGym}
              className="bg-white rounded-2xl px-5 py-4 w-full flex items-center gap-4 shadow-sm border border-white/80 text-left active:opacity-70 transition-opacity"
            >
              <div className="w-9 h-9 rounded-xl bg-[#adf7b6]/30 flex items-center justify-center flex-shrink-0">
                <Dumbbell size={16} style={{ color: "#2d8a5e" }} />
              </div>
              <div>
                <p className="font-semibold text-[#495057] text-sm">Gym Workout</p>
                <p className="text-gray-400 text-xs mt-0.5">Log your lifting session</p>
              </div>
            </button>

            <button
              onClick={goBJJ}
              className="bg-white rounded-2xl px-5 py-4 w-full flex items-center gap-4 shadow-sm border border-white/80 text-left active:opacity-70 transition-opacity"
            >
              <div className="w-9 h-9 rounded-xl bg-[#ffc09f]/30 flex items-center justify-center flex-shrink-0">
                <Shield size={16} style={{ color: "#b55e2a" }} />
              </div>
              <div>
                <p className="font-semibold text-[#495057] text-sm">BJJ Session</p>
                <p className="text-gray-400 text-xs mt-0.5">Log your mat time</p>
              </div>
            </button>
          </div>
        </>
      )}

      {/* Nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-lg mx-auto flex items-center">

          {/* + button */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors text-gray-400"
          >
            <div className="w-9 h-9 rounded-full bg-[#495057] flex items-center justify-center -mt-1">
              <span className="text-white text-2xl leading-none font-light">
                {open ? "×" : "+"}
              </span>
            </div>
          </button>

          {/* History */}
          <Link
            href="/history"
            onClick={() => setOpen(false)}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors",
              historyActive ? "text-[#495057]" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Clock size={20} strokeWidth={historyActive ? 2.5 : 1.5} />
            <span className={cn("font-medium", historyActive && "font-semibold")}>History</span>
          </Link>

        </div>
      </nav>
    </>
  );
}
