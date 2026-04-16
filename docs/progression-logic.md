# Progression Logic — Weight Increase Rules

This documents the logic in `lib/progression.ts` that decides whether to increase, hold, or deload weight for each exercise. Review this before wiring it into the UI.

---

## Applies to

Only **weighted** and **timed_carry** exercises (i.e. exercises where you enter a weight). Bodyweight and timed exercises have separate simpler rules (see bottom).

---

## Input

The last **4 sessions** for the given day are fetched. Only **working sets** (non-warmup) are considered.

---

## Weighted Exercise Rules (in priority order)

### 1. Increase — 2 sessions at max reps
**Condition:** In both of the last 2 sessions, every working set hit or exceeded the top of the rep range (e.g. if rep range is `8-10`, every set was ≥ 10 reps).

**Action:** `increase` → add **+2.5kg**

**Reasoning shown:** `"Hit 10+ reps on all sets for 2 sessions — time to go up"`

---

### 2. Deload — 2 sessions below min reps
**Condition:** In both of the last 2 sessions, at least one working set was below the bottom of the rep range (e.g. rep range `8-10`, a set got < 8 reps).

**Action:** `deload` → round down to **90% of current weight** (rounded to nearest 0.5kg)

**Reasoning shown:** `"Missed bottom of rep range 2 sessions in a row"`

---

### 3. Forced jump — 4 sessions identical
**Condition:** All 4 of the last 4 sessions have the exact same top weight AND the exact same total reps. You're completely stuck.

**Action:** `increase` → add **+2.5kg** (medium confidence)

**Reasoning shown:** `"Same weight and reps for 4 sessions — forced small jump"`

---

### 4. Hold — everything else
**Condition:** None of the above triggered.

**Action:** `hold` — stay at current weight

**Reasoning shown:** `"Stay at 80kg — aim for 10/10/10"` (example)

---

## What "current weight" means

The top weight across all working sets in the most recent session. If you did 75kg × 8, 80kg × 8, 80kg × 7 — current weight is **80kg**.

---

## Bodyweight Exercise Rules (simpler)

- If total reps increased from oldest to newest session → `hold` ("trending up")
- If total reps identical for 3 sessions → `increase` ("consider adding weight")
- Otherwise → no suggestion

---

## Potential issues to consider before implementing

1. **+2.5kg is hardcoded for everything** — big compound lifts (squat, deadlift) and small isolation movements get the same increment. May want different increments per exercise type.
2. **"All sets at max reps"** is strict — if even one set falls short, no increase is triggered even if performance was great overall.
3. **Rep range parsing** uses the `suggestedReps` string from the template (e.g. `"8-10"`, `"5"`, `"8-12"`). If the format varies, parsing could fail and fall back to `{ min: 0, max: 999 }` which would never trigger an increase.
4. **Less than 2 sessions** → returns a "not enough data" hold. The UI should show nothing rather than "hold".
5. **Mixed units** (kg vs lbs) — all comparisons are done on raw numbers with no unit conversion. If you switch units between sessions, suggestions will be wrong.
