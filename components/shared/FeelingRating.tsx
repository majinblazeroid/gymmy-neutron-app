"use client";

const EMOJIS = ["💀", "😐", "🙂", "💪", "🔥"];

interface FeelingRatingProps {
  value: number;
  onChange: (v: number) => void;
  label?: string;
  color?: string;
}

export default function FeelingRating({ value, onChange, label, color = "#6c757d" }: FeelingRatingProps) {
  return (
    <div className="space-y-3">
      {label && <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</p>}
      <div className="flex gap-2">
        {EMOJIS.map((emoji, i) => {
          const rating = i + 1;
          const selected = value === rating;
          return (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(rating)}
              className="flex-1 text-2xl rounded-2xl py-3 transition-all"
              style={{
                background: selected ? color : "#f3f4f6",
                transform: selected ? "scale(1.08)" : "scale(1)",
              }}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}