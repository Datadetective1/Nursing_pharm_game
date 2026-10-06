import type { Concept, Question, QuestionType } from "@/lib/types";
import { TOPIC_BY_ID } from "@/data/curriculum";
import { questionsForConcept } from "@/data/bank";
import { effectiveMastery, type ConceptStat } from "./mastery";
import type { Rng } from "@/lib/rng";
import { bandFor, questionLevel, type Level } from "./learning";

export interface QStat {
  seen: number;
  correct: number;
  last: number;
  lastCorrect: boolean;
}

export interface SelectCtx {
  pool: Concept[];
  stats: Record<string, ConceptStat>;
  qstats: Record<string, QStat>;
  /** open mistake count per concept */
  mistakeCount?: Record<string, number>;
  /** question ids to avoid (recently seen) */
  recentQ: string[];
  /** concept ids picked recently in this session (avoid immediate repeats) */
  recentConcepts: string[];
  now: number;
  rng: Rng;
  types?: QuestionType[];
  /** raise difficulty floor (boss battles) */
  minDifficulty?: number;
  /** soft preference for question formats (session composer) */
  preferTypes?: QuestionType[];
  /** last question type served (for variety) */
  lastType?: QuestionType;
  /** bucket weights [weak, medium, review, mastered]; default 50/25/15/10 */
  mix?: [number, number, number, number];
  /** learner scaffold level per concept (1–6): picks items from the matching level band */
  levels?: Record<string, Level>;
  /** explicit item-level band for this pick (overrides levels) */
  band?: Level[];
  /** drug-level study: prefer questions about these drugs */
  drugIds?: string[];
}

export type Bucket = "weak" | "medium" | "review" | "mastered";
export const DEFAULT_MIX: [number, number, number, number] = [0.5, 0.25, 0.15, 0.1];

export function bucketOf(c: Concept, s: ConceptStat | undefined, now: number): Bucket {
  if (!s || s.seen === 0) return "weak"; // new material is introduced through the "weak" lane
  const e = effectiveMastery(s, now);
  if (now >= s.due && s.box > 0) return "review";
  if (e >= 80) return "mastered";
  if (e < 30) return "weak";
  return "medium";
}

function weightedPick<T>(items: T[], weight: (t: T) => number, rng: Rng): T | undefined {
  const ws = items.map((t) => Math.max(0, weight(t)));
  const total = ws.reduce((a, b) => a + b, 0);
  if (total <= 0) return items[Math.floor(rng() * items.length)];
  let x = rng() * total;
  for (let i = 0; i < items.length; i++) {
    x -= ws[i];
    if (x <= 0) return items[i];
  }
  return items[items.length - 1];
}

/** Picks the next concept: roll a bucket (50/25/15/10), then weight by blueprint emphasis + need. */
export function pickConcept(ctx: SelectCtx): Concept | undefined {
  const { pool, stats, now, rng } = ctx;
  if (pool.length === 0) return undefined;
  const avoid = new Set(ctx.recentConcepts.slice(-2));
  const candidates = pool.length > 2 ? pool.filter((c) => !avoid.has(c.id)) : pool;

  const buckets: Record<Bucket, Concept[]> = { weak: [], medium: [], review: [], mastered: [] };
  for (const c of candidates) buckets[bucketOf(c, stats[c.id], now)].push(c);

  const mix = ctx.mix ?? DEFAULT_MIX;
  const order: Bucket[] = ["weak", "medium", "review", "mastered"];
  let roll = rng();
  let chosen: Bucket = "weak";
  for (let i = 0; i < order.length; i++) {
    roll -= mix[i];
    if (roll <= 0) {
      chosen = order[i];
      break;
    }
  }
  const fallback: Bucket[] = [chosen, "weak", "review", "medium", "mastered"];
  const bucket = fallback.find((b) => buckets[b].length > 0)!;

  // Topic weight = blueprint exam share spread across that topic's concepts in the pool.
  const perTopic: Record<string, number> = {};
  for (const c of candidates) perTopic[c.topic] = (perTopic[c.topic] ?? 0) + 1;

  return weightedPick(
    buckets[bucket],
    (c) => {
      const s = stats[c.id];
      const t = TOPIC_BY_ID[c.topic];
      const blueprint = (t?.examCount ?? 3) / Math.sqrt(perTopic[c.topic] ?? 1);
      const e = effectiveMastery(s, now);
      let need = 1 + (100 - e) / 50; // 1..3
      if (s?.confWrong) need += 0.5 * s.confWrong;
      if (ctx.mistakeCount?.[c.id]) need += 0.5 * ctx.mistakeCount[c.id];
      if (bucket === "review" && s) need += Math.min(2, (now - s.due) / 3_600_000 / 12);
      if (c.highYield) need *= 1.25;
      return blueprint * need;
    },
    rng,
  );
}

/** Desirable difficulty: target harder items as mastery grows. */
export function targetDifficulty(s: ConceptStat | undefined, now: number) {
  const e = effectiveMastery(s, now);
  if (!s || s.seen === 0) return 1;
  if (e < 30) return 1.5;
  if (e < 60) return 2;
  return 3;
}

export function pickQuestionForConcept(c: Concept, ctx: SelectCtx, exclude?: Set<string>): Question | undefined {
  let qs = questionsForConcept(c.id);
  if (ctx.types) qs = qs.filter((q) => ctx.types!.includes(q.type));
  if (ctx.drugIds?.length) {
    // single-drug study: stay on that drug (class-level items with no other drug still qualify)
    const about = qs.filter((q) => q.drugs.some((d) => ctx.drugIds!.includes(d)));
    if (about.length) qs = about;
  }
  // scaffolding: serve items from the learner's level band (best band first, nearest fallback)
  const band = ctx.band ?? (ctx.levels?.[c.id] ? bandFor(ctx.levels[c.id]) : undefined);
  if (band && !c.id.startsWith("calc-")) {
    for (const lv of band) {
      const at = qs.filter((q) => questionLevel(q) === lv);
      if (at.length) {
        qs = at;
        break;
      }
    }
  }
  if (ctx.minDifficulty) {
    const hard = qs.filter((q) => q.difficulty >= ctx.minDifficulty!);
    if (hard.length) qs = hard;
  }
  if (ctx.preferTypes) {
    const pref = qs.filter((q) => ctx.preferTypes!.includes(q.type));
    if (pref.length) qs = pref;
  }
  if (exclude) {
    const fresh = qs.filter((q) => !exclude.has(q.id));
    if (fresh.length) qs = fresh;
  }
  if (qs.length === 0) return undefined;
  const recent = new Set(ctx.recentQ);
  const notRecent = qs.filter((q) => !recent.has(q.id));
  if (notRecent.length) qs = notRecent;
  const target = targetDifficulty(ctx.stats[c.id], ctx.now);
  return weightedPick(
    qs,
    (q) => {
      const st = ctx.qstats[q.id];
      let w = 4 - Math.abs(q.difficulty - target) * 1.5;
      if (!st) w += 1.5; // unseen question → test the concept in a new context
      else {
        w -= Math.min(2, st.seen * 0.5);
        if (!st.lastCorrect) w += 1; // retry a missed item occasionally
      }
      if (ctx.lastType && q.type === ctx.lastType) w -= 1;
      return Math.max(0.2, w);
    },
    ctx.rng,
  );
}

export function nextQuestion(ctx: SelectCtx): Question | undefined {
  for (let tries = 0; tries < 8; tries++) {
    const c = pickConcept(ctx);
    if (!c) return undefined;
    const q = pickQuestionForConcept(c, ctx);
    if (q) return q;
    ctx = { ...ctx, pool: ctx.pool.filter((p) => p.id !== c.id) };
  }
  return undefined;
}
