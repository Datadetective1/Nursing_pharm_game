import type { Cognitive, Difficulty } from "@/lib/types";

/** Per-concept learning state (persisted). */
export interface ConceptStat {
  /** mastery 0–100 (before recency decay) */
  m: number;
  /** Leitner box 0–5 */
  box: number;
  /** next due timestamp (ms) */
  due: number;
  /** last seen timestamp */
  last: number;
  seen: number;
  correct: number;
  wrong: number;
  /** consecutive correct answers */
  streak: number;
  /** correct answers on application-level items (apply/analyze/evaluate, or difficulty 3) */
  applied: number;
  /** confident-but-wrong count (false confidence) */
  confWrong: number;
  /** lucky guesses (correct while "guessing") */
  guessRight: number;
  /** distinct study sessions with a correct answer */
  sessions: number;
  lastSessionId?: string;
  /** recent results, newest last (max 8) */
  recent: boolean[];
}

export type Confidence = "guess" | "unsure" | "confident";

export interface AnswerEvent {
  correct: boolean;
  difficulty: Difficulty;
  cognitive: Cognitive;
  confidence?: Confidence;
  /** response time in ms */
  ms: number;
  sessionId: string;
  now: number;
}

/** Leitner intervals in minutes. Compressed because the exam is days away, not months. */
export const INTERVALS_MIN = [0, 10, 60, 6 * 60, 24 * 60, 3 * 24 * 60];

export const emptyStat = (): ConceptStat => ({
  m: 0,
  box: 0,
  due: 0,
  last: 0,
  seen: 0,
  correct: 0,
  wrong: 0,
  streak: 0,
  applied: 0,
  confWrong: 0,
  guessRight: 0,
  sessions: 0,
  recent: [],
});

export const isApplication = (cognitive: Cognitive, difficulty: Difficulty) =>
  cognitive === "apply" || cognitive === "analyze" || cognitive === "evaluate" || difficulty === 3;

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/**
 * Mastery update (accuracy, confidence, response time, difficulty, application success, spaced retrieval).
 * Caps enforce mastery learning:
 *   - no application-level success yet → max 55 ("Learning")
 *   - fewer than 2 application successes, fewer than 3 correct, or correct in fewer than 2 sessions → max 79 (not "Mastered")
 */
export function updateConcept(prev: ConceptStat | undefined, ev: AnswerEvent): ConceptStat {
  const s: ConceptStat = { ...(prev ?? emptyStat()), recent: [...(prev?.recent ?? [])] };
  const app = isApplication(ev.cognitive, ev.difficulty);
  s.seen += 1;
  s.last = ev.now;
  s.recent.push(ev.correct);
  if (s.recent.length > 8) s.recent.shift();

  let delta: number;
  if (ev.correct) {
    s.correct += 1;
    s.streak += 1;
    if (app) s.applied += 1;
    if (s.lastSessionId !== ev.sessionId) {
      s.sessions += 1;
      s.lastSessionId = ev.sessionId;
    }
    delta = 7 + 5 * (ev.difficulty - 1) + (app ? 4 : 0);
    if (ev.confidence === "guess") {
      delta *= 0.4;
      s.guessRight += 1;
    } else if (ev.confidence === "unsure") delta *= 0.75;
    if (ev.ms > 0 && ev.ms < 12000) delta += 2;
    else if (ev.ms > 75000) delta -= 2;
  } else {
    s.wrong += 1;
    s.streak = 0;
    // Missing an easy item is a stronger signal than missing a hard one.
    delta = -(10 + 4 * (3 - ev.difficulty));
    if (ev.confidence === "confident") {
      delta -= 8; // false confidence
      s.confWrong += 1;
    }
  }

  let m = clamp(s.m + delta);
  if (s.applied < 1) m = Math.min(m, 55);
  if (s.applied < 2 || s.correct < 3 || s.sessions < 2) m = Math.min(m, 79);
  s.m = Math.round(m * 10) / 10;

  // Leitner scheduling
  if (!ev.correct) s.box = 0;
  else if (ev.confidence !== "guess") s.box = Math.min(5, s.box + 1);
  s.due = ev.now + INTERVALS_MIN[s.box] * 60_000;
  return s;
}

/** Mastery adjusted for forgetting: overdue items decay slowly (floor 75%). */
export function effectiveMastery(s: ConceptStat | undefined, now: number): number {
  if (!s || s.seen === 0) return 0;
  if (now <= s.due || s.box === 0) return s.m;
  const overdueDays = (now - s.due) / 86_400_000;
  const factor = Math.max(0.75, 1 - 0.06 * overdueDays);
  return Math.round(s.m * factor * 10) / 10;
}

export type MasteryState = "unseen" | "weak" | "learning" | "strong" | "mastered";

export function masteryState(s: ConceptStat | undefined, now: number): MasteryState {
  if (!s || s.seen === 0) return "unseen";
  const e = effectiveMastery(s, now);
  if (e >= 80) return "mastered";
  if (e >= 60) return "strong";
  if (e >= 30) return "learning";
  return "weak";
}

export const STATE_LABEL: Record<MasteryState, string> = {
  unseen: "Unseen",
  weak: "Weak",
  learning: "Learning",
  strong: "Strong",
  mastered: "Mastered",
};

/** Quest-node states use "Shaky" for low-but-attempted nodes. */
export type NodeState = "unseen" | "shaky" | "learning" | "strong" | "mastered";

export function nodeState(avg: number, anySeen: boolean): NodeState {
  if (!anySeen) return "unseen";
  if (avg >= 80) return "mastered";
  if (avg >= 60) return "strong";
  if (avg >= 30) return "learning";
  return "shaky";
}

/** Weakness score for "Fix My Weak Spots" (higher = weaker). */
export function weaknessScore(s: ConceptStat | undefined, now: number, openMistakes: number): number {
  if (!s || s.seen === 0) return 35; // unseen: moderately weak, but attempted-and-missed ranks higher
  const e = effectiveMastery(s, now);
  const acc = s.seen ? s.correct / s.seen : 0;
  const recentWrong = s.recent.slice(-4).filter((x) => !x).length;
  const daysSince = (now - s.last) / 86_400_000;
  return (
    (100 - e) * 0.6 +
    (1 - acc) * 30 +
    s.confWrong * 12 +
    openMistakes * 8 +
    recentWrong * 6 +
    Math.min(daysSince, 3) * 3
  );
}
