import type { Concept, Question, QuestionType, WorldId } from "@/lib/types";
import { CONCEPTS, NODES, WORLDS, conceptsForNode, conceptsForWorld, CONCEPT_BY_ID } from "@/data/curriculum";
import { getQuestion, questionsForConcept } from "@/data/bank";
import { nextQuestion, pickQuestionForConcept, type QStat, type SelectCtx } from "./select";
import { effectiveMastery, weaknessScore, type ConceptStat } from "./mastery";
import { nodeProgress } from "./progress";
import { mulberry32, shuffle, type Rng } from "@/lib/rng";
import type { DailyMinutes, ExamResult, Mistake } from "@/lib/store";
import { EXAM_TYPES } from "./exam";
import type { Activity } from "@/lib/activities/types";
import { activitiesForConcepts, getActivity, isActivityId } from "@/data/activities";

export type Mode = "mission" | "continue" | "quick5" | "weak" | "node" | "world" | "boss" | "vault" | "similar" | "misses" | "highyield" | "focus";

export interface SessionConfig {
  mode: Mode;
  title: string;
  subtitle?: string;
  total: number;
  /** adaptive pool */
  pool: Concept[];
  /** optional focus pool used ~70% of the time (interleaving with the wider pool) */
  focus?: Concept[];
  /** fixed question ids served first (vault, similar) */
  fixed?: string[];
  types?: QuestionType[];
  minDifficulty?: number;
  hearts?: number;
  bossId?: string;
  worldId?: WorldId;
  /** probability of asking "How confident were you?" */
  confidenceRate: number;
  mix?: [number, number, number, number];
  emptyMessage?: string;
  /** soft preference for question formats in this slot (composer) */
  prefer?: QuestionType[];
  /** learning modes interleave visual/interactive activities with questions (never the exam or bosses) */
  visual?: boolean;
}

/** A session item: a question or an interactive activity. */
export type Item = { kind: "q"; q: Question } | { kind: "a"; a: Activity };

/**
 * Session composer: varies the interaction type so learning sessions never become a run of plain MCQs.
 * Per 10 slots: 4 interactive activities, 6 questions with rotating format preferences + a hard closer.
 */
export function slotPlan(i: number): { kind: "q" | "a"; prefer?: QuestionType[]; minDifficulty?: number } {
  switch (i % 10) {
    case 1:
    case 3:
    case 6:
    case 8:
      return { kind: "a" };
    case 2:
      return { kind: "q", prefer: ["sata", "match", "order", "fill", "tf"] };
    case 4:
      return { kind: "q", prefer: ["sata", "fill"] };
    case 7:
      return { kind: "q", prefer: ["match", "order", "tf", "fill"] };
    case 9:
      return { kind: "q", minDifficulty: 3 };
    default:
      return { kind: "q" };
  }
}

export const MISSION_QUESTIONS: Record<DailyMinutes, number> = { 5: 7, 10: 14, 20: 26, 30: 38 };

export function missionPlan(minutes: DailyMinutes) {
  const q = MISSION_QUESTIONS[minutes] ?? 14;
  return { questions: q, minutes, xp: q * 10 + 25 };
}

export interface BuildArgs {
  mode: Mode;
  node?: string;
  world?: WorldId;
  concept?: string;
  qid?: string;
  stats: Record<string, ConceptStat>;
  mistakes: Record<string, Mistake>;
  exams: ExamResult[];
  dailyMinutes: DailyMinutes;
  now: number;
  /** concept ids for "focus" mode (e.g. tapped from the progress heatmap) */
  concepts?: string[];
  /** onboarding self-rating: "almost" ready learners get harder, application-heavy missions from the start */
  startConfidence?: "not" | "somewhat" | "almost";
}

/** A node is "cleared" on the quest path once every concept has been met and the node averages Learning (≥30). */
export const nodeCleared = (stats: Record<string, ConceptStat>, node: string, now: number) => {
  const p = nodeProgress(stats, node, now);
  return p.seen === p.total && p.avg >= 30;
};

/**
 * The next node on the quest path: the first node (in world order) that isn't cleared yet.
 * Once the whole path is cleared, the weakest node becomes "up next".
 */
export function currentNode(stats: Record<string, ConceptStat>, now: number) {
  const order: WorldId[] = ["w5", "w6", "w7", "w8", "w1"];
  const nodes = order.flatMap((w) => NODES.filter((n) => n.world === w));
  const next = nodes.find((n) => !nodeCleared(stats, n.id, now));
  if (next) return next;
  return nodes.reduce((a, b) => (nodeProgress(stats, a.id, now).avg <= nodeProgress(stats, b.id, now).avg ? a : b));
}

export function rankWeakConcepts(stats: Record<string, ConceptStat>, mistakes: Record<string, Mistake>, now: number, pool: Concept[] = CONCEPTS) {
  const open: Record<string, number> = {};
  for (const m of Object.values(mistakes)) if (!m.resolved) open[m.concept] = (open[m.concept] ?? 0) + 1;
  return pool
    .map((c) => ({ concept: c, score: weaknessScore(stats[c.id], now, open[c.id] ?? 0), mastery: effectiveMastery(stats[c.id], now), seen: stats[c.id]?.seen ?? 0 }))
    .sort((a, b) => b.score - a.score);
}

export function buildSession(a: BuildArgs): SessionConfig {
  const base = { confidenceRate: 0.4, visual: true };
  switch (a.mode) {
    case "mission": {
      const plan = missionPlan(a.dailyMinutes);
      const almost = a.startConfidence === "almost";
      return {
        ...base,
        mode: "mission",
        title: "Today's Mission",
        subtitle: `${plan.questions} questions · adaptive mix`,
        total: plan.questions,
        pool: CONCEPTS,
        // self-rated "almost ready" → skip the easiest recall items so mastery reflects application
        minDifficulty: almost ? 2 : undefined,
      };
    }
    case "quick5":
      return { ...base, mode: "quick5", title: "Quick 5", subtitle: "Five fast retrievals", total: 5, pool: CONCEPTS };
    case "continue": {
      const node = currentNode(a.stats, a.now);
      const world = WORLDS.find((w) => w.id === node.world)!;
      return {
        ...base,
        mode: "continue",
        title: node.title,
        subtitle: `World ${world.num} · ${world.title}`,
        total: 10,
        focus: conceptsForNode(node.id),
        pool: conceptsForWorld(node.world),
        worldId: node.world,
      };
    }
    case "node": {
      const node = NODES.find((n) => n.id === a.node) ?? NODES[0];
      const world = WORLDS.find((w) => w.id === node.world)!;
      return {
        ...base,
        mode: "node",
        title: node.title,
        subtitle: `World ${world.num} · ${world.title}`,
        total: 10,
        focus: conceptsForNode(node.id),
        pool: conceptsForWorld(node.world),
        worldId: node.world,
      };
    }
    case "world": {
      const world = WORLDS.find((w) => w.id === a.world) ?? WORLDS[0];
      return { ...base, mode: "world", title: world.title, subtitle: `World ${world.num} mixed practice`, total: 12, pool: conceptsForWorld(world.id), worldId: world.id };
    }
    case "boss": {
      const world = WORLDS.find((w) => w.id === a.world) ?? WORLDS[0];
      return {
        mode: "boss",
        title: world.boss?.name ?? "Boss",
        subtitle: world.boss?.tagline,
        total: 10,
        pool: conceptsForWorld(world.id),
        hearts: 3,
        bossId: world.boss?.id,
        worldId: world.id,
        minDifficulty: 2,
        types: [...EXAM_TYPES, "match"],
        confidenceRate: 0,
        visual: false,
        mix: [0.3, 0.3, 0.2, 0.2],
      };
    }
    case "weak": {
      const ranked = rankWeakConcepts(a.stats, a.mistakes, a.now);
      const attempted = ranked.filter((r) => r.seen > 0);
      const top = (attempted.length >= 4 ? attempted : ranked).slice(0, 8).map((r) => r.concept);
      return { ...base, mode: "weak", title: "Fix My Weak Spots", subtitle: "Your 8 weakest concepts", total: 10, pool: top, confidenceRate: 0.5, mix: [0.6, 0.25, 0.15, 0] };
    }
    case "vault": {
      if (a.qid && (getQuestion(a.qid) || getActivity(a.qid))) {
        const m = a.mistakes[a.qid];
        const c = m ? CONCEPT_BY_ID[m.concept] : undefined;
        return { ...base, visual: false, mode: "vault", title: "Mistake Vault", subtitle: "Retry", total: 1, fixed: [a.qid], pool: c ? [c] : [] };
      }
      const open = Object.values(a.mistakes)
        .filter((m) => !m.resolved && (getQuestion(m.qid) || getActivity(m.qid)))
        .sort((x, y) => y.misses - x.misses || y.at - x.at)
        .slice(0, 10);
      return {
        ...base,
        mode: "vault",
        visual: false,
        title: "Mistake Vault",
        subtitle: "Retry what you missed",
        total: open.length,
        fixed: open.map((m) => m.qid),
        pool: open.map((m) => CONCEPT_BY_ID[m.concept]).filter(Boolean),
        emptyMessage: "Your vault is empty — nothing to retry. Nice.",
      };
    }
    case "similar": {
      const c = CONCEPT_BY_ID[a.concept ?? ""];
      const others = c ? questionsForConcept(c.id).filter((q) => q.id !== a.qid) : [];
      const fixed = shuffle(others).slice(0, 3).map((q) => q.id);
      return { ...base, visual: false, mode: "similar", title: "Practice Similar", subtitle: c?.label, total: fixed.length, fixed, pool: c ? [c] : [], emptyMessage: "No similar questions available for this concept yet." };
    }
    case "misses": {
      const last = a.exams[0];
      const missed = last ? Array.from(new Set(last.items.filter((i) => !i.ok).map((i) => i.c))) : [];
      const pool = missed.map((id) => CONCEPT_BY_ID[id]).filter(Boolean);
      return {
        ...base,
        mode: "misses",
        title: "Study My Misses",
        subtitle: `${pool.length} concepts from your last exam`,
        total: Math.min(15, Math.max(5, pool.length * 2)),
        pool,
        confidenceRate: 0.5,
        mix: [0.7, 0.2, 0.1, 0],
        emptyMessage: "No missed concepts from your last exam. Take the Exam Simulator first.",
      };
    }
    case "highyield": {
      const pool = CONCEPTS.filter((c) => c.highYield);
      return { ...base, visual: false, mode: "highyield", title: "High-Yield Sprint", subtitle: "Antidotes · holds · labs · priorities", total: 10, pool, types: EXAM_TYPES };
    }
    case "focus": {
      const pool = (a.concepts ?? []).map((id) => CONCEPT_BY_ID[id]).filter(Boolean);
      return { ...base, mode: "focus", title: "Focused practice", subtitle: `${pool.length} concept${pool.length === 1 ? "" : "s"} from your map`, total: pool.length ? 8 : 0, pool, confidenceRate: 0.5, mix: [0.6, 0.3, 0.1, 0], emptyMessage: "Nothing selected to practice." };
    }
  }
}

/** Runtime: decides the next question for a live session. */
export interface RuntimeState {
  served: string[]; // question ids served this session
  servedConcepts: string[];
  requeue: { concept: string; at: number }[]; // concept to revisit when served.length >= at
  fixedIdx: number;
  lastType?: QuestionType;
  /** activity template keys / kinds already used this session */
  actKeys: string[];
  actKinds: string[];
}

export const newRuntime = (): RuntimeState => ({ served: [], servedConcepts: [], requeue: [], fixedIdx: 0, actKeys: [], actKinds: [] });

const actKey = (id: string) => id.replace(/:\d+$/, "");

/** Pick an interactive activity for the current pool (weak concepts + unused interaction kinds first). */
export function pickActivity(cfg: SessionConfig, rt: RuntimeState, stats: Record<string, ConceptStat>, recentGlobal: string[], now: number, rng: Rng): Activity | undefined {
  const pools = cfg.focus && cfg.focus.length && rng() < 0.7 ? [cfg.focus, cfg.pool] : [cfg.pool];
  const recent = new Set(recentGlobal.slice(-30).map(actKey));
  for (const pool of pools) {
    const cands = activitiesForConcepts(pool, rng).filter((a) => !rt.actKeys.includes(actKey(a.id)) && !recent.has(actKey(a.id)));
    if (!cands.length) continue;
    const weights = cands.map((a) => {
      const m = effectiveMastery(stats[a.concepts[0]], now);
      let w = 1 + (100 - m) / 40;
      if (!rt.actKinds.includes(a.kind)) w *= 3;
      return w;
    });
    const total = weights.reduce((x, y) => x + y, 0);
    let r = rng() * total;
    for (let i = 0; i < cands.length; i++) {
      r -= weights[i];
      if (r <= 0) return cands[i];
    }
    return cands[cands.length - 1];
  }
  return undefined;
}

/** Next item (question or interactive activity) for a live session; records it in the runtime. */
export function nextItem(
  cfg: SessionConfig,
  rt: RuntimeState,
  stats: Record<string, ConceptStat>,
  qstats: Record<string, QStat>,
  recentGlobal: string[],
  now: number,
  rng: Rng = mulberry32(Math.floor(Math.random() * 2 ** 31)),
  mistakeCount?: Record<string, number>,
): Item | undefined {
  const mark = (it: Item): Item => {
    if (it.kind === "q") {
      rt.served.push(it.q.id);
      rt.servedConcepts.push(it.q.concept);
      rt.lastType = it.q.type;
    } else {
      rt.served.push(it.a.id);
      rt.servedConcepts.push(it.a.concepts[0]);
      rt.actKeys.push(actKey(it.a.id));
      rt.actKinds.push(it.a.kind);
    }
    return it;
  };
  // the fixed queue (Mistake Vault) may contain activities
  if (cfg.fixed && rt.fixedIdx < cfg.fixed.length && isActivityId(cfg.fixed[rt.fixedIdx])) {
    const a = getActivity(cfg.fixed[rt.fixedIdx]);
    rt.fixedIdx += 1;
    if (a) return mark({ kind: "a", a });
  }
  const slot = slotPlan(rt.served.length);
  const dueRequeue = rt.requeue.some((r) => rt.served.length >= r.at);
  const fixedLeft = !!cfg.fixed && rt.fixedIdx < cfg.fixed.length;
  if (cfg.visual && slot.kind === "a" && !dueRequeue && !fixedLeft) {
    const a = pickActivity(cfg, rt, stats, recentGlobal, now, rng);
    if (a) return mark({ kind: "a", a });
  }
  const qcfg = cfg.visual && slot.kind === "q" ? { ...cfg, minDifficulty: cfg.minDifficulty ?? slot.minDifficulty, prefer: slot.prefer } : cfg;
  const q = nextForSession(qcfg, rt, stats, qstats, recentGlobal, now, rng, mistakeCount);
  return q ? mark({ kind: "q", q }) : undefined;
}

export function nextForSession(
  cfg: SessionConfig,
  rt: RuntimeState,
  stats: Record<string, ConceptStat>,
  qstats: Record<string, QStat>,
  recentGlobal: string[],
  now: number,
  rng: Rng = mulberry32(Math.floor(Math.random() * 2 ** 31)),
  mistakeCount?: Record<string, number>,
): Question | undefined {
  // 1) fixed queue
  if (cfg.fixed && rt.fixedIdx < cfg.fixed.length) {
    const q = getQuestion(cfg.fixed[rt.fixedIdx]);
    rt.fixedIdx += 1;
    if (q) return q;
  }
  if (cfg.fixed && cfg.pool.length === 0) return undefined;

  const ctxBase: SelectCtx = {
    pool: cfg.pool,
    stats,
    qstats,
    mistakeCount,
    recentQ: [...recentGlobal.slice(-40), ...rt.served],
    recentConcepts: rt.servedConcepts,
    now,
    rng,
    types: cfg.types,
    minDifficulty: cfg.minDifficulty,
    lastType: rt.lastType,
    mix: cfg.mix,
    preferTypes: cfg.prefer,
  };
  const servedSet = new Set(rt.served);

  // 2) re-queued concept (missed earlier in this session) — test it again in a different form
  const dueIdx = rt.requeue.findIndex((r) => rt.served.length >= r.at);
  if (dueIdx >= 0) {
    const r = rt.requeue.splice(dueIdx, 1)[0];
    const c = CONCEPT_BY_ID[r.concept];
    if (c) {
      const q = pickQuestionForConcept(c, ctxBase, servedSet);
      if (q && !servedSet.has(q.id)) return q;
    }
  }

  // 3) adaptive pick (focus pool ~70% for interleaving)
  const useFocus = cfg.focus && cfg.focus.length && rng() < 0.7;
  const pool = useFocus ? cfg.focus! : cfg.pool;
  for (let i = 0; i < 6; i++) {
    const q = nextQuestion({ ...ctxBase, pool });
    if (q && !servedSet.has(q.id)) return q;
  }
  return nextQuestion({ ...ctxBase, pool: cfg.pool });
}
