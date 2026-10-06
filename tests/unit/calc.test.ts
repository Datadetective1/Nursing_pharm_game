import { describe, expect, it } from "vitest";
import { CALC_KINDS, generateCalc, SAFE_OPTIONS, type CalcKind } from "@/data/calc";
import { isCorrect } from "@/lib/engine/grade";
import type { FillQuestion, MCQQuestion, Question } from "@/lib/types";

const SEEDS = Array.from({ length: 400 }, (_, i) => i * 7919 + 13);
const num = (s: string) => Number(s.replace(/,/g, ""));

/** Independent re-computation of each problem from its stem text (does not reuse generator internals). */
function solve(q: Question): number {
  const s = q.stem;
  let m: RegExpMatchArray | null;
  switch (q.concept as CalcKind) {
    case "calc-2step":
      if ((m = s.match(/medication ([\d.,]+) g PO\. Available: ([\d.,]+) mg tablets/))) return (num(m[1]) * 1000) / num(m[2]);
      if ((m = s.match(/medication ([\d.,]+) mcg PO\. Available: ([\d.,]+) mg tablets/))) return num(m[1]) / 1000 / num(m[2]);
      if ((m = s.match(/Order: ([\d.,]+) g of an oral suspension\. Available: ([\d.,]+) mg per ([\d.,]+) mL/))) return ((num(m[1]) * 1000) / num(m[2])) * num(m[3]);
      if ((m = s.match(/Order: ([\d.,]+) mg IV of a medication\. Available: ([\d.,]+) mcg\/mL/))) return (num(m[1]) * 1000) / num(m[2]);
      break;
    case "calc-3step":
      if ((m = s.match(/weighs ([\d.,]+) lb\. The order is ([\d.,]+) mg\/kg IV once\. The vial contains ([\d.,]+) mg\/mL/))) return ((num(m[1]) / 2.2) * num(m[2])) / num(m[3]);
      break;
    case "calc-mgkg":
      if ((m = s.match(/weighs ([\d.,]+) lb\. The order is ([\d.,]+) mg\/kg\/day PO divided every (\d+) hours\. Available: ([\d.,]+) mg\/([\d.,]+) mL/))) {
        const kg = num(m[1]) / 2.2;
        const perDose = (kg * num(m[2])) / (24 / num(m[3]));
        return (perDose / num(m[4])) * num(m[5]);
      }
      break;
    case "calc-safe":
      if ((m = s.match(/weighs ([\d.,]+) lb\. The safe range for a medication is (\d+)–(\d+) mg\/kg\/day\. The order is ([\d.,]+) mg PO every (\d+) hours/))) {
        const kg = num(m[1]) / 2.2;
        const lo = kg * num(m[2]);
        const hi = kg * num(m[3]);
        if (s.includes("MAXIMUM safe daily dose")) return hi;
        const daily = num(m[4]) * (24 / num(m[5]));
        return daily > hi + 1e-9 ? 1 : daily < lo - 1e-9 ? 2 : 0;
      }
      break;
    case "calc-mlhr":
      if ((m = s.match(/Infuse ([\d.,]+) mL of IV fluid over (\d+) hours/))) return num(m[1]) / num(m[2]);
      if ((m = s.match(/medication of ([\d.,]+) mL is to infuse over (\d+) minutes/))) return num(m[1]) / (num(m[2]) / 60);
      break;
    case "calc-unitshr":
      if ((m = s.match(/prescribed at ([\d.,]+) (units|mg)\/hr\. The bag contains ([\d.,]+) \2 in ([\d.,]+) mL/))) return num(m[1]) / (num(m[3]) / num(m[4]));
      if ((m = s.match(/bag containing ([\d.,]+) (units|mg) in ([\d.,]+) mL is infusing at ([\d.,]+) mL\/hr/))) return num(m[4]) * (num(m[1]) / num(m[3]));
      break;
    case "calc-gtts":
      if ((m = s.match(/Infuse ([\d.,]+) mL over (\d+) hours by gravity\. The tubing drop factor is (\d+)/))) return Math.round(((num(m[1]) / num(m[2])) * num(m[3])) / 60);
      if ((m = s.match(/ordered at ([\d.,]+) mL\/hr by gravity\. The drop factor is (\d+)/))) return Math.round((num(m[1]) * num(m[2])) / 60);
      break;
  }
  throw new Error(`Unparsed stem for ${q.concept}: ${s}`);
}

describe("dosage calculation generators", () => {
  for (const k of CALC_KINDS) {
    it(`${k.id}: answers match an independent recomputation for ${SEEDS.length} seeds`, () => {
      for (const seed of SEEDS) {
        const q = generateCalc(k.id, seed);
        expect(q.concept).toBe(k.id);
        expect(q.topic).toBe("calc");
        expect(q.steps?.length).toBeGreaterThan(0);
        const expected = solve(q);
        if (q.type === "mcq") {
          expect(q.options).toEqual(SAFE_OPTIONS);
          expect(q.answer).toBe(expected);
          expect(isCorrect(q, { type: "mcq", choice: expected })).toBe(true);
        } else {
          const f = q as FillQuestion;
          expect(f.numeric).toBeDefined();
          expect(Math.abs(f.numeric!.value - expected)).toBeLessThan(1e-6);
          expect(Number.isFinite(f.numeric!.value)).toBe(true);
          expect(f.numeric!.value).toBeGreaterThan(0);
          // grading accepts the canonical answer and rejects a clearly wrong one
          expect(isCorrect(f, { type: "fill", text: f.accept[0] })).toBe(true);
          expect(isCorrect(f, { type: "fill", text: String(f.numeric!.value * 2 + 1) })).toBe(false);
          // stem shows the blank + unit
          expect(f.stem.endsWith(`____ ${f.unit}`)).toBe(true);
        }
      }
    });
  }

  it("drops/min answers are whole numbers and never an ambiguous .5 rounding", () => {
    for (const seed of SEEDS) {
      const q = generateCalc("calc-gtts", seed) as FillQuestion;
      expect(Number.isInteger(q.numeric!.value)).toBe(true);
      const m = q.stem.match(/([\d.,]+) mL\/hr by gravity\. The drop factor is (\d+)/);
      if (m) expect(((num(m[1]) * num(m[2])) / 60) % 1).not.toBeCloseTo(0.5, 9);
    }
  });

  it("weights in lb convert to whole kg and tablets are whole", () => {
    for (const seed of SEEDS) {
      for (const kind of ["calc-3step", "calc-mgkg", "calc-safe"] as CalcKind[]) {
        const q = generateCalc(kind, seed);
        const m = q.stem.match(/weighs ([\d.,]+) lb/);
        expect(m).not.toBeNull();
        const kg = num(m![1]) / 2.2;
        expect(Math.abs(kg - Math.round(kg))).toBeLessThan(1e-9);
      }
      const t = generateCalc("calc-2step", seed) as FillQuestion;
      if (t.unit === "tablets") expect(Number.isInteger(t.numeric!.value)).toBe(true);
    }
  });

  it("mL answers have at most one decimal place", () => {
    for (const seed of SEEDS) {
      for (const kind of ["calc-2step", "calc-3step", "calc-mgkg"] as CalcKind[]) {
        const q = generateCalc(kind, seed) as FillQuestion;
        if (q.unit === "mL") expect(Math.round(q.numeric!.value * 10) / 10).toBe(q.numeric!.value);
      }
    }
  });

  it("safe-dose verdicts include all three outcomes", () => {
    const seen = new Set<number>();
    for (const seed of SEEDS) {
      const q = generateCalc("calc-safe", seed);
      if (q.type === "mcq") seen.add((q as MCQQuestion).answer);
    }
    expect([...seen].sort()).toEqual([0, 1, 2]);
  });

  it("is deterministic for a given seed (so vault retries re-ask the same problem)", () => {
    for (const k of CALC_KINDS) expect(generateCalc(k.id, 4242)).toEqual(generateCalc(k.id, 4242));
  });
});
