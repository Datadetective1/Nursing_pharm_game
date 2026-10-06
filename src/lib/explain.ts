import type { Question } from "@/lib/types";
import { CONCEPT_BY_ID } from "@/data/curriculum";
import { ANTIDOTES, type AntidotePair } from "@/data/antidotes";
import { CONTRASTS, type ContrastSet } from "@/data/contrasts";
import { FAMILY_DRUGS, SCALES } from "@/data/activities/generated";
import { BODY } from "@/data/activities/body";
import type { ActivityOf, ClotClass, GaugeData } from "@/lib/activities/types";
import { correctAnswerText } from "@/lib/engine/grade";

/**
 * Picks ONE visual explainer for a question's feedback (so the answer is shown, not just told).
 * Pure + deterministic so it can be unit-tested. Every visual restates data that already lives in
 * source-checked tables (antidotes, gauge scales, suffix families, K+ sorter, body maps, contrasts).
 */
export type Explainer =
  | { kind: "timeline"; steps: string[] }
  | { kind: "antidote"; pairs: AntidotePair[] }
  | { kind: "gauge"; gauge: Omit<GaugeData, "value"> & { value: number | null } }
  | { kind: "suffix"; drugs: { name: string; family: string; suffix: string; correct: boolean }[] }
  | { kind: "raas"; target: "ace" | "receptor" | "aldosterone" }
  | { kind: "nephron"; drug: "furosemide" | "hctz" | "spironolactone" | "mannitol" }
  | { kind: "clot"; highlight: ClotClass[] }
  | { kind: "potassium"; items: { label: string; dir: "up" | "down"; why: string }[] }
  | { kind: "body"; act: ActivityOf<"body"> }
  | { kind: "compare"; set: ContrastSet }
  | { kind: "hold"; rules: HoldRule[] };

/** Hold parameters, restating the source-checked concept labels (curriculum.ts). */
export type HoldRule =
  | { label: string; type: "below"; cut: number; unit: string; min: number; max: number; rescue?: { cut: number; label: string }; value: number | null }
  | { label: string; type: "rule"; text: string };

export const HOLD: Record<string, HoldRule[]> = {
  "op-hold": [
    { label: "RR", type: "below", cut: 12, unit: "/min", min: 4, max: 24, rescue: { cut: 10, label: "Naloxone" }, value: null },
    { label: "SBP", type: "below", cut: 100, unit: "mmHg", min: 60, max: 160, value: null },
    { label: "HR", type: "below", cut: 60, unit: "bpm", min: 30, max: 120, value: null },
  ],
  "dig-hold": [{ label: "Apical pulse (full minute)", type: "below", cut: 60, unit: "bpm", min: 30, max: 120, value: null }],
  "ntg-hold": [{ label: "SBP", type: "below", cut: 90, unit: "mmHg", min: 60, max: 160, value: null }],
  "bb-hold": [
    { label: "SBP", type: "below", cut: 100, unit: "mmHg", min: 60, max: 160, value: null },
    { label: "HR", type: "below", cut: 60, unit: "bpm", min: 30, max: 120, value: null },
  ],
  "hep-hit": [{ label: "Platelets", type: "rule", text: "Drop ≥ 50% or < 100,000 → hold + notify" }],
  "loop-admin": [
    { label: "IV furosemide", type: "rule", text: "No faster than 20 mg/min" },
    { label: "K+", type: "rule", text: "Hold for low K+" },
  ],
  "k-iv": [{ label: "IV potassium", type: "rule", text: "NEVER IV push · dilute · infuse · cardiac monitor" }],
  "pht-iv": [{ label: "IV phenytoin", type: "rule", text: "NS only · ≤ 50 mg/min · flush · never IM" }],
  "apap-max": [{ label: "Acetaminophen max", type: "rule", text: "4 g/day · 3 g if undernourished · 2 g if > 3 drinks/day" }],
  "gout-probenecid": [{ label: "Probenecid", type: "rule", text: "Hold within 2–3 weeks of an acute attack" }],
};

const VITAL_RE: Record<string, RegExp> = {
  RR: /\b(?:rr|respirations?|respiratory rate)\D{0,14}(\d{1,2})\b/g,
  SBP: /\b(?:bp|blood pressure|sbp)\D{0,14}(\d{2,3})\s*\//g,
  HR: /\b(?:hr|heart rate|pulse|apical(?: pulse)?)\D{0,14}(\d{2,3})\b/g,
};

export function holdFor(q: Question): Explainer | null {
  const rules = HOLD[q.concept];
  if (!rules) return null;
  const stem = lc(q.stem).replace(/,?\s*(?:counted )?for (?:1|a|one) full (?:minute|60 seconds),?/g, " ");
  const out = rules.map((r) => {
    if (r.type !== "below" || stem.includes("__")) return r;
    const re = VITAL_RE[r.label.startsWith("Apical") ? "HR" : r.label];
    // skip rule statements ("below 60", "less than 90") — only real readings get a needle
    const vals = re ? [...stem.matchAll(re)].filter((m) => !/below|less|under|<|above|greater|>/.test(m[0])).map((m) => Number(m[1])).filter((v) => v >= r.min && v <= r.max) : [];
    return { ...r, value: vals.length === 1 ? vals[0] : null };
  });
  return { kind: "hold", rules: out };
}

const lc = (s: string) => s.toLowerCase();
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const has = (text: string, word: string) => new RegExp(`(^|[^a-z])${esc(lc(word))}s?(?![a-z])`, "i").test(text);

/** All learner-visible text of a question (stem + options/items + answer). */
export function questionText(q: Question): string {
  const parts = [q.stem];
  if (q.type === "mcq" || q.type === "sata") parts.push(...q.options);
  if (q.type === "order") parts.push(...q.items);
  if (q.type === "match") parts.push(...q.pairs.flat());
  if (q.type === "fill") parts.push(...q.accept);
  return lc(parts.join(" \n "));
}

// ── K+ direction table (restates the source-checked "Protect the Potassium" sorter) ──
const K_TABLE: { label: string; dir: "up" | "down"; why: string; aliases: string[] }[] = [
  { label: "Furosemide", dir: "down", why: "Loop diuretic: K-wasting", aliases: ["furosemide", "loop diuretic"] },
  { label: "HCTZ", dir: "down", why: "Thiazide: K-wasting", aliases: ["hydrochlorothiazide", "hctz", "thiazide"] },
  { label: "Spironolactone", dir: "up", why: "K-sparing: blocks aldosterone", aliases: ["spironolactone", "k-sparing", "potassium-sparing"] },
  { label: "ACE inhibitor (-pril)", dir: "up", why: "Retains K+ → hyperkalemia", aliases: ["ace inhibitor", "lisinopril", "captopril", "enalapril", "-pril"] },
  { label: "Salt substitutes", dir: "up", why: "Salt substitutes = KCl", aliases: ["salt substitute"] },
];
const K_CONCEPTS = new Set(["k-updown", "ace-hyperk", "k-hyperk", "spiro-se", "spiro-teach", "spiro-ci", "loop-se", "thz-se", "diur-teach", "k-po"]);

const SUFFIX_CONCEPTS = new Set(["htn-suffix", "htn-terms", "bb-select", "bz-moa"]);
const CLOT_CONCEPTS = new Set(["coag-classes", "ap-vs-ac", "tpa-moa", "ap-moa"]);
const RAAS: Record<string, "ace" | "receptor" | "aldosterone"> = { "ace-moa": "ace", "arb-moa": "receptor", "spiro-moa": "aldosterone" };
const NEPHRON: Record<string, "furosemide" | "hctz" | "mannitol"> = { "loop-moa": "furosemide", "thz-moa": "hctz", "mannitol-moa": "mannitol" };

/** Gauge for a lab question: the scale (course thresholds) + the value from the stem when unambiguous. */
export function gaugeFor(q: Question): Explainer | null {
  const stem = lc(q.stem);
  const text = questionText(q);
  let key: string | null = null;
  if (q.concept === "hep-lab") key = "aptt";
  else if (q.concept === "dig-lab") key = "digoxin";
  else if (q.concept === "war-lab") {
    if (!/\binr\b/.test(text)) return null;
    key = /valve|mechanical|prosthe/.test(stem) ? "inr-valve" : /\bpe\b|pulmonary embol/.test(stem) ? "inr-pe" : /fibrillation|a-fib|afib/.test(stem) ? "inr-afib" : null;
    if (!key) return null; // indication unknown → don't guess the target range
  } else if (q.concept === "ac-levels") {
    const hits = SCALES.filter((s) => s.concept === "ac-levels" && has(stem, s.drug));
    if (hits.length !== 1) return null;
    key = hits[0].key;
  }
  const s = SCALES.find((x) => x.key === key);
  if (!s) return null;
  // a stem quoting a DIFFERENT range (e.g. a lab report's printed range) → don't overlay the course scale
  const RANGE = /(\d+(?:\.\d+)?)\s*(?:–|-|to)\s*(\d+(?:\.\d+)?|_+)(?![\d.])(?!\s*(?:times|×))/g;
  for (const m of stem.matchAll(RANGE)) {
    if (/_/.test(m[2])) continue;
    if (Number(m[1]) !== s.low || Number(m[2]) !== s.high) return null;
  }
  const valueText = stem.includes("__") ? "" : stem.replace(RANGE, " ");
  // value: one unambiguous number tied to the lab in the stem
  const re = s.key === "aptt" ? /aptt[^0-9]{0,24}(\d{2,3}(?:\.\d+)?)/g : s.key.startsWith("inr") ? /inr[^0-9]{0,16}(\d+(?:\.\d+)?)/g : s.key === "digoxin" ? /(\d+(?:\.\d+)?)\s*ng\/ml/g : /(\d+(?:\.\d+)?)\s*mcg\/ml/g;
  const vals = [...valueText.matchAll(re)].map((m) => Number(m[1])).filter((v) => Number.isFinite(v) && v >= s.min && v <= s.max);
  const value = vals.length === 1 ? vals[0] : null;
  // digoxin: lecture range 0.5–0.8, > 2 toxic; study guides say 0.5–1.5 → never draw a needle in the 0.8–2.0 gray zone
  if (value !== null && s.key === "digoxin" && value > 0.8 && value <= 2) return null;
  if (value !== null && s.key === "digoxin" && value < s.low) return null;
  return {
    kind: "gauge",
    gauge: { lab: s.lab, drug: s.drug, unit: s.unit, min: s.min, max: s.max, low: s.low, high: s.high, value, context: s.context, zoneLabels: s.zoneLabels, meaning: s.meaning, action: s.action },
  };
}

export function suffixHits(q: Question) {
  const text = questionText(q);
  const answer = lc(correctAnswerText(q));
  const seen = new Set<string>();
  const hits: { name: string; family: string; suffix: string; correct: boolean }[] = [];
  for (const d of FAMILY_DRUGS) {
    if (seen.has(d.name) || !has(text, d.name)) continue;
    seen.add(d.name);
    hits.push({ name: d.name, family: d.family, suffix: d.suffix, correct: has(answer, d.name) });
  }
  return hits;
}

export function pickExplainer(q: Question): Explainer | null {
  const concept = CONCEPT_BY_ID[q.concept];
  const text = questionText(q);
  const answer = lc(correctAnswerText(q));

  if (q.type === "order" && q.items.length >= 3) return { kind: "timeline", steps: q.items };

  if (concept?.skill === "antidote" || q.format === "antidote") {
    const pairs = ANTIDOTES.filter((a) => a.concept === q.concept);
    if (pairs.length) return { kind: "antidote", pairs: pairs.slice(0, 2) };
  }

  if (concept?.skill === "lab") {
    const g = gaugeFor(q);
    if (g) return g;
  }

  if (concept?.skill === "hold") {
    const h = holdFor(q);
    if (h) return h;
  }

  const hits = suffixHits(q);
  const families = new Set(hits.map((h) => h.family));
  const suffixy = q.concept === "htn-suffix" || q.format === "class-id" || concept?.skill === "class" || SUFFIX_CONCEPTS.has(q.concept);
  if (hits.length && (suffixy || (families.size >= 2 && concept?.skill === "moa"))) return { kind: "suffix", drugs: hits.slice(0, 4) };

  if (RAAS[q.concept]) return { kind: "raas", target: RAAS[q.concept] };
  if (NEPHRON[q.concept]) return { kind: "nephron", drug: NEPHRON[q.concept] };

  if (CLOT_CONCEPTS.has(q.concept)) {
    const hl: ClotClass[] = [];
    if (/thrombolytic|alteplase|dissolve/.test(answer)) hl.push("thrombolytic");
    if (/antiplatelet|aspirin|clopidogrel/.test(answer)) hl.push("antiplatelet");
    if (/anticoagulant|heparin|warfarin|enoxaparin|dabigatran|rivaroxaban/.test(answer)) hl.push("anticoagulant");
    if (!hl.length) {
      const t = lc(q.stem);
      if (/alteplase|thrombolytic/.test(t)) hl.push("thrombolytic");
      if (/aspirin|clopidogrel|antiplatelet/.test(t)) hl.push("antiplatelet");
      if (/heparin|warfarin|enoxaparin|anticoagulant/.test(t)) hl.push("anticoagulant");
    }
    return { kind: "clot", highlight: hl };
  }

  if (K_CONCEPTS.has(q.concept) && /potassium|k\+|kalemia|salt substitute|banana/.test(text)) {
    const items = K_TABLE.filter((k) => k.aliases.some((a) => has(text, a))).map(({ label, dir, why }) => ({ label, dir, why }));
    if (items.length) return { kind: "potassium", items: items.slice(0, 4) };
  }

  if (concept?.skill === "se" || q.format === "side-effect") {
    const act = BODY.find((a) => a.concepts.includes(q.concept)) as ActivityOf<"body"> | undefined;
    if (act) return { kind: "body", act };
  }

  const set = CONTRASTS.find((c) => c.concept === q.concept);
  if (set) return { kind: "compare", set };

  return null;
}
