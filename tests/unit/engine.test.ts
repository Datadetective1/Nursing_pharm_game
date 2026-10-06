import { describe, expect, it } from "vitest";
import { effectiveMastery, emptyStat, updateConcept, masteryState, type ConceptStat, INTERVALS_MIN } from "@/lib/engine/mastery";
import { isCorrect, normalize } from "@/lib/engine/grade";
import { readiness, touchStreak, displayStreak, levelFromXp, xpForAnswer } from "@/lib/engine/progress";
import { bucketOf, pickConcept, type Bucket } from "@/lib/engine/select";
import { buildExam, EXAM_TYPES } from "@/lib/engine/exam";
import { buildSession, newRuntime, nextForSession, type Mode } from "@/lib/engine/session";
import { CONCEPTS, TOPICS } from "@/data/curriculum";
import { mulberry32 } from "@/lib/rng";
import type { FillQuestion, MCQQuestion, SATAQuestion } from "@/lib/types";

const T0 = 1_700_000_000_000;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function answer(s: ConceptStat | undefined, opts: Partial<Parameters<typeof updateConcept>[1]> = {}) {
  return updateConcept(s, { correct: true, difficulty: 1, cognitive: "remember", ms: 8000, sessionId: "s1", now: T0, ...opts });
}

describe("mastery engine", () => {
  it("recall-only success is capped at 55 (needs application-level wins)", () => {
    let s: ConceptStat | undefined;
    for (let i = 0; i < 30; i++) s = answer(s, { sessionId: `s${i}`, now: T0 + i * DAY });
    expect(s!.m).toBeLessThanOrEqual(55);
    expect(masteryState(s, T0 + 30 * DAY)).not.toBe("mastered");
  });

  it("application success in a single session cannot reach Mastered (needs ≥2 sessions)", () => {
    let s: ConceptStat | undefined;
    for (let i = 0; i < 20; i++) s = answer(s, { difficulty: 3, cognitive: "apply" });
    expect(s!.m).toBeLessThanOrEqual(79);
  });

  it("repeated application success across sessions reaches Mastered", () => {
    let s: ConceptStat | undefined;
    for (let i = 0; i < 6; i++) s = answer(s, { difficulty: 3, cognitive: "apply", sessionId: `s${i}`, now: T0 + i * HOUR });
    expect(s!.m).toBeGreaterThanOrEqual(80);
    expect(masteryState(s, T0 + 6 * HOUR)).toBe("mastered");
  });

  it("a wrong answer resets the Leitner box and is due again immediately", () => {
    let s = answer(undefined, { difficulty: 2, cognitive: "apply" });
    s = answer(s, { difficulty: 2, cognitive: "apply", sessionId: "s2" });
    expect(s.box).toBe(2);
    expect(s.due).toBe(T0 + INTERVALS_MIN[2] * 60_000);
    s = answer(s, { correct: false });
    expect(s.box).toBe(0);
    expect(s.due).toBe(T0);
  });

  it("confident-but-wrong costs more than unsure-and-wrong (false confidence)", () => {
    const base: ConceptStat = { ...emptyStat(), m: 50, seen: 3, correct: 3, applied: 2, sessions: 2 };
    const confident = updateConcept(base, { correct: false, difficulty: 2, cognitive: "apply", confidence: "confident", ms: 5000, sessionId: "x", now: T0 });
    const unsure = updateConcept(base, { correct: false, difficulty: 2, cognitive: "apply", confidence: "unsure", ms: 5000, sessionId: "x", now: T0 });
    expect(confident.m).toBeLessThan(unsure.m);
    expect(confident.confWrong).toBe(1);
  });

  it("a lucky guess earns less than a confident correct answer and doesn't advance the box", () => {
    const g = answer(undefined, { confidence: "guess", difficulty: 2, cognitive: "apply" });
    const c = answer(undefined, { confidence: "confident", difficulty: 2, cognitive: "apply" });
    expect(g.m).toBeLessThan(c.m);
    expect(g.box).toBe(0);
    expect(c.box).toBe(1);
  });

  it("overdue concepts decay (but never below 75%)", () => {
    const s: ConceptStat = { ...emptyStat(), m: 80, seen: 5, box: 3, due: T0 };
    expect(effectiveMastery(s, T0)).toBe(80);
    expect(effectiveMastery(s, T0 + 2 * DAY)).toBeLessThan(80);
    expect(effectiveMastery(s, T0 + 100 * DAY)).toBe(60);
  });
});

describe("readiness", () => {
  it("cannot reach 100% from easy recall alone", () => {
    const stats: Record<string, ConceptStat> = {};
    for (const c of CONCEPTS) {
      let s: ConceptStat | undefined;
      for (let i = 0; i < 25; i++) s = answer(s, { sessionId: `s${i}`, now: T0 });
      stats[c.id] = s!;
    }
    expect(readiness(stats, T0).overall).toBeLessThanOrEqual(55);
  });

  it("is 0 with no data and weights topics by the blueprint", () => {
    expect(readiness({}, T0).overall).toBe(0);
    const stats: Record<string, ConceptStat> = {};
    for (const c of CONCEPTS.filter((c) => c.topic === "analgesics")) stats[c.id] = { ...emptyStat(), m: 100, seen: 1, due: T0 + DAY, box: 3 };
    const r = readiness(stats, T0);
    const share = TOPICS.find((t) => t.id === "analgesics")!.examCount / 50;
    expect(r.overall).toBe(Math.round(100 * share));
  });

  it("blueprint exam counts sum to 50 and sit inside each blueprint range", () => {
    expect(TOPICS.reduce((a, t) => a + t.examCount, 0)).toBe(50);
    for (const t of TOPICS) {
      expect(t.examCount).toBeGreaterThanOrEqual(t.min);
      expect(t.examCount).toBeLessThanOrEqual(t.max);
    }
  });
});

describe("selection (50/25/15/10)", () => {
  it("rolls buckets in roughly the specified proportions", () => {
    const pool = CONCEPTS.slice(0, 40);
    const stats: Record<string, ConceptStat> = {};
    pool.forEach((c, i) => {
      const kind = i % 4;
      // weak, medium, review (due), mastered
      stats[c.id] =
        kind === 0
          ? { ...emptyStat(), m: 10, seen: 2, box: 0, due: T0 }
          : kind === 1
            ? { ...emptyStat(), m: 45, seen: 3, box: 2, due: T0 + DAY }
            : kind === 2
              ? { ...emptyStat(), m: 65, seen: 4, box: 3, due: T0 - HOUR }
              : { ...emptyStat(), m: 90, seen: 6, box: 4, due: T0 + DAY };
    });
    const counts: Record<Bucket, number> = { weak: 0, medium: 0, review: 0, mastered: 0 };
    const rng = mulberry32(7);
    const N = 6000;
    for (let i = 0; i < N; i++) {
      const c = pickConcept({ pool, stats, qstats: {}, recentQ: [], recentConcepts: [], now: T0, rng })!;
      counts[bucketOf(c, stats[c.id], T0)]++;
    }
    expect(counts.weak / N).toBeCloseTo(0.5, 1);
    expect(counts.medium / N).toBeCloseTo(0.25, 1);
    expect(counts.review / N).toBeCloseTo(0.15, 1);
    expect(counts.mastered / N).toBeCloseTo(0.1, 1);
  });
});

describe("sessions", () => {
  const modes: Mode[] = ["mission", "continue", "quick5", "weak", "node", "world", "boss", "highyield"];
  for (const mode of modes) {
    it(`${mode}: serves the configured number of distinct questions`, () => {
      const cfg = buildSession({ mode, node: "heparins", world: "w7", stats: {}, mistakes: {}, exams: [], dailyMinutes: 10, now: T0 });
      expect(cfg.total).toBeGreaterThan(0);
      const rt = newRuntime();
      const ids = new Set<string>();
      for (let i = 0; i < cfg.total; i++) {
        const q = nextForSession(cfg, rt, {}, {}, [], T0, mulberry32(i + 1));
        expect(q).toBeDefined();
        rt.served.push(q!.id);
        rt.servedConcepts.push(q!.concept);
        ids.add(q!.id);
        if (cfg.types) expect(cfg.types).toContain(q!.type);
        if (mode === "node") expect(cfg.pool.map((c) => c.id)).toContain(q!.concept);
      }
      expect(ids.size).toBe(cfg.total);
    });
  }

  it("boss battles have 3 hearts, 10 questions and harder items", () => {
    const cfg = buildSession({ mode: "boss", world: "w7", stats: {}, mistakes: {}, exams: [], dailyMinutes: 10, now: T0 });
    expect(cfg.hearts).toBe(3);
    expect(cfg.total).toBe(10);
    const rt = newRuntime();
    for (let i = 0; i < 10; i++) {
      const q = nextForSession(cfg, rt, {}, {}, [], T0, mulberry32(100 + i))!;
      rt.served.push(q.id);
      expect(q.difficulty).toBeGreaterThanOrEqual(2);
    }
  });

  it("re-queues a missed concept a few questions later", () => {
    const cfg = buildSession({ mode: "world", world: "w6", stats: {}, mistakes: {}, exams: [], dailyMinutes: 10, now: T0 });
    const rt = newRuntime();
    const first = nextForSession(cfg, rt, {}, {}, [], T0, mulberry32(1))!;
    rt.served.push(first.id);
    rt.requeue.push({ concept: first.concept, at: rt.served.length + 3 });
    let found = false;
    for (let i = 0; i < 4; i++) {
      const q = nextForSession(cfg, rt, {}, {}, [], T0, mulberry32(50 + i))!;
      rt.served.push(q.id);
      if (q.concept === first.concept && q.id !== first.id) found = true;
    }
    expect(found).toBe(true);
  });

  it("vault mode replays exactly the missed questions", () => {
    const mistakes = { "an-001": { qid: "an-001", concept: "op-moa", topic: "analgesics" as const, chosen: "x", at: T0, misses: 1, resolved: false } };
    const cfg = buildSession({ mode: "vault", stats: {}, mistakes, exams: [], dailyMinutes: 10, now: T0 });
    if (cfg.total) {
      const q = nextForSession(cfg, newRuntime(), {}, {}, [], T0);
      expect(q?.id).toBe("an-001");
    }
  });
});

describe("exam builder", () => {
  it("builds 50 unique questions matching the blueprint distribution in exam formats only", () => {
    for (let seed = 1; seed <= 25; seed++) {
      const qs = buildExam(mulberry32(seed));
      expect(qs).toHaveLength(50);
      expect(new Set(qs.map((q) => q.id)).size).toBe(50);
      for (const q of qs) expect(EXAM_TYPES).toContain(q.type);
      for (const t of TOPICS) expect(qs.filter((q) => q.topic === t.id)).toHaveLength(t.examCount);
      const app = qs.filter((q) => ["apply", "analyze", "evaluate"].includes(q.cognitive)).length;
      expect(app).toBeGreaterThanOrEqual(20);
      for (const ty of EXAM_TYPES) expect(qs.some((q) => q.type === ty)).toBe(true);
    }
  });
});

describe("grading", () => {
  const fill: FillQuestion = { id: "f", type: "fill", topic: "coag", concept: "hep-antidote", drugs: ["heparin"], difficulty: 1, cognitive: "remember", format: "antidote", stem: "Antidote: ____", accept: ["protamine sulfate", "protamine"], why: "x".repeat(10), source: "s" };
  it("fill answers ignore case, spacing and punctuation", () => {
    expect(isCorrect(fill, { type: "fill", text: "  Protamine   SULFATE. " })).toBe(true);
    expect(isCorrect(fill, { type: "fill", text: "protamine" })).toBe(true);
    expect(isCorrect(fill, { type: "fill", text: "vitamin k" })).toBe(false);
    expect(isCorrect(fill, { type: "fill", text: "" })).toBe(false);
    expect(normalize("Vitamin K (phytonadione)")).toBe("vitamin k phytonadione");
  });
  it("numeric fill uses tolerance and ignores units/commas", () => {
    const n: FillQuestion = { ...fill, accept: ["1,250"], numeric: { value: 1250, tolerance: 0.05 }, unit: "units/hr" };
    expect(isCorrect(n, { type: "fill", text: "1,250" })).toBe(true);
    expect(isCorrect(n, { type: "fill", text: "1250 units/hr" })).toBe(true);
    expect(isCorrect(n, { type: "fill", text: "1251" })).toBe(false);
  });
  it("SATA requires the exact set", () => {
    const s: SATAQuestion = { ...fill, type: "sata", options: ["a", "b", "c", "d"], answers: [0, 2] } as unknown as SATAQuestion;
    expect(isCorrect(s, { type: "sata", choices: [2, 0] })).toBe(true);
    expect(isCorrect(s, { type: "sata", choices: [0] })).toBe(false);
    expect(isCorrect(s, { type: "sata", choices: [0, 1, 2] })).toBe(false);
  });
  it("MCQ / TF", () => {
    const m = { ...fill, type: "mcq", options: ["a", "b", "c", "d"], answer: 3 } as unknown as MCQQuestion;
    expect(isCorrect(m, { type: "mcq", choice: 3 })).toBe(true);
    expect(isCorrect(m, { type: "mcq", choice: 0 })).toBe(false);
  });
});

describe("gamification", () => {
  it("XP: +10 correct, +15 hard, +5 every 3-streak, 0 wrong", () => {
    expect(xpForAnswer(true, 1, 1)).toBe(10);
    expect(xpForAnswer(true, 3, 1)).toBe(15);
    expect(xpForAnswer(true, 2, 3)).toBe(15);
    expect(xpForAnswer(true, 3, 6)).toBe(20);
    expect(xpForAnswer(false, 3, 0)).toBe(0);
  });
  it("levels grow monotonically", () => {
    let prev = 1;
    for (let xp = 0; xp < 20000; xp += 37) {
      const l = levelFromXp(xp);
      expect(l.level).toBeGreaterThanOrEqual(prev);
      expect(l.into).toBeLessThan(l.needed);
      prev = l.level;
    }
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(150).level).toBe(2);
  });
  it("streak continues daily, forgives ONE missed day per week, never goes negative", () => {
    let s = { count: 0, best: 0, lastDay: null as string | null, restUsed: null as string | null };
    s = touchStreak(s, "2026-10-01").state;
    expect(s.count).toBe(1);
    s = touchStreak(s, "2026-10-02").state;
    expect(s.count).toBe(2);
    expect(touchStreak(s, "2026-10-02").event).toBe("same");
    const rest = touchStreak(s, "2026-10-04");
    expect(rest.event).toBe("rest-used");
    expect(rest.state.count).toBe(3);
    s = rest.state;
    const again = touchStreak(s, "2026-10-06"); // second gap within a week → fresh start, best kept
    expect(again.event).toBe("fresh-start");
    expect(again.state.count).toBe(1);
    expect(again.state.best).toBe(3);
    expect(displayStreak(s, "2026-10-04")).toBe(3);
    expect(displayStreak(s, "2026-10-10")).toBe(0);
  });
});
