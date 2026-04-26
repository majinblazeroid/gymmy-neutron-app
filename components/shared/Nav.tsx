"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Nav() {
  const pathname = usePathname();
  const historyActive = pathname === "/history";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="max-w-lg mx-auto flex items-center">

        {/* + → Home */}
        <Link
          href="/"
          className="flex-1 flex flex-col items-center gap-1 py-3 text-xs text-gray-400"
        >
          <div className="w-9 h-9 rounded-full bg-[#495057] flex items-center justify-center -mt-1">
            <span className="text-white text-2xl leading-none font-light">+</span>
          </div>
        </Link>

        {/* History */}
        <Link
          href="/history"
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
  );
}