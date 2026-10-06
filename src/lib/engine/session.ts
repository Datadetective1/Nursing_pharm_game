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
import { bandFor, isGuidedLevel, isTaught, needsRelearn, questionLevel, type LearnStat, type Level } from "./learning";
import { microLesson } from "@/data/lessons";
import type { LessonStep } from "@/lib/lessons/types";
import { resolveSelection, type Selection } from "@/data/library";

export type Mode =
  | "mission"
  | "continue"
  | "quick5"
  | "weak"
  | "node"
  | "world"
  | "boss"
  | "vault"
  | "similar"
  | "misses"
  | "highyield"
  | "focus"
  /** Drug Library: scaffolded practice on a chosen module / drug type / drug */
  | "practice"
  /** Drug Library: independent exam-style assessment (no hints, no teaching first) */
  | "test"
  /** Drug Library: "Already know this? Test out." short diagnostic */
  | "pretest";

/** Modes that measure knowledge on purpose — they never teach before asking. */
export const ASSESSMENT_MODES: Mode[] = ["boss", "test", "pretest"];

/** Session length choices in the Drug Library ("Master it" runs until the selection is practiced to level 5). */
export type Minutes = 5 | 10 | 20 | "master";
export const PRACTICE_ITEMS: Record<string, number> = { 5: 6, 10: 12, 20: 24, master: 40 };
export const TEST_ITEMS: Record<string, number> = { 5: 6, 10: 10, 20: 20, master: 30 };

/** A scripted slot (Continue Quest's smart path). */
export type ScriptSlot = { t: "teach"; c: string; how?: "exposed" | "relearn" } | { t: "q"; c: string; band?: Level[] } | { t: "a"; concepts: string[] };

export interface SessionConfig {
  mode: Mode;
  title: string;
  subtitle?: string;
  total: number;
  /** adaptive pool */
  pool: Concept[];
  /** optional focus pool used ~70% of the time (interleaving with the wider pool) */
  focus?: Concept[];
  /** fixed question ids served first (vault, similar, test, pretest) */
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
  /** first-exposure detection: teach a concept before its first question (off in assessment modes) */
  teachFirst?: boolean;
  /** pick question difficulty from the learner's scaffold level (1–6) */
  scaffold?: boolean;
  /** guided items (levels 1–2) get hints + a safe retry */
  hints?: boolean;
  /** drug-level study: prefer questions about these drugs */
  drugIds?: string[];
  /** activities must be ABOUT the pool (primary concept in pool), not merely touch it */
  strictPool?: boolean;
  /** Drug Library selection this session belongs to (for stage tracking) */
  sel?: Selection;
  /** "Master it": finish early once every pool concept is at scaffold level ≥ 5 */
  masterIt?: boolean;
  /** Continue Quest's scripted path (teach → guided → visual → retrieval → application) */
  script?: ScriptSlot[];
  /** teach these concepts before anything else (Weak Spots relearn) */
  preTeach?: { c: string; how: "exposed" | "relearn" }[];
  /** short label for what this session is doing (Continue Quest) */
  plan?: string;
}

/** A session item: a question, an interactive activity, or a micro-lesson (teach before test). */
export type Item =
  | { kind: "q"; q: Question; guided?: boolean }
  | { kind: "a"; a: Activity }
  | { kind: "teach"; concept: string; steps: LessonStep[]; lessonTitle: string; unit: string; how: "exposed" | "relearn" };

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
  /** knowledge state (v2). Absent → nothing counts as taught. */
  learn?: Record<string, LearnStat>;
  /** Drug Library selection for practice / test / pretest */
  sel?: Selection;
  minutes?: Minutes;
  /** deterministic seed for fixed test lists (tests) */
  seed?: number;
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

const openByConcept = (mistakes: Record<string, Mistake>) => {
  const open: Record<string, number> = {};
  const misses: Record<string, number> = {};
  for (const m of Object.values(mistakes)) {
    if (m.resolved) continue;
    open[m.concept] = (open[m.concept] ?? 0) + 1;
    misses[m.concept] = Math.max(misses[m.concept] ?? 0, m.misses);
  }
  return { open, misses };
};

/** Concepts that repeated misses say should be RELEARNED before more questions. */
export function relearnConcepts(stats: Record<string, ConceptStat>, mistakes: Record<string, Mistake>, pool: Concept[] = CONCEPTS): string[] {
  const { open, misses } = openByConcept(mistakes);
  return pool.filter((c) => needsRelearn(c.id, open, misses[c.id] ?? 0, stats[c.id])).map((c) => c.id);
}

/**
 * Continue Quest's smart path. Decides what the learner needs next:
 *   weak-spot remediation (relearn) → new teaching → guided practice → visual reinforcement →
 *   retrieval → application, with a spaced review mixed in. Returns undefined when the current node
 *   has nothing new to teach (the adaptive engine then handles practice / review / testing).
 */
export function continuePlan(nodeId: string, world: WorldId, stats: Record<string, ConceptStat>, learn: Record<string, LearnStat>, mistakes: Record<string, Mistake>, now: number): { script: ScriptSlot[]; plan: string } | undefined {
  const nodeConcepts = conceptsForNode(nodeId);
  const fresh = nodeConcepts.filter((c) => !isTaught(learn[c.id])).slice(0, 2);
  const worldPool = conceptsForWorld(world);
  const relearn = relearnConcepts(stats, mistakes, worldPool).filter((c) => isTaught(learn[c]))[0];
  if (!fresh.length && !relearn) return undefined;
  const script: ScriptSlot[] = [];
  if (relearn) script.push({ t: "teach", c: relearn, how: "relearn" }, { t: "q", c: relearn, band: [2, 3] });
  for (const c of fresh) script.push({ t: "teach", c: c.id }, { t: "q", c: c.id, band: [2] }, { t: "q", c: c.id, band: [2, 3] });
  if (fresh.length) script.push({ t: "a", concepts: [...fresh.map((c) => c.id), ...nodeConcepts.filter((c) => isTaught(learn[c.id])).map((c) => c.id)] });
  // one spaced review of something taught and due
  const due = worldPool.find((c) => isTaught(learn[c.id]) && stats[c.id] && stats[c.id].box > 0 && now >= stats[c.id].due && !fresh.includes(c));
  if (due) script.push({ t: "q", c: due.id });
  for (const c of fresh) script.push({ t: "q", c: c.id, band: [3, 2] });
  const applyTarget = fresh[0]?.id ?? relearn;
  if (applyTarget) script.push({ t: "q", c: applyTarget, band: [4, 5, 3] });
  const plan = relearn && !fresh.length ? `Relearn · ${CONCEPT_BY_ID[relearn]?.label ?? ""}` : `New lesson · ${fresh.map((c) => CONCEPT_BY_ID[c.id].label.split(/[:(;]/)[0].trim()).join(" + ")}`;
  return { script, plan };
}

/** Deterministic exam-format question list across a set of concepts (Test / Test-out). */
function fixedAssessment(concepts: string[], n: number, drugIds: string[] | undefined, rng: Rng, prefer: Level[]): string[] {
  const ids: string[] = [];
  const order = shuffle(concepts, rng);
  const used = new Set<string>();
  for (let round = 0; ids.length < n && round < 6; round++) {
    let added = false;
    for (const c of order) {
      if (ids.length >= n) break;
      let qs = questionsForConcept(c).filter((q) => EXAM_TYPES.includes(q.type) && !used.has(q.id));
      if (drugIds?.length) {
        const about = qs.filter((q) => q.drugs.some((d) => drugIds.includes(d)));
        if (about.length) qs = about;
      }
      if (!qs.length) continue;
      const pref = qs.filter((q) => prefer.includes(questionLevel(q)));
      let pool = pref.length ? pref : qs;
      // rotate formats like the real exam (MCQ, SATA, fill-in, true/false): prefer the least-used format so far
      const typeUsed = (t: QuestionType) => ids.filter((id) => getQuestion(id)?.type === t).length;
      const least = Math.min(...pool.map((q) => typeUsed(q.type)));
      pool = pool.filter((q) => typeUsed(q.type) === least);
      const q = pool[Math.floor(rng() * pool.length)];
      ids.push(q.id);
      used.add(q.id);
      added = true;
    }
    if (!added) break;
  }
  return shuffle(ids, rng);
}

export function buildSession(a: BuildArgs): SessionConfig {
  const learn = a.learn ?? {};
  const base = { confidenceRate: 0.4, visual: true, teachFirst: true, scaffold: true, hints: true };
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
    case "quick5": {
      // Quick 5 = fast RETRIEVAL → draw from what has been taught once there's enough of it
      const taught = CONCEPTS.filter((c) => isTaught(learn[c.id]));
      return { ...base, mode: "quick5", title: "Quick 5", subtitle: "Five fast retrievals", total: 5, pool: taught.length >= 5 ? taught : CONCEPTS };
    }
    case "continue": {
      const node = currentNode(a.stats, a.now);
      const world = WORLDS.find((w) => w.id === node.world)!;
      const smart = node.world !== "w1" ? continuePlan(node.id, node.world, a.stats, learn, a.mistakes, a.now) : undefined;
      const items = smart ? smart.script.filter((s) => s.t !== "teach").length : 10;
      return {
        ...base,
        mode: "continue",
        title: node.title,
        subtitle: `World ${world.num} · ${world.title}`,
        total: items,
        focus: conceptsForNode(node.id),
        pool: conceptsForWorld(node.world),
        worldId: node.world,
        script: smart?.script,
        plan: smart?.plan,
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
      // repeated misses → teach it again FIRST instead of throwing more questions at it
      const relearn = relearnConcepts(a.stats, a.mistakes, top).slice(0, 1);
      return { ...base, mode: "weak", title: "Fix My Weak Spots", subtitle: "Your 8 weakest concepts", total: 10, pool: top, confidenceRate: 0.5, mix: [0.6, 0.25, 0.15, 0], preTeach: relearn.map((c) => ({ c, how: "relearn" as const })) };
    }
    case "vault": {
      if (a.qid && (getQuestion(a.qid) || getActivity(a.qid))) {
        const m = a.mistakes[a.qid];
        const c = m ? CONCEPT_BY_ID[m.concept] : undefined;
        return { ...base, visual: false, mode: "vault", title: "Mistake Vault", subtitle: "Try again", total: 1, fixed: [a.qid], pool: c ? [c] : [], teachFirst: false, scaffold: false, hints: false };
      }
      const open = Object.values(a.mistakes)
        .filter((m) => !m.resolved && (getQuestion(m.qid) || getActivity(m.qid)))
        .sort((x, y) => y.misses - x.misses || y.at - x.at)
        .slice(0, 10);
      return {
        ...base,
        mode: "vault",
        visual: false,
        teachFirst: false,
        scaffold: false,
        hints: false,
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
      return { ...base, visual: false, scaffold: false, mode: "similar", title: "Similar Question", subtitle: c?.label, total: fixed.length, fixed, pool: c ? [c] : [], emptyMessage: "No similar questions available for this concept yet." };
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
    case "practice": {
      const r = a.sel ? resolveSelection(a.sel) : undefined;
      const pool = (r?.concepts ?? []).map((id) => CONCEPT_BY_ID[id]).filter(Boolean);
      const isCalc = pool.length > 0 && pool.every((c) => c.topic === "calc");
      const minutes = a.minutes ?? 10;
      return {
        ...base,
        mode: "practice",
        title: r?.title ?? "Practice",
        subtitle: minutes === "master" ? "Practice · Master it" : `Practice · ${minutes} min`,
        total: pool.length ? PRACTICE_ITEMS[String(minutes)] : 0,
        pool,
        drugIds: r?.drugIds,
        strictPool: true,
        visual: !isCalc,
        sel: a.sel,
        masterIt: minutes === "master",
        // practice leans on what's weak + what's due, never pulls in unrelated topics
        mix: [0.55, 0.3, 0.15, 0],
        emptyMessage: "Nothing to practice for this selection yet.",
      };
    }
    case "test": {
      const r = a.sel ? resolveSelection(a.sel) : undefined;
      const concepts = r?.concepts ?? [];
      const minutes = a.minutes ?? 10;
      const want = Math.min(TEST_ITEMS[String(minutes)], Math.max(concepts.length * 3, 4));
      const isCalc = concepts.length > 0 && concepts.every((c) => CONCEPT_BY_ID[c]?.topic === "calc");
      const fixed = isCalc ? [] : fixedAssessment(concepts, want, r?.drugIds, mulberry32(a.seed ?? Math.floor(a.now % 2 ** 31)), [4, 5, 6, 3]);
      return {
        mode: "test",
        title: r?.title ?? "Test",
        subtitle: "Test · no hints",
        total: isCalc ? want : fixed.length,
        fixed: isCalc ? undefined : fixed,
        pool: concepts.map((id) => CONCEPT_BY_ID[id]).filter(Boolean),
        types: EXAM_TYPES,
        drugIds: r?.drugIds,
        confidenceRate: 0,
        visual: false,
        sel: a.sel,
        emptyMessage: "No test questions for this selection yet.",
      };
    }
    case "pretest": {
      const r = a.sel ? resolveSelection(a.sel) : undefined;
      const concepts = r?.concepts ?? [];
      const fixed = fixedAssessment(concepts, Math.min(8, Math.max(4, concepts.length)), r?.drugIds, mulberry32(a.seed ?? Math.floor(a.now % 2 ** 31)), [3, 4, 5]);
      return {
        mode: "pretest",
        title: r?.title ?? "Test out",
        subtitle: "Already know this? Show it.",
        total: fixed.length,
        fixed,
        pool: concepts.map((id) => CONCEPT_BY_ID[id]).filter(Boolean),
        types: EXAM_TYPES,
        drugIds: r?.drugIds,
        confidenceRate: 0,
        visual: false,
        sel: a.sel,
        emptyMessage: "No diagnostic questions for this selection yet.",
      };
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
  /** item held back while its concept is taught first */
  pending?: Item;
  scriptIdx: number;
  preIdx: number;
  /** concepts taught (micro-lesson shown) during this session */
  taught: string[];
}

export const newRuntime = (): RuntimeState => ({ served: [], servedConcepts: [], requeue: [], fixedIdx: 0, actKeys: [], actKinds: [], scriptIdx: 0, preIdx: 0, taught: [] });

const actKey = (id: string) => id.replace(/:\d+$/, "");

/** Pick an interactive activity for the current pool (weak concepts + unused interaction kinds first). */
export function pickActivity(cfg: SessionConfig, rt: RuntimeState, stats: Record<string, ConceptStat>, recentGlobal: string[], now: number, rng: Rng): Activity | undefined {
  const pools = cfg.focus && cfg.focus.length && rng() < 0.7 ? [cfg.focus, cfg.pool] : [cfg.pool];
  const recent = new Set(recentGlobal.slice(-30).map(actKey));
  for (const pool of pools) {
    const ids = new Set(pool.map((c) => c.id));
    const cands = activitiesForConcepts(pool, rng).filter((a) => !rt.actKeys.includes(actKey(a.id)) && !recent.has(actKey(a.id)) && (!cfg.strictPool || ids.has(a.concepts[0])));
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

/** The micro-lesson item that teaches a concept (undefined if the concept has no lesson step). */
export function teachItem(conceptId: string, how: "exposed" | "relearn" = "exposed"): Item | undefined {
  const m = microLesson(conceptId);
  if (!m) return undefined;
  return { kind: "teach", concept: conceptId, steps: m.steps, lessonTitle: m.lesson.title, unit: m.lesson.unit, how };
}

const itemConcept = (it: Item) => (it.kind === "q" ? it.q.concept : it.kind === "a" ? it.a.concepts[0] : it.concept);

/** Next item (question, interactive activity, or micro-lesson) for a live session; records it in the runtime. */
export function nextItem(
  cfg: SessionConfig,
  rt: RuntimeState,
  stats: Record<string, ConceptStat>,
  qstats: Record<string, QStat>,
  recentGlobal: string[],
  now: number,
  rng: Rng = mulberry32(Math.floor(Math.random() * 2 ** 31)),
  mistakeCount?: Record<string, number>,
  learn: Record<string, LearnStat> = {},
): Item | undefined {
  const levels = cfg.scaffold ? levelMap(cfg, learn) : undefined;
  const mark = (it: Item): Item => {
    if (it.kind === "q") {
      rt.served.push(it.q.id);
      rt.servedConcepts.push(it.q.concept);
      rt.lastType = it.q.type;
    } else if (it.kind === "a") {
      rt.served.push(it.a.id);
      rt.servedConcepts.push(it.a.concepts[0]);
      rt.actKeys.push(actKey(it.a.id));
      rt.actKinds.push(it.a.kind);
    }
    return it;
  };
  const withGuided = (it: Item): Item => {
    if (it.kind !== "q" || !cfg.hints || ASSESSMENT_MODES.includes(cfg.mode)) return it;
    const lv = (learn[it.q.concept]?.level ?? 1) as Level;
    // hints are for recognition items while the concept is new (levels 1–2) — and always right after a lesson
    const fresh = rt.taught.includes(it.q.concept);
    return { ...it, guided: (isGuidedLevel(lv) || fresh) && questionLevel(it.q) <= 3 };
  };
  /** First-exposure detection: an untaught concept gets its micro-lesson BEFORE the item. */
  const gate = (it: Item | undefined): Item | undefined => {
    if (!it) return undefined;
    if (!cfg.teachFirst || ASSESSMENT_MODES.includes(cfg.mode) || it.kind === "teach") return mark(withGuided(it));
    const c = itemConcept(it);
    if (!isTaught(learn[c]) && !rt.taught.includes(c)) {
      const t = teachItem(c);
      if (t) {
        rt.taught.push(c);
        rt.pending = withGuided(it);
        return t;
      }
    }
    return mark(withGuided(it));
  };

  // 0) an item held back while its concept was being taught
  if (rt.pending) {
    const p = rt.pending;
    rt.pending = undefined;
    // after a lesson the first question is a guided recognition item when one exists
    if (p.kind === "q" && rt.taught.includes(p.q.concept)) {
      const c = CONCEPT_BY_ID[p.q.concept];
      const easy = c ? pickQuestionForConcept(c, { ...ctxFor(cfg, rt, stats, qstats, recentGlobal, now, rng, mistakeCount, levels), band: [2] }, new Set(rt.served)) : undefined;
      if (easy && questionLevel(easy) <= 3) return mark(withGuided({ kind: "q", q: easy }));
    }
    return mark(p);
  }

  // 1) teach-first queue (Weak Spots relearn)
  if (cfg.preTeach && rt.preIdx < cfg.preTeach.length) {
    const p = cfg.preTeach[rt.preIdx++];
    const t = teachItem(p.c, p.how);
    if (t) {
      rt.taught.push(p.c);
      return t;
    }
  }

  // 2) Continue Quest script
  if (cfg.script && rt.scriptIdx < cfg.script.length) {
    while (rt.scriptIdx < cfg.script.length) {
      const slot = cfg.script[rt.scriptIdx++];
      if (slot.t === "teach") {
        if (rt.taught.includes(slot.c)) continue;
        const t = teachItem(slot.c, slot.how);
        if (t) {
          rt.taught.push(slot.c);
          return t;
        }
        continue;
      }
      if (slot.t === "a") {
        const pool = slot.concepts.map((id) => CONCEPT_BY_ID[id]).filter(Boolean);
        const act = pickActivity({ ...cfg, pool, focus: undefined, strictPool: true }, rt, stats, recentGlobal, now, rng);
        if (act) return gate({ kind: "a", a: act });
        continue;
      }
      const c = CONCEPT_BY_ID[slot.c];
      if (!c) continue;
      const q = pickQuestionForConcept(c, { ...ctxFor(cfg, rt, stats, qstats, recentGlobal, now, rng, mistakeCount, levels), band: slot.band }, new Set(rt.served));
      if (q && !rt.served.includes(q.id)) return gate({ kind: "q", q });
    }
    // script finished — fall through to the adaptive engine for any remaining slots
  }

  // 3) the fixed queue (Mistake Vault, Test, Test-out) may contain activities
  if (cfg.fixed && rt.fixedIdx < cfg.fixed.length && isActivityId(cfg.fixed[rt.fixedIdx])) {
    const a = getActivity(cfg.fixed[rt.fixedIdx]);
    rt.fixedIdx += 1;
    if (a) return gate({ kind: "a", a });
  }
  const slot = slotPlan(rt.served.length);
  const dueRequeue = rt.requeue.some((r) => rt.served.length >= r.at);
  const fixedLeft = !!cfg.fixed && rt.fixedIdx < cfg.fixed.length;
  if (cfg.visual && slot.kind === "a" && !dueRequeue && !fixedLeft) {
    const a = pickActivity(cfg, rt, stats, recentGlobal, now, rng);
    if (a) return gate({ kind: "a", a });
  }
  const qcfg = cfg.visual && slot.kind === "q" ? { ...cfg, minDifficulty: cfg.minDifficulty ?? slot.minDifficulty, prefer: slot.prefer } : cfg;
  const q = nextForSession(qcfg, rt, stats, qstats, recentGlobal, now, rng, mistakeCount, levels);
  return gate(q ? { kind: "q", q } : undefined);
}

function levelMap(cfg: SessionConfig, learn: Record<string, LearnStat>): Record<string, Level> {
  const out: Record<string, Level> = {};
  for (const c of cfg.pool) out[c.id] = (learn[c.id]?.level ?? 1) as Level;
  for (const c of cfg.focus ?? []) out[c.id] = (learn[c.id]?.level ?? 1) as Level;
  for (const s of cfg.script ?? []) if (s.t !== "a") out[s.c] = (learn[s.c]?.level ?? 1) as Level;
  return out;
}

function ctxFor(cfg: SessionConfig, rt: RuntimeState, stats: Record<string, ConceptStat>, qstats: Record<string, QStat>, recentGlobal: string[], now: number, rng: Rng, mistakeCount: Record<string, number> | undefined, levels: Record<string, Level> | undefined): SelectCtx {
  return {
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
    levels,
    drugIds: cfg.drugIds,
  };
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
  levels?: Record<string, Level>,
): Question | undefined {
  // 1) fixed queue
  if (cfg.fixed && rt.fixedIdx < cfg.fixed.length) {
    const q = getQuestion(cfg.fixed[rt.fixedIdx]);
    rt.fixedIdx += 1;
    if (q) return q;
  }
  if (cfg.fixed && (cfg.pool.length === 0 || cfg.mode === "test" || cfg.mode === "pretest")) return undefined;

  const ctxBase = ctxFor(cfg, rt, stats, qstats, recentGlobal, now, rng, mistakeCount, levels);
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

/** "Master it" is done when every concept in the pool has reached scaffold level 5 (clinical scenarios). */
export const masteredSelection = (cfg: SessionConfig, learn: Record<string, LearnStat>) => cfg.pool.length > 0 && cfg.pool.every((c) => (learn[c.id]?.level ?? 1) >= 5);

export { bandFor };
