import type { Activity, ClotClass, GaugeData } from "@/lib/activities/types";
import { mulberry32, pick, shuffle, type Rng } from "@/lib/rng";
import { CONTRASTS } from "@/data/contrasts";
import { generateCalc } from "@/data/calc";
import type { TopicId } from "@/lib/types";

/**
 * Activities generated from small, source-backed tables (seeded → reproducible from the Mistake Vault).
 * Every label below restates the Memory Aid / M7L2 Coagulation Modifiers.
 */

// ───────────────────────── DRUG FAMILY WALL ─────────────────────────
export const FAMILIES = [
  { id: "acei", label: "ACE inhibitors", suffixes: ["-pril"], hint: "Ends in -pril → blocks Ang I → Ang II", color: "#6366f1" },
  { id: "arb", label: "ARBs", suffixes: ["-sartan"], hint: "Ends in -sartan → blocks Ang II at the receptor", color: "#0ea5e9" },
  { id: "bb", label: "Beta-blockers", suffixes: ["-olol"], hint: "Ends in -olol → B1 heart / B2 lungs", color: "#10b981" },
  { id: "ccb", label: "Calcium channel blockers", suffixes: ["-pine", "-zem", "-mil"], hint: "-pine / -zem / -mil → block Ca entry", color: "#f59e0b" },
  { id: "benzo", label: "Benzodiazepines", suffixes: ["-pam", "-lam"], hint: "-pam / -lam → ↑GABA (think alcohol)", color: "#8b5cf6" },
  { id: "statin", label: "Statins", suffixes: ["-statin"], hint: "-statin → HMG-CoA reductase inhibitor", color: "#ef4444" },
];

/** Drug names used for suffix practice. Names marked course:true appear in the course files; the rest are
 *  common members used only to practice the blueprint's suffix rules (-pril, -sartan, …). */
export const FAMILY_DRUGS: { name: string; family: string; suffix: string; course: boolean }[] = [
  { name: "Lisinopril", family: "acei", suffix: "pril", course: false },
  { name: "Enalapril", family: "acei", suffix: "pril", course: false },
  { name: "Captopril", family: "acei", suffix: "pril", course: false },
  { name: "Ramipril", family: "acei", suffix: "pril", course: false },
  { name: "Losartan", family: "arb", suffix: "sartan", course: false },
  { name: "Valsartan", family: "arb", suffix: "sartan", course: false },
  { name: "Metoprolol", family: "bb", suffix: "olol", course: true },
  { name: "Atenolol", family: "bb", suffix: "olol", course: true },
  { name: "Propranolol", family: "bb", suffix: "olol", course: true },
  { name: "Amlodipine", family: "ccb", suffix: "pine", course: true },
  { name: "Nifedipine", family: "ccb", suffix: "pine", course: true },
  { name: "Diltiazem", family: "ccb", suffix: "zem", course: true },
  { name: "Verapamil", family: "ccb", suffix: "mil", course: true },
  { name: "Lorazepam", family: "benzo", suffix: "pam", course: true },
  { name: "Diazepam", family: "benzo", suffix: "pam", course: true },
  { name: "Midazolam", family: "benzo", suffix: "lam", course: true },
  { name: "Rosuvastatin", family: "statin", suffix: "statin", course: true },
];

function familyWall(seed: number): Activity {
  const rng = mulberry32(seed);
  const fams = shuffle(FAMILIES, rng).slice(0, 4);
  const cards = fams.flatMap((f) => shuffle(FAMILY_DRUGS.filter((d) => d.family === f.id), rng).slice(0, f.id === "statin" ? 1 : 2));
  return {
    id: `act:family:${seed}`,
    kind: "family-wall",
    title: "Drug Family Wall",
    topic: "antihtn",
    concepts: ["htn-suffix"],
    source: "Blueprint suffixes (-pril, -sartan, -pine/-zem/-mil) + Memory Aid (-olol, -pam/-lam, statins)",
    difficulty: 1,
    data: { families: fams, cards: shuffle(cards, rng).slice(0, 7).map((c) => ({ name: c.name, family: c.family, suffix: c.suffix })) },
  };
}

// ───────────────────────── RAAS ─────────────────────────
function raas(seed: number): Activity {
  const rng = mulberry32(seed);
  const pril = pick(rng, ["Lisinopril", "Enalapril", "Captopril"]);
  const sartan = pick(rng, ["Losartan", "Valsartan"]);
  return {
    id: `act:raas:${seed}`,
    kind: "raas",
    title: "RAAS: where do they act?",
    topic: "antihtn",
    concepts: ["ace-moa", "arb-moa", "ace-hyperk", "spiro-moa"],
    source: "Memory Aid · ACE inhibitors / ARBs / Spironolactone",
    difficulty: 2,
    data: {
      challenges: shuffle(
        [
          {
            prompt: `Block the pathway where ${pril.toLowerCase()} works.`,
            drug: pril,
            target: "ace" as const,
            followUp: {
              prompt: "Which electrolyte should concern you?",
              options: ["Potassium — retained (hyperkalemia)", "Sodium — retained", "Potassium — wasted (hypokalemia)", "Calcium — lost"],
              answer: [0],
              why: "ACE inhibitors ↓Na/H2O retention and RETAIN K+ → hyperkalemia. Avoid salt substitutes (KCl).",
            },
          },
          {
            prompt: `Where does ${sartan.toLowerCase()} block the pathway?`,
            drug: sartan,
            target: "receptor" as const,
            followUp: {
              prompt: `Compared with an ACE inhibitor, ${sartan.toLowerCase()} causes…`,
              options: ["Much less cough — bradykinin untouched", "No risk of hyperkalemia", "No risk of angioedema", "Ototoxicity"],
              answer: [0],
              why: "ARBs block Ang II at the receptor; bradykinin is untouched → much less cough. Per the ARB lecture, ARBs do NOT cause hyperkalemia; angioedema is still possible.",
            },
          },
          {
            prompt: "Spironolactone blocks this hormone. Tap it.",
            drug: "Spironolactone",
            target: "aldosterone" as const,
            followUp: {
              prompt: "Best teaching for spironolactone?",
              options: ["Limit high-K+ foods; avoid salt substitutes", "Eat more bananas and potatoes", "Add a K+ supplement", "Skip doses when urinating more"],
              answer: [0],
              why: "Spironolactone blocks aldosterone → retains K+. Limit K+ foods; K+ supplements → fatal hyperkalemia.",
            },
          },
        ],
        rng,
      ),
    },
  };
}

// ───────────────────────── NEPHRON ─────────────────────────
function nephron(seed: number): Activity {
  return {
    id: `act:nephron:${seed}`,
    kind: "nephron",
    title: "Diuretic map",
    topic: "diuretics",
    concepts: ["loop-moa", "thz-moa", "spiro-moa", "mannitol-moa", "k-updown"],
    source: "Memory Aid · Diuretics (loop, thiazide, K-sparing, osmotic)",
    difficulty: 2,
    data: {
      drugs: shuffle(
        [
          { id: "furosemide" as const, name: "Furosemide", zone: "loop" as const },
          { id: "hctz" as const, name: "HCTZ", zone: "distal" as const },
          { id: "spironolactone" as const, name: "Spironolactone", zone: "aldosterone" as const },
          { id: "mannitol" as const, name: "Mannitol", zone: "blood" as const },
        ],
        mulberry32(seed),
      ),
      followUp: {
        prompt: "Protect the potassium: which client should eat MORE K+ foods?",
        options: ["Client on furosemide", "Client on spironolactone", "Client on an ACE inhibitor", "Client on an ARB"],
        answer: [0],
        why: "Loop + thiazide are K+-WASTING → eat more K+ (bananas, OJ, avocado, potato). Spironolactone/ACE retain K+.",
      },
    },
  };
}

// ───────────────────────── CLOTTING LAB ─────────────────────────
const ANTICOAG = ["Heparin", "Enoxaparin", "Warfarin", "Dabigatran", "Rivaroxaban"];
const ANTIPLT = ["Aspirin", "Clopidogrel"];

function clotLab(seed: number): Activity {
  const rng = mulberry32(seed);
  const cards = (): { name: string; cls: ClotClass }[] =>
    shuffle(
      [
        { name: pick(rng, ANTICOAG), cls: "anticoagulant" as const },
        { name: pick(rng, ANTIPLT), cls: "antiplatelet" as const },
        { name: "Alteplase", cls: "thrombolytic" as const },
      ],
      rng,
    );
  return {
    id: `act:clot:${seed}`,
    kind: "clot-lab",
    title: "Clotting Lab",
    topic: "coag",
    concepts: ["coag-classes", "ap-vs-ac", "tpa-moa", "hep-moa"],
    source: "M7L2 Coagulation Modifiers · Slides 1, 9, 12 + Memory Aid (antiplatelet = arteries; anticoagulant = veins + left atrium)",
    difficulty: 2,
    data: {
      scenarios: shuffle(
        [
          {
            prompt: "An existing clot blocks this vessel. It needs to be DISSOLVED.",
            scene: "existing-clot" as const,
            answer: "thrombolytic" as const,
            cards: cards(),
            why: "Only the thrombolytic (alteplase) dissolves clots: plasminogen → plasmin. Anticoagulants do NOT dissolve existing clots.",
          },
          {
            prompt: "Low-velocity vein (DVT): stop NEW clot from forming.",
            scene: "venous-prevent" as const,
            answer: "anticoagulant" as const,
            cards: cards(),
            why: "Anticoagulants work in low-velocity veins + left atrium (DVT, PE, a-fib). They prevent new clot — they don't dissolve one.",
          },
          {
            prompt: "Platelets are clumping at an artery injury (CAD / stroke prevention).",
            scene: "platelet-clump" as const,
            answer: "antiplatelet" as const,
            cards: cards(),
            why: "Antiplatelets stop platelets clumping in high-velocity arteries (CAD, CVA, PAD). Aspirin inhibits COX; clopidogrel blocks P2Y12.",
          },
        ],
        rng,
      ),
    },
  };
}

// ───────────────────────── LAB GAUGES ─────────────────────────
type Band = "low" | "in" | "high";
interface Scale {
  key: string;
  lab: string;
  drug: string;
  unit: string;
  min: number;
  max: number;
  low: number;
  high: number;
  context?: string;
  bands: Band[]; // bands we may generate values in (only those the course describes)
  zoneLabels: GaugeData["zoneLabels"];
  meaning: GaugeData["meaning"];
  action: GaugeData["action"];
  topic: TopicId;
  concept: string;
  source: string;
  values: Record<Band, number[]>;
}

const AC_LOW = "Below range — risk of SEIZURES";
const AC_HIGH = "Above range — TOXICITY";
const anticonvulsant = (key: string, drug: string, low: number, high: number, values: Record<Band, number[]>): Scale => ({
  key,
  lab: `${drug} level`,
  drug,
  unit: "mcg/mL",
  min: 0,
  max: Math.round(high * 1.8),
  low,
  high,
  bands: ["low", "in", "high"],
  zoneLabels: { low: "Seizure risk", in: "Therapeutic", high: "Toxic" },
  meaning: { low: AC_LOW, in: "Therapeutic — within range", high: AC_HIGH },
  action: { low: "Recognize breakthrough-seizure risk", in: "Give as scheduled, same time daily", high: "Hold the dose + notify" },
  topic: "anticonv",
  concept: "ac-levels",
  source: "Memory Aid · Anticonvulsants — Levels",
  values,
});

export const SCALES: Scale[] = [
  {
    key: "aptt",
    lab: "aPTT",
    drug: "Heparin",
    unit: "sec",
    min: 20,
    max: 140,
    low: 60,
    high: 80,
    bands: ["low", "in", "high"],
    zoneLabels: { low: "Clot risk", in: "Therapeutic", high: "Bleeding risk" },
    meaning: { low: "Subtherapeutic — still at risk for clots", in: "Therapeutic (1.5–2.5× normal)", high: "Supratherapeutic — greater bleeding risk" },
    action: { low: "Watch for clot signs: calf heat, redness, pain, swelling", in: "Continue; keep monitoring the aPTT", high: "Assess for bleeding; protamine if toxicity" },
    topic: "coag",
    concept: "hep-lab",
    source: "M7L2 Coagulation Modifiers · Slide 2",
    values: { low: [40, 45, 50], in: [64, 70, 76], high: [95, 105, 118] },
  },
  {
    key: "inr-afib",
    lab: "INR",
    drug: "Warfarin",
    unit: "",
    context: "atrial fibrillation (most indications: 2–3)",
    min: 0.5,
    max: 6,
    low: 2,
    high: 3,
    bands: ["low", "in", "high"],
    zoneLabels: { low: "Clot risk", in: "Therapeutic", high: "Bleeding risk" },
    meaning: { low: "Below range — still at risk for clots", in: "Within the therapeutic range", high: "Above range — bleeding risk" },
    action: { low: "Recognize ongoing clot risk", in: "Give as prescribed; keep PT/INR follow-ups", high: "Hold the dose; vitamin K if INR too high" },
    topic: "coag",
    concept: "war-lab",
    source: "M7L2 Coagulation Modifiers · Slides 5–6",
    values: { low: [1.2, 1.5], in: [2.3, 2.6], high: [4.1, 4.8] },
  },
  {
    key: "inr-pe",
    lab: "INR",
    drug: "Warfarin",
    unit: "",
    context: "PE treatment (2.5–3.5)",
    min: 0.5,
    max: 6,
    low: 2.5,
    high: 3.5,
    bands: ["low", "in", "high"],
    zoneLabels: { low: "Clot risk", in: "Therapeutic", high: "Bleeding risk" },
    meaning: { low: "Below range — still at risk for clots", in: "Within the therapeutic range", high: "Above range — bleeding risk" },
    action: { low: "Recognize ongoing clot risk", in: "Give as prescribed; keep PT/INR follow-ups", high: "Hold the dose; vitamin K if INR too high" },
    topic: "coag",
    concept: "war-lab",
    source: "M7L2 Coagulation Modifiers · Slide 5",
    values: { low: [1.6, 2.0], in: [2.8, 3.1], high: [4.4, 5.0] },
  },
  {
    key: "inr-valve",
    lab: "INR",
    drug: "Warfarin",
    unit: "",
    context: "mechanical heart valve (3–4.5)",
    min: 0.5,
    max: 7,
    low: 3,
    high: 4.5,
    bands: ["low", "in", "high"],
    zoneLabels: { low: "Clot risk", in: "Therapeutic", high: "Bleeding risk" },
    meaning: { low: "Below range — still at risk for clots", in: "Within the therapeutic range", high: "Above range — bleeding risk" },
    action: { low: "Recognize ongoing clot risk", in: "Give as prescribed; keep PT/INR follow-ups", high: "Hold the dose; vitamin K if INR too high" },
    topic: "coag",
    concept: "war-lab",
    source: "M7L2 Coagulation Modifiers · Slide 5",
    values: { low: [2.0, 2.4], in: [3.5, 4.0], high: [5.6, 6.2] },
  },
  {
    key: "digoxin",
    lab: "Digoxin level",
    drug: "Digoxin",
    unit: "ng/mL",
    context: "lecture range 0.5–0.8; > 2 = toxic",
    min: 0,
    max: 3.5,
    low: 0.5,
    high: 0.8,
    bands: ["in", "high"],
    zoneLabels: { low: "", in: "Therapeutic", high: "Above range" },
    meaning: { low: "", in: "Therapeutic — still check the apical pulse for a full minute", high: "Above the therapeutic range (> 2 ng/mL = toxicity) — watch for anorexia (earliest), N/V, halos" },
    action: { low: "", in: "Give if apical pulse ≥ 60 (full minute)", high: "Hold + notify; antidote digoxin immune fab" },
    topic: "hf",
    concept: "dig-lab",
    source: "M6L3 Heart Failure Drugs · Slide 2",
    values: { low: [], in: [0.6, 0.7], high: [2.6, 3.0] },
  },
  anticonvulsant("phenytoin", "Phenytoin", 10, 20, { low: [5, 7], in: [14, 16], high: [27, 30] }),
  anticonvulsant("phenobarbital", "Phenobarbital", 10, 40, { low: [5, 6], in: [22, 30], high: [52, 60] }),
  anticonvulsant("carbamazepine", "Carbamazepine", 4, 12, { low: [2, 2.5], in: [7, 9], high: [16, 18] }),
  anticonvulsant("valproic", "Valproic acid", 50, 100, { low: [30, 35], in: [70, 80], high: [135, 150] }),
  anticonvulsant("topiramate", "Topiramate", 5, 20, { low: [2, 3], in: [10, 12], high: [28, 32] }),
];

function gauge(scale: Scale, seed: number): Activity {
  const rng = mulberry32(seed);
  const band = pick(rng, scale.bands);
  const value = pick(rng, scale.values[band]);
  return {
    id: `act:gauge-${scale.key}:${seed}`,
    kind: "gauge",
    title: `${scale.lab} gauge`,
    topic: scale.topic,
    concepts: [scale.concept],
    source: scale.source,
    difficulty: 2,
    data: {
      lab: scale.lab,
      drug: scale.drug,
      unit: scale.unit,
      min: scale.min,
      max: scale.max,
      low: scale.low,
      high: scale.high,
      value,
      context: scale.context,
      zoneLabels: scale.zoneLabels,
      meaning: scale.meaning,
      action: scale.action,
    },
  };
}

// ───────────────────────── COMPARE (visual Don't Mix) ─────────────────────────
function compare(setId: string): Activity {
  const set = CONTRASTS.find((c) => c.id === setId)!;
  return {
    id: `act:compare-${setId}`,
    kind: "compare",
    title: `Rebuild: ${set.title}`,
    topic: set.topic,
    concepts: [set.concept],
    source: set.source,
    difficulty: 3,
    data: { setId, hide: Math.min(6, Math.max(3, Math.floor((set.rows.length * set.columns.length) / 2))) },
  };
}

// ───────────────────────── DRIP LAB ─────────────────────────
function drip(kind: "calc-gtts" | "calc-mlhr", seed: number): Activity {
  const q = generateCalc(kind, seed);
  return {
    id: `act:drip-${kind === "calc-gtts" ? "gtts" : "mlhr"}:${seed}`,
    kind: "drip",
    title: kind === "calc-gtts" ? "Drip Lab · drops/min" : "Pump Lab · mL/hr",
    topic: "calc",
    concepts: [kind],
    source: "Memory Aid · CALC formulas",
    difficulty: 2,
    data: { calcId: q.id },
  };
}

// ───────────────────────── registry of generated templates ─────────────────────────
export interface Template {
  key: string;
  kind: Activity["kind"];
  topic: TopicId;
  concepts: string[];
  make: (seed: number) => Activity;
}

export const TEMPLATES: Template[] = [
  { key: "family", kind: "family-wall", topic: "antihtn", concepts: ["htn-suffix"], make: familyWall },
  { key: "raas", kind: "raas", topic: "antihtn", concepts: ["ace-moa", "arb-moa", "ace-hyperk", "spiro-moa"], make: raas },
  { key: "nephron", kind: "nephron", topic: "diuretics", concepts: ["loop-moa", "thz-moa", "spiro-moa", "mannitol-moa", "k-updown"], make: nephron },
  { key: "clot", kind: "clot-lab", topic: "coag", concepts: ["coag-classes", "ap-vs-ac", "tpa-moa", "hep-moa"], make: clotLab },
  ...SCALES.map((s) => ({ key: `gauge-${s.key}`, kind: "gauge" as const, topic: s.topic, concepts: [s.concept], make: (seed: number) => gauge(s, seed) })),
  ...CONTRASTS.map((c) => ({ key: `compare-${c.id}`, kind: "compare" as const, topic: c.topic, concepts: [c.concept], make: () => compare(c.id) })),
  { key: "drip-gtts", kind: "drip", topic: "calc", concepts: ["calc-gtts"], make: (seed: number) => drip("calc-gtts", seed) },
  { key: "drip-mlhr", kind: "drip", topic: "calc", concepts: ["calc-mlhr"], make: (seed: number) => drip("calc-mlhr", seed) },
];

export const TEMPLATE_BY_KEY: Record<string, Template> = Object.fromEntries(TEMPLATES.map((t) => [t.key, t]));

export const randomSeed = (rng: Rng = Math.random) => Math.floor(rng() * 2 ** 31);
