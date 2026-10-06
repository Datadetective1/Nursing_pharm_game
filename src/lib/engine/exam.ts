import type { Question, QuestionType } from "@/lib/types";
import { TOPICS } from "@/data/curriculum";
import { QUESTIONS } from "@/data/bank";
import { CALC_KINDS, generateCalc } from "@/data/calc";
import { isApplication } from "./mastery";
import { shuffle, type Rng } from "@/lib/rng";

/** Formats used on the real Exam 2 (per blueprint). */
export const EXAM_TYPES: QuestionType[] = ["mcq", "sata", "fill", "tf"];
const TYPE_TARGET: Record<string, number> = { mcq: 0.52, sata: 0.2, fill: 0.14, tf: 0.14 };

/**
 * Builds a 50-question simulated Exam 2 following the blueprint distribution (TOPICS[].examCount),
 * spreading items across concepts, mixing formats, and favoring application-level items (~70%, as the blueprint does).
 */
export function buildExam(rng: Rng): Question[] {
  const out: Question[] = [];
  const used = new Set<string>();
  const typeCount: Record<string, number> = { mcq: 0, sata: 0, fill: 0, tf: 0 };

  for (const t of TOPICS) {
    if (t.id === "calc") {
      const kinds = shuffle(CALC_KINDS.map((k) => k.id), rng).slice(0, t.examCount);
      for (const k of kinds) {
        const q = generateCalc(k, Math.floor(rng() * 2 ** 31));
        out.push(q);
        typeCount[q.type] = (typeCount[q.type] ?? 0) + 1;
      }
      continue;
    }
    const pool = QUESTIONS.filter((q) => q.topic === t.id && EXAM_TYPES.includes(q.type));
    const concepts = shuffle(Array.from(new Set(pool.map((q) => q.concept))), rng);
    for (let i = 0; i < t.examCount && concepts.length; i++) {
      const concept = concepts[i % concepts.length];
      let cands = pool.filter((q) => q.concept === concept && !used.has(q.id));
      if (!cands.length) cands = pool.filter((q) => !used.has(q.id));
      if (!cands.length) break;
      const n = out.length + 1;
      const desired = (Object.keys(TYPE_TARGET) as QuestionType[]).sort(
        (a, b) => (typeCount[a] - TYPE_TARGET[a] * n) - (typeCount[b] - TYPE_TARGET[b] * n),
      );
      // the blueprint is application-heavy (most content areas list more A than R/U items)
      const wantApp = rng() < 0.7;
      let pick: Question | undefined;
      // first pass: the wanted cognitive level in the most-needed format; second pass: any level
      for (const strict of [true, false]) {
        for (const ty of desired) {
          const byType = cands.filter((q) => q.type === ty);
          if (!byType.length) continue;
          const byCog = byType.filter((q) => isApplication(q.cognitive, q.difficulty) === wantApp);
          if (strict && !byCog.length) continue;
          const list = byCog.length ? byCog : byType;
          pick = list[Math.floor(rng() * list.length)];
          break;
        }
        if (pick) break;
      }
      pick = pick ?? cands[Math.floor(rng() * cands.length)];
      used.add(pick.id);
      out.push(pick);
      typeCount[pick.type] = (typeCount[pick.type] ?? 0) + 1;
    }
  }
  return shuffle(out, rng);
}
