import type { FillQuestion, MCQQuestion } from "@/lib/types";
import { mulberry32, pick, randInt, type Rng } from "@/lib/rng";

/**
 * Dosage-calculation generators (Blueprint: Module 1 — 2-step, 3-step, 4-step mg/kg, safe dose,
 * mL/hour, IV dosage per hour, drops per minute).
 *
 * Formulas follow the Memory Aid "CALC" line:
 *   lb ÷ 2.2 = kg · g→mg ×1000 · mg→mcg ×1000 · mL/hr = total volume ÷ hours ·
 *   units/hr ÷ concentration = mL/hr · gtts/min = (mL/hr × drop factor) ÷ 60, ROUND TO WHOLE ·
 *   microdrip 60 gtts/mL: gtts/min = mL/hr · SAFE DOSE: calculate the range THEN COMPARE ·
 *   weight-based dosing MULTIPLIES.
 *
 * Numbers are practice values for math only (generic "medication" wording, no clinical claims).
 * Values are chosen so that every intermediate result is clean (weights are multiples of 2.2 lb, etc.).
 */

export type CalcKind = "calc-2step" | "calc-3step" | "calc-mgkg" | "calc-safe" | "calc-mlhr" | "calc-unitshr" | "calc-gtts";

export const CALC_KINDS: { id: CalcKind; title: string; blurb: string; formula: string }[] = [
  { id: "calc-2step", title: "2-Step", blurb: "Convert units, then find the dose", formula: "g→mg ×1000 · mg→mcg ×1000 · dose ÷ have × quantity" },
  { id: "calc-3step", title: "3-Step", blurb: "lb → kg → mg → mL", formula: "lb ÷ 2.2 = kg · kg × mg/kg = mg · mg ÷ (mg/mL) = mL" },
  { id: "calc-mgkg", title: "4-Step mg/kg", blurb: "Daily weight-based dose split into doses", formula: "lb ÷ 2.2 · × mg/kg/day · ÷ doses/day · ÷ concentration" },
  { id: "calc-safe", title: "Safe Dose", blurb: "Calculate the range, THEN compare", formula: "kg × low & kg × high → compare to the order" },
  { id: "calc-mlhr", title: "mL/hr", blurb: "Total volume ÷ hours", formula: "mL/hr = total mL ÷ total hours" },
  { id: "calc-unitshr", title: "IV Dose/hr", blurb: "units/hr ↔ mL/hr", formula: "mL/hr = (units/hr) ÷ (units/mL)" },
  { id: "calc-gtts", title: "Drops/min", blurb: "Gravity drips, round to whole", formula: "gtts/min = (mL/hr × drop factor) ÷ 60" },
];

export const UNIT_CHOICES = ["tablets", "mL", "mg", "mL/hr", "units/hr", "mg/hr", "gtts/min"] as const;

export const fmt = (n: number) => {
  const r = Math.round(n * 1000) / 1000;
  return r.toLocaleString("en-US", { maximumFractionDigits: 3 });
};

const SOURCE = "Memory Aid · CALC formulas";

type CalcQ = FillQuestion | MCQQuestion;

function base(kind: CalcKind, seed: number, difficulty: 1 | 2 | 3) {
  return {
    id: `${kind}-${seed}`,
    topic: "calc" as const,
    concept: kind,
    drugs: ["calc"],
    difficulty,
    cognitive: "apply" as const,
    format: "calc" as const,
    source: SOURCE,
    generated: true,
  };
}

function fill(
  kind: CalcKind,
  seed: number,
  difficulty: 1 | 2 | 3,
  stem: string,
  value: number,
  unit: string,
  steps: string[],
  tolerance = 0.001,
  hook?: string,
): FillQuestion {
  return {
    ...base(kind, seed, difficulty),
    type: "fill",
    stem: `${stem} ____ ${unit}`,
    accept: [fmt(value)],
    numeric: { value, tolerance },
    unit,
    steps,
    why: steps.join(" → "),
    hook,
  };
}

function twoStep(rng: Rng, seed: number): CalcQ {
  const v = randInt(rng, 0, 3);
  if (v === 0) {
    const tab = pick(rng, [125, 250, 500]);
    const n = pick(rng, [2, 3, 4]);
    const orderG = (tab * n) / 1000;
    return fill("calc-2step", seed, 1, `The provider orders a medication ${fmt(orderG)} g PO. Available: ${tab} mg tablets. How many tablets will the nurse give?`, n, "tablets", [
      `Convert g → mg: ${fmt(orderG)} g × 1000 = ${fmt(orderG * 1000)} mg`,
      `Dose ÷ have: ${fmt(orderG * 1000)} mg ÷ ${tab} mg/tablet = ${n} tablets`,
    ]);
  }
  if (v === 1) {
    const tab = pick(rng, [0.125, 0.25, 0.5]);
    const n = pick(rng, [2, 3]);
    const orderMcg = tab * n * 1000;
    return fill("calc-2step", seed, 1, `The provider orders a medication ${fmt(orderMcg)} mcg PO. Available: ${fmt(tab)} mg tablets. How many tablets will the nurse give?`, n, "tablets", [
      `Convert mcg → mg: ${fmt(orderMcg)} mcg ÷ 1000 = ${fmt(orderMcg / 1000)} mg`,
      `Dose ÷ have: ${fmt(orderMcg / 1000)} mg ÷ ${fmt(tab)} mg/tablet = ${n} tablets`,
    ]);
  }
  if (v === 2) {
    const per = pick(rng, [125, 250]);
    const perMl = 5;
    const mult = pick(rng, [2, 3, 4]);
    const orderMg = per * mult;
    const orderG = orderMg / 1000;
    const mL = mult * perMl;
    return fill("calc-2step", seed, 2, `Order: ${fmt(orderG)} g of an oral suspension. Available: ${per} mg per ${perMl} mL. How many mL will the nurse give?`, mL, "mL", [
      `Convert g → mg: ${fmt(orderG)} g × 1000 = ${fmt(orderMg)} mg`,
      `(Dose ÷ have) × quantity: (${fmt(orderMg)} mg ÷ ${per} mg) × ${perMl} mL = ${fmt(mL)} mL`,
    ]);
  }
  let conc = 50;
  let orderMcg = 100;
  let mL = 2;
  for (;;) {
    conc = pick(rng, [25, 50, 100]); // mcg/mL
    orderMcg = pick(rng, [50, 75, 100, 125, 150, 200, 250]);
    mL = orderMcg / conc;
    if (Math.round(mL * 10) / 10 === mL && mL >= 0.5 && mL <= 5) break;
  }
  return fill("calc-2step", seed, 2, `Order: ${fmt(orderMcg / 1000)} mg IV of a medication. Available: ${conc} mcg/mL. How many mL will the nurse draw up?`, mL, "mL", [
    `Convert mg → mcg: ${fmt(orderMcg / 1000)} mg × 1000 = ${fmt(orderMcg)} mcg`,
    `Dose ÷ concentration: ${fmt(orderMcg)} mcg ÷ ${conc} mcg/mL = ${fmt(mL)} mL`,
  ], 0.05);
}

/** weight in kg that are clean in lb (kg × 2.2) */
function weight(rng: Rng, adult: boolean) {
  const kg = adult ? pick(rng, [50, 55, 60, 65, 70, 75, 80, 85, 90, 100]) : pick(rng, [5, 8, 10, 12, 15, 18, 20, 25, 30, 35, 40]);
  const lb = Math.round(kg * 2.2 * 10) / 10;
  return { kg, lb };
}

function threeStep(rng: Rng, seed: number): CalcQ {
  for (;;) {
    const { kg, lb } = weight(rng, rng() < 0.5);
    const perKg = pick(rng, [0.5, 1, 2, 2.5, 5]);
    const conc = pick(rng, [2, 5, 10, 20, 25, 50]);
    const mg = kg * perKg;
    const mL = mg / conc;
    if (Math.round(mL * 10) / 10 !== mL || mL < 0.5 || mL > 30) continue;
    return fill("calc-3step", seed, 2, `A client weighs ${fmt(lb)} lb. The order is ${fmt(perKg)} mg/kg IV once. The vial contains ${conc} mg/mL. How many mL will the nurse give?`, mL, "mL", [
      `lb → kg: ${fmt(lb)} ÷ 2.2 = ${fmt(kg)} kg`,
      `Weight-based dose: ${fmt(kg)} kg × ${fmt(perKg)} mg/kg = ${fmt(mg)} mg`,
      `mg → mL: ${fmt(mg)} mg ÷ ${conc} mg/mL = ${fmt(mL)} mL`,
    ], 0.05, "Weight-based dosing MULTIPLIES (kg × mg/kg).");
  }
}

const FREQ = [
  { q: "every 12 hours", n: 2 },
  { q: "every 8 hours", n: 3 },
  { q: "every 6 hours", n: 4 },
];

function mgKg(rng: Rng, seed: number): CalcQ {
  for (;;) {
    const { kg, lb } = weight(rng, false);
    const perDay = pick(rng, [20, 30, 40, 50, 60, 80, 90]);
    const f = pick(rng, FREQ);
    const daily = kg * perDay;
    const perDose = daily / f.n;
    const conc = pick(rng, [{ mg: 100, mL: 5 }, { mg: 125, mL: 5 }, { mg: 250, mL: 5 }, { mg: 200, mL: 5 }, { mg: 40, mL: 1 }]);
    const mL = (perDose / conc.mg) * conc.mL;
    if (perDose !== Math.round(perDose) || Math.round(mL * 10) / 10 !== mL || mL < 1 || mL > 30) continue;
    return fill("calc-mgkg", seed, 3, `A child weighs ${fmt(lb)} lb. The order is ${perDay} mg/kg/day PO divided ${f.q}. Available: ${conc.mg} mg/${conc.mL} mL. How many mL per dose?`, mL, "mL", [
      `lb → kg: ${fmt(lb)} ÷ 2.2 = ${fmt(kg)} kg`,
      `Daily dose: ${fmt(kg)} kg × ${perDay} mg/kg/day = ${fmt(daily)} mg/day`,
      `Per dose: ${f.q} = ${f.n} doses/day → ${fmt(daily)} ÷ ${f.n} = ${fmt(perDose)} mg/dose`,
      `mg → mL: (${fmt(perDose)} mg ÷ ${conc.mg} mg) × ${conc.mL} mL = ${fmt(mL)} mL`,
    ], 0.05);
  }
}

export const SAFE_OPTIONS = [
  "Safe — within the safe range; give the dose",
  "Unsafe — exceeds the safe range; hold and contact the provider",
  "Unsafe — below the safe range; contact the provider",
];

function safeDose(rng: Rng, seed: number): CalcQ {
  for (;;) {
    const { kg, lb } = weight(rng, false);
    const low = pick(rng, [10, 15, 20, 25, 30]);
    const high = low + pick(rng, [10, 15, 20, 30]);
    const f = pick(rng, FREQ);
    const lowDay = kg * low;
    const highDay = kg * high;
    const verdict = pick(rng, [0, 0, 1, 1, 2]);
    let dose: number;
    if (verdict === 0) dose = Math.round(((lowDay + highDay) / 2 / f.n) / 5) * 5;
    else if (verdict === 1) dose = Math.ceil(((highDay * pick(rng, [1.2, 1.4, 1.6])) / f.n) / 5) * 5;
    else dose = Math.floor(((lowDay * pick(rng, [0.5, 0.6, 0.7])) / f.n) / 5) * 5;
    const ordered = dose * f.n;
    const actual = ordered > highDay ? 1 : ordered < lowDay ? 2 : 0;
    if (actual !== verdict || dose <= 0) continue;
    if (lowDay !== Math.round(lowDay) || highDay !== Math.round(highDay)) continue;
    const askNumeric = rng() < 0.4;
    const steps = [
      `lb → kg: ${fmt(lb)} ÷ 2.2 = ${fmt(kg)} kg`,
      `Safe range: ${fmt(kg)} × ${low} = ${fmt(lowDay)} mg/day  to  ${fmt(kg)} × ${high} = ${fmt(highDay)} mg/day`,
      `Ordered: ${dose} mg × ${f.n} doses (${f.q}) = ${fmt(ordered)} mg/day`,
      `Compare: ${fmt(ordered)} mg/day is ${actual === 0 ? "within" : actual === 1 ? "ABOVE" : "BELOW"} ${fmt(lowDay)}–${fmt(highDay)} mg/day → ${actual === 0 ? "safe" : "unsafe"}`,
    ];
    const stemBase = `A child weighs ${fmt(lb)} lb. The safe range for a medication is ${low}–${high} mg/kg/day. The order is ${dose} mg PO ${f.q}.`;
    if (askNumeric) {
      return fill("calc-safe", seed, 2, `${stemBase} What is the MAXIMUM safe daily dose?`, highDay, "mg", steps.slice(0, 2).concat([`Maximum safe daily dose = ${fmt(highDay)} mg/day (then compare the order to the range)`]), 0.001, "SAFE DOSE: calculate the range THEN COMPARE to the order.");
    }
    return {
      ...base("calc-safe", seed, 3),
      type: "mcq",
      stem: `${stemBase} Is the ordered dose safe?`,
      options: SAFE_OPTIONS,
      answer: actual,
      steps,
      why: steps.join(" → "),
      hook: "SAFE DOSE: calculate the range THEN COMPARE to the order.",
    };
  }
}

function mlHr(rng: Rng, seed: number): CalcQ {
  for (;;) {
    if (rng() < 0.75) {
      const vol = pick(rng, [250, 500, 750, 1000, 1200, 1500, 2000]);
      const hrs = pick(rng, [2, 4, 5, 6, 8, 10, 12, 24]);
      const r = vol / hrs;
      if (r !== Math.round(r)) continue;
      return fill("calc-mlhr", seed, 1, `Infuse ${fmt(vol)} mL of IV fluid over ${hrs} hours by infusion pump. Set the pump to:`, r, "mL/hr", [`mL/hr = total volume ÷ hours = ${fmt(vol)} mL ÷ ${hrs} hr = ${fmt(r)} mL/hr`]);
    }
    const vol = pick(rng, [50, 100, 150, 250]);
    const min = pick(rng, [20, 30, 45, 60, 90]);
    const r = (vol / min) * 60;
    if (r !== Math.round(r)) continue;
    return fill("calc-mlhr", seed, 2, `An IV medication of ${vol} mL is to infuse over ${min} minutes by pump. Set the pump to:`, r, "mL/hr", [
      `Convert minutes → hours: ${min} min ÷ 60 = ${fmt(min / 60)} hr`,
      `mL/hr = ${vol} mL ÷ ${fmt(min / 60)} hr = ${fmt(r)} mL/hr`,
    ]);
  }
}

const UNIT_BAGS = [
  { amt: 25000, mL: 500, unit: "units" },
  { amt: 25000, mL: 250, unit: "units" },
  { amt: 20000, mL: 500, unit: "units" },
  { amt: 10000, mL: 250, unit: "units" },
  { amt: 100, mL: 100, unit: "mg" },
  { amt: 250, mL: 250, unit: "mg" },
  { amt: 50, mL: 250, unit: "mg" },
  { amt: 200, mL: 100, unit: "mg" },
];

function unitsHr(rng: Rng, seed: number): CalcQ {
  const bag = pick(rng, UNIT_BAGS);
  const conc = bag.amt / bag.mL; // per mL
  const rate = randInt(rng, 5, 40); // mL/hr
  const dosePerHr = Math.round(rate * conc * 1000) / 1000;
  const u = bag.unit;
  if (rng() < 0.6) {
    return fill("calc-unitshr", seed, 2, `An IV medication is prescribed at ${fmt(dosePerHr)} ${u}/hr. The bag contains ${fmt(bag.amt)} ${u} in ${bag.mL} mL. Set the pump to:`, rate, "mL/hr", [
      `Concentration: ${fmt(bag.amt)} ${u} ÷ ${bag.mL} mL = ${fmt(conc)} ${u}/mL`,
      `mL/hr = (${u}/hr) ÷ concentration = ${fmt(dosePerHr)} ÷ ${fmt(conc)} = ${fmt(rate)} mL/hr`,
    ], 0.05);
  }
  return fill("calc-unitshr", seed, 2, `A bag containing ${fmt(bag.amt)} ${u} in ${bag.mL} mL is infusing at ${rate} mL/hr. How many ${u} per hour is the client receiving?`, dosePerHr, `${u}/hr`, [
    `Concentration: ${fmt(bag.amt)} ${u} ÷ ${bag.mL} mL = ${fmt(conc)} ${u}/mL`,
    `${u}/hr = mL/hr × concentration = ${rate} × ${fmt(conc)} = ${fmt(dosePerHr)} ${u}/hr`,
  ], 0.05);
}

function gtts(rng: Rng, seed: number): CalcQ {
  for (;;) {
    const df = pick(rng, [10, 15, 20, 60]);
    const viaHours = rng() < 0.5;
    let mlhr: number;
    let stem: string;
    const steps: string[] = [];
    if (viaHours) {
      const vol = pick(rng, [500, 1000, 1500, 2000, 250]);
      const hrs = pick(rng, [4, 5, 8, 10, 12, 24]);
      mlhr = vol / hrs;
      if (mlhr !== Math.round(mlhr)) continue;
      stem = `Infuse ${fmt(vol)} mL over ${hrs} hours by gravity. The tubing drop factor is ${df} gtts/mL. How many drops per minute?`;
      steps.push(`mL/hr = ${fmt(vol)} ÷ ${hrs} = ${fmt(mlhr)} mL/hr`);
    } else {
      mlhr = pick(rng, [50, 75, 80, 100, 125, 150, 175, 200]);
      stem = `An IV is ordered at ${mlhr} mL/hr by gravity. The drop factor is ${df} gtts/mL. How many drops per minute?`;
    }
    const exact = (mlhr * df) / 60;
    const frac = exact - Math.floor(exact);
    if (Math.abs(frac - 0.5) < 1e-9) continue; // avoid ambiguous .5 rounding
    const ans = Math.round(exact);
    steps.push(`gtts/min = (mL/hr × drop factor) ÷ 60 = (${fmt(mlhr)} × ${df}) ÷ 60 = ${fmt(exact)}`);
    if (ans !== exact) steps.push(`Round to a whole drop: ${ans} gtts/min`);
    if (df === 60) steps.push("Microdrip (60 gtts/mL): gtts/min = mL/hr");
    return fill("calc-gtts", seed, 2, stem, ans, "gtts/min", steps, 0.001, "You can't give part of a drop — gtts/min always ROUNDS TO A WHOLE number.");
  }
}

const GEN: Record<CalcKind, (rng: Rng, seed: number) => CalcQ> = {
  "calc-2step": twoStep,
  "calc-3step": threeStep,
  "calc-mgkg": mgKg,
  "calc-safe": safeDose,
  "calc-mlhr": mlHr,
  "calc-unitshr": unitsHr,
  "calc-gtts": gtts,
};

export function generateCalc(kind: CalcKind, seed: number): CalcQ {
  return GEN[kind](mulberry32(seed), seed);
}

export const isCalcKind = (s: string): s is CalcKind => s in GEN;
