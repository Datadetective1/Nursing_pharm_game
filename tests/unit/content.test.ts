import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { QUESTIONS, CARDS, antidoteQuestion, contrastQuestion, getQuestion } from "@/data/bank";
import { CONCEPTS, NODES, TOPICS } from "@/data/curriculum";
import { validateCards, validateQuestions } from "@/lib/validate";
import { ANTIDOTES } from "@/data/antidotes";
import { CONTRASTS } from "@/data/contrasts";
import { LAB_LOCKS } from "@/data/labs";
import { RAPID } from "@/data/rapid";
import { correctAnswerText } from "@/lib/engine/grade";
import { mulberry32 } from "@/lib/rng";
import type { Question } from "@/lib/types";

/** every numeric range ("60–80", "2.5-3.5") that appears in the course files (extracted to a fixture so the
 *  instructor's raw files don't need to be published; regenerate from docs/source if the sources change) */
const RANGE_RE = /(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)/g;
const norm = (a: string, b: string) => `${Number(a)}-${Number(b)}`;
const SOURCE_RANGES = new Set<string>(JSON.parse(readFileSync(path.resolve("tests/fixtures/source-ranges.json"), "utf8")));

const correctText = (q: Question) => `${correctAnswerText(q)} ${q.why}`;

describe("question bank structure", () => {
  it("passes the structural validator (ids, concepts, options, answers)", () => {
    expect(validateQuestions(QUESTIONS)).toEqual([]);
  });

  it("has a large bank", () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(500);
  });

  it("every non-calc concept has ≥3 questions incl. ≥1 application-level item", () => {
    const problems: string[] = [];
    for (const c of CONCEPTS.filter((c) => c.topic !== "calc")) {
      const qs = QUESTIONS.filter((q) => q.concept === c.id);
      const app = qs.filter((q) => ["apply", "analyze", "evaluate"].includes(q.cognitive));
      if (qs.length < 3 || app.length < 1) problems.push(`${c.id}: ${qs.length} q / ${app.length} app`);
    }
    expect(problems).toEqual([]);
  });

  it("every topic can fill several distinct simulated exams and leans toward application", () => {
    for (const t of TOPICS.filter((t) => t.id !== "calc")) {
      const qs = QUESTIONS.filter((q) => q.topic === t.id);
      expect(qs.filter((q) => ["mcq", "sata", "fill", "tf"].includes(q.type)).length).toBeGreaterThanOrEqual(t.examCount * 5);
      const app = qs.filter((q) => ["apply", "analyze", "evaluate"].includes(q.cognitive)).length;
      expect(app / qs.length).toBeGreaterThanOrEqual(0.45);
    }
  });

  it("MCQs have exactly 4 options; SATA have 2+ correct and at least one distractor", () => {
    const bad: string[] = [];
    for (const q of QUESTIONS) {
      if (q.type === "mcq" && q.options.length !== 4) bad.push(`${q.id} has ${q.options.length} options`);
      if (q.type === "sata" && (q.answers.length < 2 || q.answers.length >= q.options.length)) bad.push(`${q.id} sata answers ${q.answers.length}/${q.options.length}`);
    }
    expect(bad).toEqual([]);
  });

  it("covers every blueprint question format", () => {
    for (const ty of ["mcq", "sata", "fill", "tf", "match", "order"]) expect(QUESTIONS.some((q) => q.type === ty)).toBe(true);
    for (const f of ["antidote", "lab", "lab-interpretation", "first-action", "question-order", "teaching", "case", "class-id", "contrast", "why"]) expect(QUESTIONS.some((q) => q.format === f), f).toBe(true);
  });

  it("every question cites a source and drug cards validate", () => {
    for (const q of QUESTIONS) expect(q.source.length).toBeGreaterThan(3);
    expect(validateCards(CARDS)).toEqual([]);
    for (const n of NODES.filter((n) => n.id !== "calc")) expect(CARDS.some((c) => c.node === n.id), `cards for ${n.id}`).toBe(true);
  });
});

describe("content accuracy guards", () => {
  it("every numeric range stated in a correct answer or explanation exists in the course files", () => {
    const bad: string[] = [];
    for (const q of QUESTIONS) {
      for (const m of correctText(q).matchAll(RANGE_RE)) {
        const r = norm(m[1], m[2]);
        // ignore things that are clearly not ranges (e.g., "2-nurse", dates) by requiring both sides numeric and a < b
        if (Number(m[1]) >= Number(m[2])) continue;
        // computed percentages (e.g. "a 16–30% drop") are arithmetic, not clinical ranges
        if (correctText(q).slice((m.index ?? 0) + m[0].length).startsWith("%")) continue;
        if (!SOURCE_RANGES.has(r)) bad.push(`${q.id}: "${m[0]}"`);
      }
    }
    expect(bad).toEqual([]);
  });

  const ANTIDOTE_OF: Record<string, RegExp> = {
    heparin: /protamine/i,
    enoxaparin: /protamine/i,
    warfarin: /vitamin k|phytonadione/i,
    dabigatran: /idarucizumab/i,
    rivaroxaban: /andexanet/i,
    alteplase: /aminocaproic/i,
    digoxin: /digoxin immune fab/i,
    acetaminophen: /acetylcysteine/i,
    morphine: /naloxone/i,
    hydromorphone: /naloxone/i,
    fentanyl: /naloxone/i,
    opioids: /naloxone/i,
    benzodiazepines: /flumazenil/i,
  };
  const ALL_ANTIDOTES = /protamine|vitamin k|phytonadione|idarucizumab|andexanet|aminocaproic|digoxin immune fab|acetylcysteine|naloxone|flumazenil/gi;

  it("single-drug antidote questions name that drug's course antidote as the answer", () => {
    const bad: string[] = [];
    for (const q of QUESTIONS.filter((q) => q.format === "antidote" && (q.type === "mcq" || q.type === "fill"))) {
      const drugs = q.drugs.filter((d) => ANTIDOTE_OF[d]);
      if (drugs.length !== 1) continue;
      const ans = correctAnswerText(q);
      const named = ans.match(ALL_ANTIDOTES);
      if (!named) continue; // answer isn't an antidote name (e.g. "give slowly")
      if (!ANTIDOTE_OF[drugs[0]].test(ans)) bad.push(`${q.id} (${drugs[0]}): ${ans}`);
    }
    expect(bad).toEqual([]);
  });

  it("never pairs an anticoagulant with the wrong antidote in a correct statement", () => {
    const WRONG: [RegExp, RegExp][] = [
      [/\bwarfarin\b/i, /protamine/i],
      [/\bheparin\b(?!-)/i, /vitamin k/i],
      [/\bdabigatran\b/i, /andexanet|protamine|vitamin k/i],
      [/\brivaroxaban\b/i, /idarucizumab|protamine/i],
      [/\balteplase\b/i, /protamine|vitamin k|idarucizumab/i],
    ];
    const bad: string[] = [];
    for (const q of QUESTIONS) {
      // only single-drug statements we can judge: TF items that are TRUE
      if (q.type !== "tf" || !q.answer) continue;
      const mentioned = WRONG.filter(([d]) => d.test(q.stem));
      if (mentioned.length !== 1) continue;
      const [, wrongAntidote] = mentioned[0];
      if (/antidote|reverse/i.test(q.stem) && wrongAntidote.test(q.stem)) bad.push(`${q.id}: ${q.stem}`);
    }
    expect(bad).toEqual([]);
  });

  it("argatroban is never given an antidote (sources ambiguous)", () => {
    for (const q of QUESTIONS) {
      if (/argatroban/i.test(q.stem) && /antidote/i.test(q.stem) && !/dabigatran/i.test(q.stem)) {
        expect(correctAnswerText(q), q.id).not.toMatch(/idarucizumab|andexanet/i);
      }
    }
  });

  it("digoxin levels between 1.5 and 2.0 are never used without stating the range", () => {
    for (const q of QUESTIONS.filter((q) => q.drugs.includes("digoxin"))) {
      for (const m of q.stem.matchAll(/(\d\.\d+)\s*ng\/mL/g)) {
        const v = Number(m[1]);
        if (v > 1.5 && v < 2.0) expect(q.stem, q.id).toMatch(/0\.5\s*[–-]\s*(1\.5|2\.0)/);
      }
    }
  });
});

describe("mini-game data", () => {
  it("antidote arena items are internally consistent", () => {
    for (const a of ANTIDOTES) {
      const q = antidoteQuestion(a.id)!;
      expect(q.options[q.answer]).toBe(a.antidote);
      expect(new Set(q.options).size).toBe(4);
      expect(getQuestion(q.id)).toEqual(q);
    }
  });

  it("contrast sets: every row has a cell per column and every quiz answer is a column", () => {
    for (const c of CONTRASTS) {
      for (const r of c.rows) expect(r.cells.length, `${c.id}/${r.label}`).toBe(c.columns.length);
      c.quiz.forEach((item, i) => {
        expect(item.answer).toBeLessThan(c.columns.length);
        expect(contrastQuestion(c.id, i)?.options[item.answer]).toBe(c.columns[item.answer]);
      });
      expect(CONCEPTS.some((x) => x.id === c.concept)).toBe(true);
    }
  });

  it("lab locks generate valid steps with unique options", () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 400; i++) {
      const lock = LAB_LOCKS[i % LAB_LOCKS.length](rng);
      expect(CONCEPTS.some((c) => c.id === lock.concept && c.topic === lock.topic), lock.id).toBe(true);
      expect(lock.steps.length).toBeGreaterThanOrEqual(3);
      for (const s of lock.steps) {
        expect(s.options.length).toBeGreaterThanOrEqual(3);
        expect(new Set(s.options).size, `${lock.id}: ${s.prompt}`).toBe(s.options.length);
        expect(s.answer).toBe(0);
      }
    }
  });

  it("rapid review cards point at real concepts", () => {
    for (const r of RAPID) expect(CONCEPTS.some((c) => c.id === r.concept && c.topic === r.topic), r.id).toBe(true);
  });
});
