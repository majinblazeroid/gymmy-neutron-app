/**
 * Progression Algorithm v2 — TypeScript port
 *
 * Rules (priority order):
 *   0a. Gap detection   — >14 days → ramp-up pyramid (65%, 80%, 100%)
 *   0b. Bad day         — last session feeling=1 → hold last good session weights
 *   1.  Full deload     — ≥ half sets below rep_min → −10% (floor to 2.5kg)
 *   2.  Smart deload    — only last set failed → feeder sets −2.5kg, last set at top weight
 *   3.  Hold            — all in range but not all at max
 *   4a. New wave        — all same weight + all max: needs 2 consecutive good sessions
 *   4b. Mid-wave        — mixed weights + all max: 1 session sufficient
 *   BW. Bodyweight      — 3-session plateau / ceiling / trending detection
 */

// ── Data types ────────────────────────────────────────────────────────────────

export interface PSet {
  setNumber: number;
  weight: number;      // kg (0.0 for bodyweight)
  reps: number;
  isWarmup: boolean;
}

export interface PSession {
  date: string;        // "YYYY-MM-DD"
  preFeeling: number;  // 1=💀 2=😐 3=🙂 4=💪 5=🔥
  postFeeling: number;
  sets: PSet[];
}

export interface SuggestedSet {
  setNumber: number;
  weight: number;
  targetReps: number;
  note: string;        // e.g. "↑ +2.5kg (new wave)", "hold", "feeder − 2.5kg"
}

export interface ProgressionResult {
  action: string;
  suggestedSets: SuggestedSet[];
  proof: string[];
  confidence: "high" | "medium" | "low";
}

// ── Action constants ──────────────────────────────────────────────────────────

export const ACTION_NO_DATA          = "no_data";
export const ACTION_RAMP_UP          = "ramp_up";
export const ACTION_BAD_DAY_RECOVERY = "bad_day_recovery";
export const ACTION_DELOAD_FULL      = "deload_full";
export const ACTION_DELOAD_SMART     = "deload_smart";
export const ACTION_HOLD             = "hold";
export const ACTION_INCREASE_WAVE    = "increase_wave";
export const ACTION_ADD_WEIGHT_BW    = "add_weight_bw";
export const ACTION_INCREASE_REPS_BW = "increase_reps_bw";

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseRepRange(s: string): [number, number] {
  const m = s.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (m) return [parseInt(m[1]), parseInt(m[2])];
  const n = s.match(/(\d+)/);
  if (n) { const v = parseInt(n[1]); return [v, v]; }
  return [0, 999];
}

function isBadDay(s: PSession): boolean {
  return s.preFeeling === 1 || s.postFeeling === 1;
}

function workingSets(s: PSession): PSet[] {
  return s.sets
    .filter((w) => !w.isWarmup)
    .sort((a, b) => a.setNumber - b.setNumber);
}

function topWeight(sets: PSet[]): number {
  return sets.reduce((acc, s) => Math.max(acc, s.weight), 0);
}

function roundDownTo(x: number, increment = 2.5): number {
  return Math.floor(x / increment) * increment;
}

function roundToNearest(x: number, increment = 2.5): number {
  return Math.round(x / increment) * increment;
}

function daysGap(sessionDate: string, today?: string): number {
  const d = new Date(sessionDate).getTime();
  const t = today ? new Date(today).getTime() : Date.now();
  return Math.floor((t - d) / (1000 * 60 * 60 * 24));
}

function fmtSets(sets: PSet[]): string {
  return sets.map((s) => `${s.weight}×${s.reps}`).join("  ");
}

// ── Entry point ───────────────────────────────────────────────────────────────

export function computeProgression(
  exerciseName: string,
  exerciseType: string,        // "weighted" | "bodyweight" | "timed_carry"
  suggestedReps: string,       // e.g. "6-8"
  suggestedSets: number,       // e.g. 3
  sessions: PSession[],        // oldest → newest
  today?: string,              // "YYYY-MM-DD" override (default: system date)
): ProgressionResult {
  const proof: string[] = [
    `Exercise: ${exerciseName}  |  Type: ${exerciseType}  |  Template: ${suggestedSets}×${suggestedReps}`,
  ];

  if (sessions.length === 0) {
    proof.push("No sessions logged yet — nothing to analyse.");
    return { action: ACTION_NO_DATA, suggestedSets: [], proof, confidence: "low" };
  }

  if (exerciseType === "bodyweight") {
    return computeBodyweight(suggestedReps, suggestedSets, sessions, proof);
  }

  if (exerciseType === "weighted" || exerciseType === "timed_carry") {
    return computeWeighted(exerciseName, suggestedReps, suggestedSets, sessions, proof, today);
  }

  proof.push(`Exercise type '${exerciseType}' has no progression rules defined.`);
  return { action: ACTION_NO_DATA, suggestedSets: [], proof, confidence: "low" };
}

// ── Weighted / timed_carry ────────────────────────────────────────────────────

function computeWeighted(
  name: string,
  suggestedReps: string,
  numSets: number,
  sessions: PSession[],
  proof: string[],
  today?: string,
): ProgressionResult {
  const [repMin, repMax] = parseRepRange(suggestedReps);
  proof.push(`Rep range: ${repMin}–${repMax}`);

  const goodSessions = sessions.filter((s) => !isBadDay(s));
  const badCount = sessions.length - goodSessions.length;
  proof.push(
    `Sessions: ${sessions.length} total  |  ${goodSessions.length} good  |  ${badCount} bad-day (feeling=1)`
  );

  const last = sessions[sessions.length - 1];

  // ── Rule 0a: Gap detection ────────────────────────────────────────────────
  const gap = daysGap(last.date, today);
  if (gap > 14) {
    const refSets = (() => {
      for (let i = sessions.length - 1; i >= 0; i--) {
        const ws = workingSets(sessions[i]);
        if (ws.length > 0) return ws;
      }
      return [] as PSet[];
    })();

    if (refSets.length > 0) {
      const tw  = topWeight(refSets);
      const s1w = roundToNearest(tw * 0.65);
      const s2w = roundToNearest(tw * 0.80);
      proof.push(`⏱  ${gap} days since last session (${last.date}) — gap > 14 days.`);
      proof.push(
        `Ramp-up: set 1 at ${s1w}kg (~65%),  set 2 at ${s2w}kg (~80%),  remaining at ${tw}kg (working weight).`
      );
      proof.push("Do not push to failure on the first two sets — they are activation work.");
      const suggested: SuggestedSet[] = [
        { setNumber: 1, weight: s1w, targetReps: repMax, note: "ramp-up (~65%)" },
      ];
      if (numSets >= 2) suggested.push({ setNumber: 2, weight: s2w, targetReps: repMax, note: "ramp-up (~80%)" });
      for (let i = 2; i < numSets; i++)
        suggested.push({ setNumber: i + 1, weight: tw, targetReps: repMax, note: "working weight" });
      return { action: ACTION_RAMP_UP, suggestedSets: suggested, proof, confidence: "high" };
    }
  }

  // ── Rule 0b: Bad day recovery ─────────────────────────────────────────────
  if (isBadDay(last)) {
    proof.push(
      `⚠️  Last session (${last.date}) was a BAD DAY  (pre=${last.preFeeling}, post=${last.postFeeling}).`
    );
    const lastGood = goodSessions.length > 0 ? goodSessions[goodSessions.length - 1] : null;
    if (!lastGood) {
      proof.push("No good sessions on record — cannot determine recovery target.");
      return { action: ACTION_NO_DATA, suggestedSets: [], proof, confidence: "low" };
    }
    const ws = workingSets(lastGood);
    proof.push(`Recovery target: weights from last good session (${lastGood.date}): ${fmtSets(ws)}`);
    proof.push("Hold these weights next session. If all sets hit target, normal progression resumes.");
    const suggested = ws.map((s) => ({
      setNumber: s.setNumber,
      weight: s.weight,
      targetReps: repMax,
      note: "bad-day recovery — hold",
    }));
    return { action: ACTION_BAD_DAY_RECOVERY, suggestedSets: suggested, proof, confidence: "high" };
  }

  // ── Analyse last session ──────────────────────────────────────────────────
  const ws = workingSets(last);
  if (ws.length === 0) {
    proof.push(`No working sets found in last session (${last.date}).`);
    return { action: ACTION_NO_DATA, suggestedSets: [], proof, confidence: "low" };
  }

  const tw       = topWeight(ws);
  const aboveMax = ws.filter((s) => s.reps >= repMax);
  const inRange  = ws.filter((s) => s.reps >= repMin && s.reps < repMax);
  const belowMin = ws.filter((s) => s.reps < repMin);
  const total    = ws.length;

  proof.push(`Last session (${last.date}): ${fmtSets(ws)}`);
  proof.push(`Top weight used: ${tw}kg`);
  proof.push(
    `Per-set — at/above max (≥${repMax}): ${aboveMax.length}  in range: ${inRange.length}  below min (<${repMin}): ${belowMin.length}`
  );
  for (const s of ws) {
    const status = s.reps >= repMax ? "✅ max" : s.reps >= repMin ? "🟡 in range" : "❌ failed";
    proof.push(`  set ${s.setNumber}: ${s.weight}kg × ${s.reps}  [${status}]`);
  }

  // ── Rule 1: Full deload ───────────────────────────────────────────────────
  if (belowMin.length >= total / 2) {
    const deloadW = roundDownTo(tw * 0.9);
    proof.push(`❌ ${belowMin.length}/${total} sets below minimum (${repMin} reps) → full deload.`);
    proof.push(`Deload weight: ${tw}kg × 0.9 = ${(tw * 0.9).toFixed(2)}kg → rounded down to ${deloadW}kg`);
    proof.push(`Rebuild at ${deloadW}kg, aiming for ${repMin}–${repMax} reps on all sets.`);
    const suggested = Array.from({ length: numSets }, (_, i) => ({
      setNumber: i + 1,
      weight: deloadW,
      targetReps: repMin,
      note: "full deload — rebuild",
    }));
    return { action: ACTION_DELOAD_FULL, suggestedSets: suggested, proof, confidence: "high" };
  }

  // ── Rule 2: Smart deload ──────────────────────────────────────────────────
  const lastSetFailed = ws[ws.length - 1].reps < repMin;
  const firstSetsOk   = ws.slice(0, -1).every((s) => s.reps >= repMin);

  if (lastSetFailed && firstSetsOk) {
    const feederW = tw - 2.5;
    proof.push(
      `⚠️  First ${total - 1} set(s) OK, last set (${ws[ws.length - 1].weight}kg × ${ws[ws.length - 1].reps} reps) failed (needed ≥${repMin}) → smart deload.`
    );
    proof.push(
      `Strategy: feeder sets 1–${total - 1} at ${feederW}kg (−2.5kg), then attack ${tw}kg on the final set.`
    );
    const suggested: SuggestedSet[] = [];
    for (let i = 0; i < total - 1; i++)
      suggested.push({ setNumber: i + 1, weight: feederW, targetReps: repMax, note: `feeder — −2.5kg from ${tw}kg` });
    suggested.push({ setNumber: total, weight: tw, targetReps: repMax, note: `target — hit ${tw}kg` });
    return { action: ACTION_DELOAD_SMART, suggestedSets: suggested, proof, confidence: "medium" };
  }

  // ── Rule 3: Hold — all in range but not all at max ────────────────────────
  const allInRange = belowMin.length === 0;
  const allAtMax   = aboveMax.length === total;

  if (allInRange && !allAtMax) {
    proof.push(
      `✋ All sets within ${repMin}–${repMax} but only ${aboveMax.length}/${total} hit ${repMax}+ → not ready to increase.`
    );
    proof.push(`Aim: get all ${total} sets to ${repMax}+ reps, then we increase.`);
    const suggested = ws.map((s) => ({ setNumber: s.setNumber, weight: s.weight, targetReps: repMax, note: "hold" }));
    return { action: ACTION_HOLD, suggestedSets: suggested, proof, confidence: "high" };
  }

  // ── Rule 4: Wave loading — all sets hit max ───────────────────────────────
  if (allAtMax) {
    const allSameWeight = new Set(ws.map((s) => s.weight)).size === 1;
    const lowerSets     = ws.filter((s) => s.weight < tw);

    // 4b: Mid-wave — mixed weights, 1 session sufficient
    if (!allSameWeight) {
      const highestLower = lowerSets.reduce((a, b) => (b.setNumber > a.setNumber ? b : a));
      const remainingLow = lowerSets.filter((s) => s.setNumber < highestLower.setNumber);

      proof.push(
        `✅ All sets hit ${repMax}+.  Top weight (${tw}kg): ${ws.filter((s) => s.weight === tw).length} set(s).  Lower: ${lowerSets.length} set(s).`
      );
      proof.push(
        `Mid-wave: move set ${highestLower.setNumber} from ${highestLower.weight}kg → ${tw}kg. (1 session confirmation is enough for mid-wave.)`
      );
      if (remainingLow.length > 0) {
        proof.push(`${remainingLow.length} more set(s) to bring up in subsequent sessions.`);
      } else {
        proof.push(`After next session: all sets at ${tw}kg — next wave needs 2 confirmations.`);
      }
      const suggested = ws.map((s) =>
        s.setNumber === highestLower.setNumber
          ? { setNumber: s.setNumber, weight: tw, targetReps: repMax, note: `↑ ${s.weight}kg → ${tw}kg` }
          : { setNumber: s.setNumber, weight: s.weight, targetReps: repMax, note: "hold" }
      );
      return { action: ACTION_INCREASE_WAVE, suggestedSets: suggested, proof, confidence: "high" };
    }

    // 4a: New wave — all same weight, needs 2 consecutive good sessions
    const last2Good = goodSessions.slice(-2);
    if (last2Good.length < 2) {
      proof.push(`✅ Last session (${last.date}) hit ${repMax}+ on all sets at ${tw}kg.`);
      proof.push(`Need 2 consecutive good sessions at ${tw}kg to confirm → hold.`);
      proof.push("Do it again next session — if you hit it again, we'll bump the last set.");
      const suggested = ws.map((s) => ({
        setNumber: s.setNumber,
        weight: s.weight,
        targetReps: repMax,
        note: "hold — confirming",
      }));
      return { action: ACTION_HOLD, suggestedSets: suggested, proof, confidence: "high" };
    }

    const prev    = last2Good[last2Good.length - 2];
    const prevWs  = workingSets(prev);
    const prevAllSame = prevWs.length > 0 && new Set(prevWs.map((s) => s.weight)).size === 1;
    const prevTop     = prevWs.length > 0 ? topWeight(prevWs) : 0;
    const prevAllMax  = prevWs.length > 0 && prevWs.every((s) => s.reps >= repMax);

    if (prevAllSame && prevAllMax && Math.abs(prevTop - tw) < 0.01) {
      const newW       = roundToNearest(tw + 2.5);
      const nextTarget = ws.length > 1 ? ws[ws.length - 2].setNumber : ws[ws.length - 1].setNumber;
      proof.push(
        `✅ CONFIRMED: sessions on ${prev.date} AND ${last.date} both hit ${repMax}+ on all sets at ${tw}kg.`
      );
      proof.push(`Wave loading: bump last set (set ${ws[ws.length - 1].setNumber}) from ${tw}kg → ${newW}kg.`);
      proof.push(
        `Next milestone: hit ${repMax} reps at ${newW}kg → then bump set ${nextTarget} (mid-wave, 1 session needed).`
      );
      const suggested = ws.map((s, idx) =>
        idx === ws.length - 1
          ? { setNumber: s.setNumber, weight: newW, targetReps: repMax, note: `↑ +2.5kg (new wave)` }
          : { setNumber: s.setNumber, weight: s.weight, targetReps: repMax, note: "hold" }
      );
      return { action: ACTION_INCREASE_WAVE, suggestedSets: suggested, proof, confidence: "high" };
    }

    proof.push(`✅ Last session (${last.date}) hit ${repMax}+ on all sets at ${tw}kg.`);
    proof.push(`Previous session didn't confirm at same weight — hold for one more session.`);
    const suggested = ws.map((s) => ({
      setNumber: s.setNumber,
      weight: s.weight,
      targetReps: repMax,
      note: "hold — confirming",
    }));
    return { action: ACTION_HOLD, suggestedSets: suggested, proof, confidence: "high" };
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  proof.push("Mixed performance not matched by any specific rule → hold.");
  const suggested = ws.map((s) => ({ setNumber: s.setNumber, weight: s.weight, targetReps: repMax, note: "hold" }));
  return { action: ACTION_HOLD, suggestedSets: suggested, proof, confidence: "medium" };
}

// ── Bodyweight ────────────────────────────────────────────────────────────────

function computeBodyweight(
  suggestedReps: string,
  numSets: number,
  sessions: PSession[],
  proof: string[],
): ProgressionResult {
  const [, repMax] = parseRepRange(suggestedReps);
  const good = sessions.filter((s) => !isBadDay(s));
  proof.push(`Rep range parsed. Good sessions available: ${good.length}`);

  if (good.length < 3) {
    proof.push("Need at least 3 good sessions to assess bodyweight plateau.");
    return { action: ACTION_NO_DATA, suggestedSets: [], proof, confidence: "low" };
  }

  const totalReps = (s: PSession) =>
    workingSets(s).reduce((acc, w) => acc + w.reps, 0);

  const repCeiling = repMax * numSets;
  const last3      = good.slice(-3);
  const totals     = last3.map(totalReps);
  proof.push(
    `Total reps in last 3 sessions: ${totals[0]} → ${totals[1]} → ${totals[2]}  |  Ceiling: ${repMax}×${numSets} = ${repCeiling}`
  );

  if (totals.every((t) => t >= repCeiling)) {
    proof.push(`✅ Hit ceiling (${repCeiling}) for 3 consecutive sessions.`);
    proof.push("Time to progress: (A) add weight vest / dumbbell hold, (B) increase target reps.");
    return { action: ACTION_ADD_WEIGHT_BW, suggestedSets: [], proof, confidence: "high" };
  }

  if (new Set(totals).size === 1) {
    proof.push(`📊 Total reps identical (${totals[0]}) across last 3 sessions → plateau.`);
    proof.push("Add 1–2 reps per set to break through.");
    return { action: ACTION_INCREASE_REPS_BW, suggestedSets: [], proof, confidence: "medium" };
  }

  if (totals[2] > totals[1] && totals[1] > totals[0]) {
    proof.push("📈 Reps trending up each session — still progressing, not yet at ceiling.");
    return { action: ACTION_HOLD, suggestedSets: [], proof, confidence: "medium" };
  }

  proof.push("Inconsistent rep pattern — keep logging to establish a clear trend.");
  return { action: ACTION_HOLD, suggestedSets: [], proof, confidence: "low" };
}
