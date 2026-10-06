import type { DrugCard, Question } from "@/lib/types";
import { STATIC_QUESTIONS } from "./questions";
import { generateCalc, isCalcKind } from "./calc";
import { w5Cards } from "./cards/w5";
import { w6Cards } from "./cards/w6";
import { w7Cards } from "./cards/w7";
import { w8Cards } from "./cards/w8";
import { termCards } from "./cards/terms";
import { newSeed } from "@/lib/rng";
import { ANTIDOTES, ANTIDOTE_NAMES } from "./antidotes";
import { CONTRASTS } from "./contrasts";
import type { MCQQuestion } from "@/lib/types";

export const QUESTIONS = STATIC_QUESTIONS;

const BY_ID = new Map<string, Question>(QUESTIONS.map((q) => [q.id, q]));
const BY_CONCEPT = new Map<string, Question[]>();
for (const q of QUESTIONS) {
  const list = BY_CONCEPT.get(q.concept) ?? [];
  list.push(q);
  BY_CONCEPT.set(q.concept, list);
}

/** Look up any question id, including generated calculation ids ("calc-gtts-12345"). */
export function getQuestion(id: string): Question | undefined {
  const q = BY_ID.get(id);
  if (q) return q;
  const m = id.match(/^(calc-[a-z0-9]+)-(\d+)$/);
  if (m && isCalcKind(m[1])) return generateCalc(m[1], Number(m[2]));
  if (id.startsWith("arena-")) return antidoteQuestion(id.slice(6));
  if (id.startsWith("contrast-")) {
    const [setId, idx] = id.slice(9).split("~");
    return contrastQuestion(setId, Number(idx));
  }
  return undefined;
}

/** Antidote Arena item as a regular MCQ (deterministic distractors so it can be re-asked from the vault). */
export function antidoteQuestion(pairId: string): MCQQuestion | undefined {
  const p = ANTIDOTES.find((a) => a.id === pairId);
  if (!p) return undefined;
  const others = ANTIDOTE_NAMES.filter((n) => n !== p.antidote);
  let h = 0;
  for (const ch of pairId) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  const wrong = [0, 1, 2].map((i) => others[(h + i * 3) % others.length]);
  const uniq = Array.from(new Set(wrong));
  for (const o of others) if (uniq.length < 3 && !uniq.includes(o)) uniq.push(o);
  return {
    id: `arena-${p.id}`,
    type: "mcq",
    topic: p.topic,
    concept: p.concept,
    drugs: [],
    difficulty: 1,
    cognitive: "remember",
    format: "antidote",
    stem: `Antidote for: ${p.drug}?`,
    options: [p.antidote, ...uniq.slice(0, 3)],
    answer: 0,
    why: `${p.drug} → ${p.antidote}. ${p.note}`,
    source: p.source,
  };
}

export function contrastQuestion(setId: string, idx: number): MCQQuestion | undefined {
  const set = CONTRASTS.find((c) => c.id === setId);
  const item = set?.quiz[idx];
  if (!set || !item) return undefined;
  return {
    id: `contrast-${setId}~${idx}`,
    type: "mcq",
    topic: set.topic,
    concept: set.concept,
    drugs: [],
    difficulty: 2,
    cognitive: "analyze",
    format: "contrast",
    stem: item.q,
    options: set.columns,
    answer: item.answer,
    why: item.why,
    hook: set.takeaway,
    source: set.source,
  };
}

/** Candidate questions for a concept. Calculation concepts get fresh generated variants. */
export function questionsForConcept(conceptId: string, count = 4): Question[] {
  if (isCalcKind(conceptId)) return Array.from({ length: count }, () => generateCalc(conceptId, newSeed()));
  return BY_CONCEPT.get(conceptId) ?? [];
}

export const staticCountForConcept = (conceptId: string) => BY_CONCEPT.get(conceptId)?.length ?? 0;

export const CARDS: DrugCard[] = [...w5Cards, ...termCards, ...w6Cards, ...w7Cards, ...w8Cards];
export const cardsForNode = (node: string) => CARDS.filter((c) => c.node === node);
