import type { DrugCard, Question } from "@/lib/types";
import { CONCEPT_BY_ID, DRUGS, NODE_BY_ID } from "@/data/curriculum";

/** Structural QA for question banks. Returns a list of human-readable problems (empty = OK). */
export function validateQuestions(qs: Question[]): string[] {
  const errs: string[] = [];
  const ids = new Set<string>();
  const stems = new Map<string, string>();
  for (const q of qs) {
    const where = `[${q.id}]`;
    if (!q.id) errs.push(`question without id: ${q.stem?.slice(0, 40)}`);
    if (ids.has(q.id)) errs.push(`${where} duplicate id`);
    ids.add(q.id);
    const concept = CONCEPT_BY_ID[q.concept];
    if (!concept) errs.push(`${where} unknown concept "${q.concept}"`);
    else if (concept.topic !== q.topic) errs.push(`${where} topic "${q.topic}" != concept topic "${concept.topic}"`);
    for (const d of q.drugs ?? []) if (!DRUGS[d]) errs.push(`${where} unknown drug id "${d}"`);
    if (!q.drugs || q.drugs.length === 0) errs.push(`${where} no drugs listed`);
    if (![1, 2, 3].includes(q.difficulty)) errs.push(`${where} bad difficulty`);
    if (!q.stem || q.stem.length < 10) errs.push(`${where} stem too short`);
    if (!q.why || q.why.length < 10) errs.push(`${where} missing why`);
    if (!q.source) errs.push(`${where} missing source`);
    const norm = q.stem.trim().toLowerCase();
    if (stems.has(norm)) errs.push(`${where} duplicate stem of ${stems.get(norm)}`);
    stems.set(norm, q.id);
    switch (q.type) {
      case "mcq": {
        if (q.options.length < 3 || q.options.length > 5) errs.push(`${where} mcq needs 3-5 options`);
        if (q.answer < 0 || q.answer >= q.options.length) errs.push(`${where} mcq answer out of range`);
        if (new Set(q.options.map((o) => o.trim().toLowerCase())).size !== q.options.length) errs.push(`${where} duplicate options`);
        if (q.options.some((o) => /all of the above|none of the above/i.test(o))) errs.push(`${where} uses all/none of the above`);
        break;
      }
      case "sata": {
        if (q.options.length < 4 || q.options.length > 7) errs.push(`${where} sata needs 4-7 options`);
        if (q.answers.length < 1) errs.push(`${where} sata needs answers`);
        if (q.answers.some((a) => a < 0 || a >= q.options.length)) errs.push(`${where} sata answer out of range`);
        if (new Set(q.answers).size !== q.answers.length) errs.push(`${where} sata duplicate answers`);
        if (!/select all/i.test(q.stem)) errs.push(`${where} sata stem should say "Select all that apply"`);
        if (new Set(q.options.map((o) => o.trim().toLowerCase())).size !== q.options.length) errs.push(`${where} duplicate options`);
        break;
      }
      case "tf":
        if (typeof q.answer !== "boolean") errs.push(`${where} tf answer must be boolean`);
        break;
      case "fill":
        if (!q.accept || q.accept.length === 0) errs.push(`${where} fill needs accept[]`);
        if (!q.stem.includes("____")) errs.push(`${where} fill stem needs ____`);
        if (q.numeric && Number.isNaN(Number(q.numeric.value))) errs.push(`${where} numeric value NaN`);
        break;
      case "match": {
        if (q.pairs.length < 3 || q.pairs.length > 6) errs.push(`${where} match needs 3-6 pairs`);
        const rights = q.pairs.map((p) => p[1].trim().toLowerCase());
        const lefts = q.pairs.map((p) => p[0].trim().toLowerCase());
        if (new Set(rights).size !== rights.length) errs.push(`${where} match right sides not unique`);
        if (new Set(lefts).size !== lefts.length) errs.push(`${where} match left sides not unique`);
        break;
      }
      case "order":
        if (q.items.length < 3 || q.items.length > 6) errs.push(`${where} order needs 3-6 items`);
        if (new Set(q.items).size !== q.items.length) errs.push(`${where} order items not unique`);
        break;
      default:
        errs.push(`${where} unknown type ${(q as { type: string }).type}`);
    }
  }
  return errs;
}

export function validateCards(cards: DrugCard[]): string[] {
  const errs: string[] = [];
  const ids = new Set<string>();
  for (const c of cards) {
    if (ids.has(c.id)) errs.push(`card ${c.id} duplicate`);
    ids.add(c.id);
    if (!NODE_BY_ID[c.node]) errs.push(`card ${c.id} unknown node ${c.node}`);
    else if (NODE_BY_ID[c.node].topic !== c.topic) errs.push(`card ${c.id} topic mismatch with node`);
    if (Object.keys(c.chunks).length < 3) errs.push(`card ${c.id} needs >= 3 chunks`);
    if (!c.source) errs.push(`card ${c.id} missing source`);
  }
  return errs;
}
