import type { Question } from "@/lib/types";
import type { Activity } from "@/lib/activities/types";
import { effectiveMastery, masteryState, type ConceptStat, type MasteryState } from "./mastery";

/**
 * Knowledge state (Learn → Practice → Test), tracked SEPARATELY from mastery:
 *   Exposure → Understanding (lesson) → Guided practice → Recall → Application → Mastery (mastery.ts).
 * Viewing a card is exposure, never mastery.
 *
 * Scaffold levels (per concept), raised automatically by demonstrated success:
 *   1 recognition + strong hints · 2 recognition, no hints · 3 recall · 4 application ·
 *   5 clinical scenario · 6 exam-style discrimination
 */
export type Level = 1 | 2 | 3 | 4 | 5 | 6;

export interface LearnStat {
  /** first time a teaching step for this concept was shown */
  exposed?: number;
  /** finished a full lesson that teaches it */
  lesson?: number;
  /** demonstrated without teaching (Test-out diagnostic, or strong history before the upgrade) */
  testedOut?: number;
  /** last "Teach me this" / Relearn */
  relearned?: number;
  /** [attempts, first-try correct] */
  guided: [number, number];
  recall: [number, number];
  apply: [number, number];
  level: Level;
  /** consecutive first-try results at the current level: +n correct, −n wrong */
  run: number;
}

export interface UnitStat {
  lessonDone?: number;
  pretest?: { at: number; pct: number };
  test?: { at: number; pct: number; n: number };
  bestTest?: number;
}

export const emptyLearn = (): LearnStat => ({ guided: [0, 0], recall: [0, 0], apply: [0, 0], level: 1, run: 0 });

/** Has the learner been taught (or demonstrated) this concept? Drives first-exposure teaching. */
export const isTaught = (l: LearnStat | undefined) => !!(l && (l.exposed || l.lesson || l.testedOut));

/** Scaffold level a question exercises (2 = recognition; levels 1 and 2 share items, level 1 adds hints). */
export function questionLevel(q: Pick<Question, "type" | "difficulty" | "cognitive" | "format">): Level {
  // discrimination between look-alikes counts as exam-style only once it's past easy recognition
  if (q.difficulty === 3 || q.cognitive === "analyze" || q.cognitive === "evaluate" || ((q.format === "contrast" || q.format === "question-order") && q.difficulty >= 2)) return 6;
  if (q.cognitive === "apply" && ["case", "first-action", "nursing-action", "lab-interpretation"].includes(q.format)) return 5;
  if (q.cognitive === "apply") return 4;
  if (q.type === "fill" || q.type === "match" || q.type === "order" || q.type === "sata" || q.difficulty === 2) return 3;
  return 2;
}

/** Activities are clinical/visual: simulations & charts are scenarios (5); the rest reinforce at level 4. */
export const activityLevel = (a: Pick<Activity, "kind">): Level => (["sim", "room", "chart", "monitor", "priority"].includes(a.kind) ? 5 : 4);

/** Which item levels suit a learner at level L (best first). */
export function bandFor(level: Level): Level[] {
  switch (level) {
    case 1:
    case 2:
      return [2, 3];
    case 3:
      return [3, 2, 4];
    case 4:
      return [4, 3, 5];
    case 5:
      return [5, 4, 6];
    case 6:
      return [6, 5, 4];
  }
}

/** Guided = hints available + a wrong answer teaches instead of counting against the learner. */
export const isGuidedLevel = (level: Level) => level <= 2;

export interface LearnEvent {
  qLevel: Level;
  /** correct on the first try, without a hint */
  firstTry: boolean;
  /** a hint was shown or a retry was needed */
  assisted: boolean;
  /** item was served in guided (hinted) form */
  guided: boolean;
  now: number;
}

export function updateLearn(prev: LearnStat | undefined, ev: LearnEvent): LearnStat {
  const l: LearnStat = { ...emptyLearn(), ...prev };
  l.guided = [...l.guided];
  l.recall = [...l.recall];
  l.apply = [...l.apply];
  // answering anything means the concept has at least been met
  l.exposed ??= ev.now;
  const ok = ev.firstTry && !ev.assisted;
  if (ev.guided) {
    l.guided[0] += 1;
    if (ok) l.guided[1] += 1;
  } else if (ev.qLevel <= 3) {
    l.recall[0] += 1;
    if (ok) l.recall[1] += 1;
  } else {
    l.apply[0] += 1;
    if (ok) l.apply[1] += 1;
  }
  // Scaffolding: two first-try wins at (or above) the current level → step up; two misses → step down.
  if (ok) {
    // only items near the learner's level count toward stepping up (easy wins at level 5 don't)
    if (ev.qLevel >= l.level - 1) l.run = Math.max(0, l.run) + 1;
    if (l.run >= 2) {
      l.level = Math.min(6, l.level + 1) as Level;
      l.run = 0;
    }
  } else {
    l.run = Math.min(0, l.run) - 1;
    if (l.run <= -2) {
      l.level = Math.max(1, l.level - 1) as Level;
      l.run = 0;
    }
  }
  return l;
}

/** Marks concepts as taught. A finished lesson starts guided practice at level 1. */
export function teach(prev: LearnStat | undefined, how: "exposed" | "lesson" | "relearn", now: number): LearnStat {
  const l: LearnStat = { ...emptyLearn(), ...prev };
  l.exposed ??= now;
  if (how === "lesson") l.lesson = now;
  if (how === "relearn") {
    l.relearned = now;
    // relearning restarts the scaffold low so the next questions are supported
    l.level = Math.min(l.level, 2) as Level;
    l.run = 0;
  }
  return l;
}

/** Demonstrated in a diagnostic: skip introductory teaching and move to application. */
export function testOut(prev: LearnStat | undefined, now: number): LearnStat {
  const l: LearnStat = { ...emptyLearn(), ...prev };
  l.testedOut = now;
  l.level = Math.max(l.level, 4) as Level;
  l.run = 0;
  return l;
}

const pct = ([n, ok]: [number, number]) => (n ? Math.round((ok / n) * 100) : null);

export interface KnowledgeState {
  exposure: boolean;
  lessonComplete: boolean;
  testedOut: boolean;
  guided: number | null;
  recall: number | null;
  application: number | null;
  level: Level;
  mastery: number;
  masteryLabel: MasteryState;
}

export function knowledgeState(l: LearnStat | undefined, s: ConceptStat | undefined, now: number): KnowledgeState {
  return {
    exposure: isTaught(l),
    lessonComplete: !!l?.lesson,
    testedOut: !!l?.testedOut,
    guided: l ? pct(l.guided) : null,
    recall: l ? pct(l.recall) : null,
    application: l ? pct(l.apply) : null,
    level: l?.level ?? 1,
    mastery: effectiveMastery(s, now),
    masteryLabel: masteryState(s, now),
  };
}

// ───────────────────────── Stage status (Learn ✓ · Practice 72% · Test Ready) ─────────────────────────

export type TestState = "locked" | "ready" | "passed" | "mastered";

export interface StageStatus {
  /** share of concepts taught (0–100) */
  learn: number;
  learnDone: boolean;
  /** scaffold progress: level 1 → 0%, level 5+ → 100% (averaged over concepts) */
  practice: number;
  test: TestState;
  lastTest?: number;
}

export function stageStatus(concepts: string[], learn: Record<string, LearnStat>, stats: Record<string, ConceptStat>, unit: UnitStat | undefined, now: number): StageStatus {
  if (!concepts.length) return { learn: 0, learnDone: false, practice: 0, test: "locked" };
  const taught = concepts.filter((c) => isTaught(learn[c])).length;
  const learnPct = Math.round((taught / concepts.length) * 100);
  const practice = Math.round(
    (concepts.reduce((a, c) => {
      const l = learn[c];
      if (!isTaught(l)) return a;
      const levelPart = Math.min(1, ((l!.level ?? 1) - 1) / 4);
      // strong mastery from earlier practice also counts
      const m = Math.min(1, effectiveMastery(stats[c], now) / 80);
      return a + Math.max(levelPart, m);
    }, 0) /
      concepts.length) *
      100,
  );
  const lastTest = unit?.test?.pct;
  const allMastered = concepts.every((c) => effectiveMastery(stats[c], now) >= 80);
  let test: TestState = "locked";
  if (learnPct === 100) test = "ready";
  if (lastTest !== undefined && lastTest >= 80) test = "passed";
  if (test === "passed" && allMastered) test = "mastered";
  return { learn: learnPct, learnDone: learnPct === 100, practice, test, lastTest };
}

export const TEST_LABEL: Record<TestState, string> = { locked: "Locked", ready: "Ready", passed: "Passed", mastered: "Mastered" };

/** Repeated misses on a concept → recommend RELEARN before more questions. */
export function needsRelearn(conceptId: string, openMistakesByConcept: Record<string, number>, mistakeMisses: number, s: ConceptStat | undefined): boolean {
  if ((openMistakesByConcept[conceptId] ?? 0) >= 2) return true;
  if (mistakeMisses >= 2) return true;
  const recent = s?.recent.slice(-3) ?? [];
  return recent.length >= 3 && recent.filter((x) => !x).length >= 2;
}

/**
 * Upgrade path for learners who used the app before Learn mode existed: concepts they have clearly
 * demonstrated (≥ 2 correct and mastery ≥ 30) count as taught, so they are not sent back to lessons.
 * Concepts they only guessed at stay "not taught" — they get the lesson first, which is the point.
 */
export function migrateLearnFromHistory(stats: Record<string, ConceptStat>, now: number): Record<string, LearnStat> {
  const out: Record<string, LearnStat> = {};
  for (const [id, s] of Object.entries(stats)) {
    if (s.correct >= 2 && s.m >= 30) {
      out[id] = { ...emptyLearn(), exposed: s.last || now, testedOut: now, level: (s.applied >= 1 ? 4 : 3) as Level };
    }
  }
  return out;
}
