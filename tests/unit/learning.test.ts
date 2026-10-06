import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { CONCEPTS, CONCEPT_BY_ID } from "@/data/curriculum";
import { QUESTIONS } from "@/data/bank";
import { LESSONS, LESSON_BY_UNIT, microLesson, teachingFor } from "@/data/lessons";
import { validateAllLessons } from "@/lib/lessons/validate";
import { conceptsWithoutUnit, resolveSelection, searchLibrary, UNITS, UNIT_BY_ID, DRUGS_LIB } from "@/data/library";
import { buildSession, newRuntime, nextItem, relearnConcepts, type Item, type Mode } from "@/lib/engine/session";
import { isTaught, questionLevel, stageStatus, teach, updateLearn, migrateLearnFromHistory, type LearnStat } from "@/lib/engine/learning";
import { EXAM_TYPES } from "@/lib/engine/exam";
import { migratePQ, mergePQ, type Mistake } from "@/lib/store";
import { mulberry32 } from "@/lib/rng";

const T0 = Date.UTC(2026, 9, 6, 15);
const base = { stats: {}, mistakes: {}, exams: [], dailyMinutes: 10 as const, now: T0 };

/** Runs a session the way SessionPlayer does: a finished micro-lesson marks its concept taught. */
function run(mode: Mode, extra: Partial<Parameters<typeof buildSession>[0]> = {}, n = 14, learn: Record<string, LearnStat> = {}) {
  const cfg = buildSession({ ...base, mode, learn, ...extra });
  const rt = newRuntime();
  const items: Item[] = [];
  for (let i = 0; i < n; i++) {
    const it = nextItem(cfg, rt, {}, {}, [], T0, mulberry32(i + 3), undefined, learn);
    if (!it) break;
    items.push(it);
    if (it.kind === "teach") learn = { ...learn, [it.concept]: teach(learn[it.concept], it.how, T0) };
  }
  return { cfg, items, learn };
}

const conceptOf = (it: Item) => (it.kind === "q" ? it.q.concept : it.kind === "a" ? it.a.concepts[0] : it.concept);

describe("lessons", () => {
  it("every library unit has a valid micro-lesson (sources, ids, one idea per screen)", () => {
    expect(validateAllLessons(LESSONS)).toEqual([]);
  });
  it("every concept in the curriculum can be taught before it is tested", () => {
    const missing = CONCEPTS.filter((c) => !teachingFor(c.id)).map((c) => c.id);
    expect(missing).toEqual([]);
  });
  it("micro-lessons stay short (≤ 3 screens)", () => {
    for (const c of CONCEPTS) expect(microLesson(c.id)!.steps.length).toBeLessThanOrEqual(3);
  });
});

describe("drug library", () => {
  it("every concept lives in at least one study unit", () => {
    expect(conceptsWithoutUnit()).toEqual([]);
  });
  it("units and drugs reference real concepts and units", () => {
    for (const u of UNITS) for (const c of u.concepts) expect(CONCEPT_BY_ID[c], `${u.id}:${c}`).toBeDefined();
    for (const d of DRUGS_LIB) {
      expect(UNIT_BY_ID[d.unit], d.id).toBeDefined();
      for (const c of d.concepts ?? []) expect(UNIT_BY_ID[d.unit].concepts, `${d.id}:${c}`).toContain(c);
    }
  });
  it("search: 'heparin' finds Heparin (Module 7) first; 'ACE' finds the ACE inhibitor class", () => {
    const h = searchLibrary("heparin")[0];
    expect(h.title).toBe("Heparin");
    expect(h.module).toBe("w7");
    expect(searchLibrary("ACE")[0].id).toBe("u-acei");
    expect(searchLibrary("-pril")[0].id).toBe("u-acei");
    expect(searchLibrary("lasix")[0].title).toBe("Furosemide");
  });
});

describe("knowledge state + scaffolding", () => {
  it("viewing a lesson is exposure, never mastery", () => {
    const l = teach(undefined, "lesson", T0);
    expect(isTaught(l)).toBe(true);
    expect(l.level).toBe(1);
    expect(l.guided).toEqual([0, 0]);
  });
  it("two clean wins step the level up; two misses step it down", () => {
    let l = teach(undefined, "lesson", T0);
    l = updateLearn(l, { qLevel: 2, firstTry: true, assisted: false, guided: true, now: T0 });
    l = updateLearn(l, { qLevel: 2, firstTry: true, assisted: false, guided: true, now: T0 });
    expect(l.level).toBe(2);
    l = updateLearn(l, { qLevel: 3, firstTry: false, assisted: true, guided: false, now: T0 });
    l = updateLearn(l, { qLevel: 3, firstTry: false, assisted: true, guided: false, now: T0 });
    expect(l.level).toBe(1);
  });
  it("question levels cover all six scaffold rungs across the bank", () => {
    const levels = new Set(QUESTIONS.map(questionLevel));
    for (const lv of [2, 3, 4, 5, 6]) expect(levels.has(lv as never)).toBe(true);
  });
  it("every non-calc concept has ≥ 2 recognition items for guided practice", () => {
    const thin = CONCEPTS.filter((c) => c.topic !== "calc" && QUESTIONS.filter((q) => q.concept === c.id && questionLevel(q) === 2).length < 2).map((c) => c.id);
    // meperidine is intentionally light (Memory Aid-only facts)
    expect(thin.filter((c) => c !== "op-meperidine")).toEqual([]);
  });
  it("stage status: Learn ✓ only after teaching; Test passes at 80%", () => {
    const concepts = UNIT_BY_ID["u-loop"].concepts;
    const none = stageStatus(concepts, {}, {}, undefined, T0);
    expect(none.learnDone).toBe(false);
    expect(none.test).toBe("locked");
    const learn = Object.fromEntries(concepts.map((c) => [c, teach(undefined, "lesson", T0)]));
    const s = stageStatus(concepts, learn, {}, { test: { at: T0, pct: 85, n: 10 } }, T0);
    expect(s.learnDone).toBe(true);
    expect(s.test).toBe("passed");
  });
});

describe("ACCEPTANCE (engine level)", () => {
  it("TEST A — Module 6 › Diuretics › Loop Diuretics › Learn teaches before any question", () => {
    const sel = { kind: "unit" as const, id: "u-loop" };
    expect(resolveSelection(sel).title).toBe("Loop Diuretics");
    const lesson = LESSON_BY_UNIT["u-loop"];
    expect(lesson).toBeDefined();
    // the lesson opens with teaching screens; any "check" comes after something was taught
    const firstCheck = lesson.steps.findIndex((s) => s.kind === "check");
    expect(lesson.steps[0].kind).not.toBe("check");
    if (firstCheck >= 0) expect(firstCheck).toBeGreaterThan(1);
    // and Practice for a brand-new learner also teaches first
    const { items } = run("practice", { sel });
    expect(items[0].kind).toBe("teach");
  });

  it("TEST B — Continue Quest teaches an unseen concept before independently testing it", () => {
    const { items } = run("continue", {}, 12);
    expect(items[0].kind).toBe("teach");
    const taught = new Set<string>();
    for (const it of items) {
      if (it.kind === "teach") taught.add(it.concept);
      else expect(taught.has(conceptOf(it)), `asked ${conceptOf(it)} before teaching it`).toBe(true);
    }
    // the first question after a lesson is a guided (hinted, no-penalty) recognition item
    const firstQ = items.find((i) => i.kind === "q");
    expect(firstQ && firstQ.kind === "q" && firstQ.guided).toBe(true);
  });

  for (const mode of ["mission", "quick5", "node", "world", "weak", "highyield"] as Mode[]) {
    it(`TEST B (${mode}) — no cold questions on untaught concepts`, () => {
      const { items } = run(mode, { node: "heparins", world: "w7" }, 16);
      const taught = new Set<string>();
      for (const it of items) {
        if (it.kind === "teach") taught.add(it.concept);
        else expect(taught.has(conceptOf(it)), `${mode}: ${conceptOf(it)}`).toBe(true);
      }
    });
  }

  it("TEST C — Module 7 › Anticoagulants › Heparin › Practice stays on heparin", () => {
    const sel = { kind: "unit" as const, id: "u-heparin" };
    const allowed = new Set(UNIT_BY_ID["u-heparin"].concepts);
    const { items } = run("practice", { sel, minutes: 20 }, 30);
    expect(items.length).toBeGreaterThan(10);
    for (const it of items) {
      if (it.kind === "a") expect(allowed.has(it.a.concepts[0]), it.a.id).toBe(true);
      else expect(allowed.has(conceptOf(it)), conceptOf(it)).toBe(true);
    }
    const qs = items.filter((i): i is Extract<Item, { kind: "q" }> => i.kind === "q");
    const aboutHeparin = qs.filter((i) => i.q.drugs.some((d) => d === "heparin" || d === "protamine"));
    expect(aboutHeparin.length / qs.length).toBeGreaterThanOrEqual(0.75);
  });

  it("TEST C' — the single drug 'Heparin' from the library resolves to the same unit", () => {
    const r = resolveSelection({ kind: "drug", id: "d-heparin" });
    expect(r.units).toEqual(["u-heparin"]);
    expect(r.drugIds).toContain("heparin");
  });

  it("TEST D — Module 8 › Anticonvulsants › Test is an independent exam-style assessment", () => {
    const sel = { kind: "group" as const, id: "g-anticonv" };
    const allowed = new Set(resolveSelection(sel).concepts);
    const { cfg, items } = run("test", { sel, minutes: 10 }, 20);
    expect(cfg.total).toBeGreaterThanOrEqual(8);
    expect(items.length).toBe(cfg.total);
    for (const it of items) {
      expect(it.kind).toBe("q"); // no teaching, no activities
      if (it.kind !== "q") continue;
      expect(it.guided).toBeFalsy(); // no hints
      expect(EXAM_TYPES).toContain(it.q.type);
      expect(allowed.has(it.q.concept)).toBe(true);
    }
    expect(new Set(items.map(conceptOf)).size).toBeGreaterThanOrEqual(6);
    // formats rotate like the real exam
    expect(new Set(items.map((i) => (i.kind === "q" ? i.q.type : ""))).size).toBeGreaterThanOrEqual(3);
  });

  it("TEST E — repeated misses on a concept recommend RELEARN", () => {
    const q = QUESTIONS.find((x) => x.concept === "war-teach")!;
    const mistakes: Record<string, Mistake> = { [q.id]: { qid: q.id, concept: q.concept, topic: q.topic, chosen: "x", at: T0, misses: 2, resolved: false } };
    expect(relearnConcepts({}, mistakes)).toContain("war-teach");
    // and Weak Spots opens with the relearn micro-lesson instead of another question
    const stats = { "war-teach": { m: 8, box: 0, due: T0, last: T0, seen: 3, correct: 0, wrong: 3, streak: 0, applied: 0, confWrong: 0, guessRight: 0, sessions: 0, recent: [false, false, false] } };
    const { items } = run("weak", { mistakes, stats }, 3, Object.fromEntries(CONCEPTS.map((c) => [c.id, teach(undefined, "lesson", T0)])));
    expect(items[0].kind).toBe("teach");
    expect(items[0].kind === "teach" && items[0].how).toBe("relearn");
  });

  it("TEST F — upgrading an existing v1 learner keeps every field", () => {
    const raw = JSON.parse(readFileSync(path.resolve("tests/fixtures/v1-existing-user.json"), "utf8"));
    const v1 = raw.state;
    const v2 = mergePQ(migratePQ(v1, raw.version, T0));
    expect(v2.xp).toBe(1840);
    expect(v2.streak).toEqual(v1.streak);
    expect(v2.concepts).toEqual(v1.concepts);
    expect(v2.mistakes).toEqual(v1.mistakes);
    expect(v2.log).toEqual(v1.log);
    expect(v2.days).toEqual(v1.days);
    expect(v2.qstats).toEqual(v1.qstats);
    expect(v2.profile.examDate).toBe("2026-10-15");
    expect(v2.achievements).toEqual(v1.achievements);
    expect(v2.bosses).toEqual(v1.bosses);
    expect(v2.exams).toEqual(v1.exams);
    expect(v2.counters).toEqual(v1.counters);
    expect(v2.calib).toEqual(v1.calib);
    // demonstrated concepts count as taught; guessed ones still get the lesson first
    expect(isTaught(v2.learn["op-hold"])).toBe(true);
    expect(isTaught(v2.learn["war-antidote"])).toBe(false);
    // migrating twice is a no-op
    expect(mergePQ(migratePQ(v2, 2, T0 + 1))).toEqual(v2);
  });

  it("migration only credits clearly demonstrated concepts", () => {
    const learn = migrateLearnFromHistory({ a: { m: 40, box: 1, due: 0, last: 1, seen: 3, correct: 2, wrong: 1, streak: 1, applied: 1, confWrong: 0, guessRight: 0, sessions: 2, recent: [] }, b: { m: 10, box: 0, due: 0, last: 1, seen: 2, correct: 0, wrong: 2, streak: 0, applied: 0, confWrong: 0, guessRight: 0, sessions: 0, recent: [] } }, T0);
    expect(learn.a?.testedOut).toBe(T0);
    expect(learn.b).toBeUndefined();
  });

  it("Exam Simulator and Boss battles never teach first", () => {
    const { items } = run("boss", { world: "w8" }, 10);
    expect(items.every((i) => i.kind === "q")).toBe(true);
  });
});
