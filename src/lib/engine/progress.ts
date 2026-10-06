import type { TopicId, WorldId } from "@/lib/types";
import { CONCEPTS, NODES, TOPICS, conceptsForNode } from "@/data/curriculum";
import { effectiveMastery, nodeState, type ConceptStat, type NodeState } from "./mastery";

// ───────────────────────── dates ─────────────────────────
export const dayKey = (d: Date = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const parseDay = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const daysBetween = (a: string, b: string) => Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / 86_400_000);

export function daysUntil(examDate: string | null, today = dayKey()): number | null {
  if (!examDate) return null;
  return daysBetween(today, examDate);
}

// ───────────────────────── readiness ─────────────────────────
export function topicMastery(stats: Record<string, ConceptStat>, topic: TopicId, now: number): number {
  const cs = CONCEPTS.filter((c) => c.topic === topic);
  if (!cs.length) return 0;
  return cs.reduce((a, c) => a + effectiveMastery(stats[c.id], now), 0) / cs.length;
}

export interface Readiness {
  overall: number;
  mastery: number;
  byTopic: Record<TopicId, number>;
  examBlend?: number;
}

/**
 * Exam Readiness = blueprint-weighted average of topic mastery (each topic weighted by its share of the
 * 50-question exam). Concept mastery is capped unless application-level questions are answered correctly
 * across sessions, so readiness can't reach 100% from easy recall alone. A recent simulated exam (≤ 3 days)
 * contributes 25%.
 */
export function readiness(stats: Record<string, ConceptStat>, now: number, recentExamPct?: number): Readiness {
  const byTopic = {} as Record<TopicId, number>;
  let weighted = 0;
  let total = 0;
  for (const t of TOPICS) {
    const m = topicMastery(stats, t.id, now);
    byTopic[t.id] = m;
    weighted += m * t.examCount;
    total += t.examCount;
  }
  const mastery = total ? weighted / total : 0;
  const overall = recentExamPct === undefined ? mastery : mastery * 0.75 + recentExamPct * 0.25;
  return { overall: Math.round(overall), mastery: Math.round(mastery), byTopic, examBlend: recentExamPct };
}

export function nodeProgress(stats: Record<string, ConceptStat>, node: string, now: number): { avg: number; state: NodeState; stars: number; seen: number; total: number } {
  const cs = conceptsForNode(node);
  const seenCs = cs.filter((c) => (stats[c.id]?.seen ?? 0) > 0);
  const avg = cs.length ? cs.reduce((a, c) => a + effectiveMastery(stats[c.id], now), 0) / cs.length : 0;
  const state = nodeState(avg, seenCs.length > 0);
  const stars = avg >= 80 ? 3 : avg >= 60 ? 2 : avg >= 30 ? 1 : 0;
  return { avg, state, stars, seen: seenCs.length, total: cs.length };
}

export function worldProgress(stats: Record<string, ConceptStat>, world: WorldId, now: number) {
  const nodes = NODES.filter((n) => n.world === world);
  const ps = nodes.map((n) => nodeProgress(stats, n.id, now));
  const avg = ps.length ? ps.reduce((a, p) => a + p.avg, 0) / ps.length : 0;
  return { avg, nodes: ps };
}

// ───────────────────────── XP + levels ─────────────────────────
export const XP = { correct: 10, hard: 15, streakBonus: 5, bossWin: 100, examCorrect: 10, missionComplete: 25 };

export function xpForAnswer(correct: boolean, difficulty: number, sessionStreakAfter: number): number {
  if (!correct) return 0;
  let xp = difficulty >= 3 ? XP.hard : XP.correct;
  if (sessionStreakAfter > 0 && sessionStreakAfter % 3 === 0) xp += XP.streakBonus;
  return xp;
}

const TITLES = [
  "Fresh Start",
  "Med Pass Rookie",
  "Safe Dose Scout",
  "Vital Signs Ace",
  "Pharm Apprentice",
  "Clinical Thinker",
  "Priority Pro",
  "Charge Nurse",
  "Pharm Strategist",
  "Pharm Master",
];

/** XP needed to go from level L to L+1 = 100 + 50·L. */
export function levelFromXp(xp: number) {
  let level = 1;
  let floor = 0;
  let need = 150;
  while (xp >= floor + need) {
    floor += need;
    level += 1;
    need = 100 + 50 * level;
  }
  return { level, title: TITLES[Math.min(level - 1, TITLES.length - 1)], into: xp - floor, needed: need, progress: (xp - floor) / need };
}

// ───────────────────────── streak ─────────────────────────
export interface StreakState {
  count: number;
  best: number;
  lastDay: string | null;
  /** day when the one free rest day was last used */
  restUsed: string | null;
}

export type StreakEvent = "same" | "started" | "continued" | "rest-used" | "fresh-start";

/**
 * Gentle streak: studying on consecutive days grows it. Missing exactly ONE day is covered by an automatic
 * rest day (once per 7 days). Longer gaps start a fresh streak — progress, XP and mastery are never lost.
 */
export function touchStreak(s: StreakState, today: string): { state: StreakState; event: StreakEvent } {
  if (s.lastDay === today) return { state: s, event: "same" };
  if (!s.lastDay) return { state: { ...s, count: 1, best: Math.max(1, s.best), lastDay: today }, event: "started" };
  const gap = daysBetween(s.lastDay, today);
  if (gap === 1) {
    const count = s.count + 1;
    return { state: { ...s, count, best: Math.max(count, s.best), lastDay: today }, event: "continued" };
  }
  const restOk = gap === 2 && (!s.restUsed || daysBetween(s.restUsed, today) >= 7);
  if (restOk) {
    const count = s.count + 1;
    return { state: { count, best: Math.max(count, s.best), lastDay: today, restUsed: today }, event: "rest-used" };
  }
  if (gap < 0) return { state: { ...s, lastDay: today }, event: "same" }; // clock moved backwards
  return { state: { ...s, count: 1, lastDay: today }, event: "fresh-start" };
}

/** Streak to display (0 if it has lapsed beyond the grace window). */
export function displayStreak(s: StreakState, today: string): number {
  if (!s.lastDay) return 0;
  const gap = daysBetween(s.lastDay, today);
  if (gap <= 1) return s.count;
  if (gap === 2 && (!s.restUsed || daysBetween(s.restUsed, today) >= 7)) return s.count;
  return 0;
}
