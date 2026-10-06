"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { MCQQuestion, Question, QuestionType, TopicId } from "@/lib/types";
import type { Activity, ActivityResult } from "@/lib/activities/types";
import { CONCEPT_BY_ID } from "@/data/curriculum";
import { effectiveMastery, updateConcept, type ConceptStat, type Confidence } from "@/lib/engine/mastery";
import type { QStat } from "@/lib/engine/select";
import { dayKey, levelFromXp, touchStreak, xpForAnswer, XP, type StreakState, type StreakEvent } from "@/lib/engine/progress";
import { ACH_BY_ID, BOSS_BADGE, type AchievementDef } from "@/lib/engine/achievements";
import { playSound } from "@/lib/sound";

export type DailyMinutes = 5 | 10 | 20 | 30;
export type StartConfidence = "not" | "somewhat" | "almost";

export interface Profile {
  onboarded: boolean;
  examDate: string | null;
  dailyMinutes: DailyMinutes;
  startConfidence: StartConfidence;
  createdAt: number;
}

export interface Settings {
  theme: "system" | "light" | "dark";
  haptics: boolean;
  confidencePrompts: boolean;
  /** subtle synthesized sound effects (easily muted) */
  sound: boolean;
}

export interface Mistake {
  qid: string;
  concept: string;
  topic: TopicId;
  chosen: string;
  at: number;
  misses: number;
  resolved: boolean;
  fixedAt?: number;
  understood?: boolean;
}

export interface LogEntry {
  q: string;
  c: string;
  t: TopicId;
  ty: QuestionType;
  ok: boolean;
  conf?: Confidence;
  ms: number;
  at: number;
  mode: string;
  /** interactive activity kind (absent for questions) */
  k?: string;
}

export interface DayStat {
  answered: number;
  correct: number;
  ms: number;
  xp: number;
}

export interface ExamItem {
  q: string;
  ok: boolean;
  c: string;
  t: TopicId;
  ty: QuestionType;
  resp: string;
}

export interface ExamResult {
  id: string;
  at: number;
  ms: number;
  total: number;
  correct: number;
  items: ExamItem[];
}

export interface BossRecord {
  attempts: number;
  wins: number;
  best: number;
  lastWin?: number;
}

export interface Counters {
  totalAnswered: number;
  sessions: number;
  vaultFixed: number;
  calcRun: number;
  labPerfectLocks: number;
  arenaBest: number;
  arenaRounds: number;
  contrastsCleared: string[];
  missionDay: string | null;
  missionsDone: number;
  bestRun: number;
}

export interface PQData {
  profile: Profile;
  settings: Settings;
  xp: number;
  streak: StreakState;
  concepts: Record<string, ConceptStat>;
  qstats: Record<string, QStat>;
  mistakes: Record<string, Mistake>;
  log: LogEntry[];
  days: Record<string, DayStat>;
  achievements: Record<string, number>;
  bosses: Record<string, BossRecord>;
  exams: ExamResult[];
  calib: Record<Confidence, { n: number; ok: number }>;
  counters: Counters;
}

export interface RecordInput {
  q: Question;
  correct: boolean;
  responseText: string;
  confidence?: Confidence;
  ms: number;
  mode: string;
  sessionId: string;
  /** consecutive correct answers in this session INCLUDING this one (0 if wrong) */
  sessionStreak: number;
  awardXp?: boolean;
  /** don't store a miss in the Mistake Vault (dynamic items that can't be re-asked) */
  noVault?: boolean;
  /** set when recording an interactive activity */
  activityKind?: string;
}

export interface RecordResult {
  xp: number;
  masteryBefore: number;
  masteryAfter: number;
  levelUp: number | null;
  streakEvent: StreakEvent;
  fixedMistake: boolean;
  unlocked: AchievementDef[];
}

interface Actions {
  completeOnboarding: (p: { examDate: string | null; dailyMinutes: DailyMinutes; startConfidence: StartConfidence }) => void;
  updateProfile: (p: Partial<Profile>) => void;
  updateSettings: (s: Partial<Settings>) => void;
  recordAnswer: (i: RecordInput) => RecordResult;
  recordActivity: (a: Activity, r: ActivityResult, ctx: { ms: number; mode: string; sessionId: string; sessionStreak: number }) => RecordResult;
  finishSession: (p: { mode: string; correct: number; total: number }) => { bonusXp: number; unlocked: AchievementDef[]; missionCompleted: boolean };
  recordBoss: (bossId: string, won: boolean, correct: number) => { xp: number; unlocked: AchievementDef[] };
  recordExam: (r: ExamResult) => AchievementDef[];
  markUnderstood: (qid: string) => void;
  recordArena: (correct: number, total: number) => AchievementDef[];
  recordLabLock: (perfect: boolean) => AchievementDef[];
  recordContrast: (setId: string, perfect: boolean) => AchievementDef[];
  addXp: (n: number) => void;
  resetAll: () => void;
}

export type PQState = PQData & Actions;

const freshData = (): PQData => ({
  profile: { onboarded: false, examDate: null, dailyMinutes: 10, startConfidence: "somewhat", createdAt: Date.now() },
  settings: { theme: "system", haptics: true, confidencePrompts: true, sound: true },
  xp: 0,
  streak: { count: 0, best: 0, lastDay: null, restUsed: null },
  concepts: {},
  qstats: {},
  mistakes: {},
  log: [],
  days: {},
  achievements: {},
  bosses: {},
  exams: [],
  calib: { guess: { n: 0, ok: 0 }, unsure: { n: 0, ok: 0 }, confident: { n: 0, ok: 0 } },
  counters: {
    totalAnswered: 0,
    sessions: 0,
    vaultFixed: 0,
    calcRun: 0,
    labPerfectLocks: 0,
    arenaBest: 0,
    arenaRounds: 0,
    contrastsCleared: [],
    missionDay: null,
    missionsDone: 0,
    bestRun: 0,
  },
});

const LOG_CAP = 3000;

/** Notifications for the UI (not persisted). */
interface ToastState {
  toasts: { id: number; kind: "achievement" | "level" | "info"; title: string; body?: string; icon?: string }[];
  push: (t: Omit<ToastState["toasts"][number], "id">) => void;
  dismiss: (id: number) => void;
}
let toastId = 0;
export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => set((s) => ({ toasts: [...s.toasts, { ...t, id: ++toastId }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

function announce(unlocked: AchievementDef[], levelUp: number | null) {
  const push = useToasts.getState().push;
  if (unlocked.length || levelUp) playSound(levelUp ? "level" : "achievement");
  for (const a of unlocked) push({ kind: "achievement", title: a.name, body: a.desc, icon: a.icon });
  if (levelUp) push({ kind: "level", title: `Level ${levelUp}!`, body: levelFromXp(useStore.getState().xp).title, icon: "⭐" });
}

export const useStore = create<PQState>()(
  persist(
    (set, get) => {
      /** unlock helper: mutates the achievements draft and returns newly unlocked defs */
      const unlockInto = (draft: Record<string, number>, ids: string[]): AchievementDef[] => {
        const out: AchievementDef[] = [];
        for (const id of ids) {
          if (!draft[id] && ACH_BY_ID[id]) {
            draft[id] = Date.now();
            out.push(ACH_BY_ID[id]);
          }
        }
        return out;
      };

      return {
        ...freshData(),

        completeOnboarding: ({ examDate, dailyMinutes, startConfidence }) =>
          set((s) => ({ profile: { ...s.profile, onboarded: true, examDate, dailyMinutes, startConfidence } })),

        updateProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
        updateSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),

        recordAnswer: (i) => {
          const s = get();
          const now = Date.now();
          const today = dayKey();
          const q = i.q;
          const prevStat = s.concepts[q.concept];
          const before = effectiveMastery(prevStat, now);
          const nextStat = updateConcept(prevStat, {
            correct: i.correct,
            difficulty: q.difficulty,
            cognitive: q.cognitive,
            confidence: i.confidence,
            ms: i.ms,
            sessionId: i.sessionId,
            now,
          });
          const after = effectiveMastery(nextStat, now);

          const prevQ = s.qstats[q.id];
          const qstat: QStat = {
            seen: (prevQ?.seen ?? 0) + 1,
            correct: (prevQ?.correct ?? 0) + (i.correct ? 1 : 0),
            last: now,
            lastCorrect: i.correct,
          };

          // Mistake vault
          const mistakes = { ...s.mistakes };
          let fixedMistake = false;
          const existing = mistakes[q.id];
          const counters = { ...s.counters, contrastsCleared: [...s.counters.contrastsCleared] };
          if (!i.correct && !i.noVault) {
            mistakes[q.id] = {
              qid: q.id,
              concept: q.concept,
              topic: q.topic,
              chosen: i.responseText,
              at: now,
              misses: (existing?.misses ?? 0) + 1,
              resolved: false,
            };
          } else if (existing && !existing.resolved) {
            mistakes[q.id] = { ...existing, resolved: true, fixedAt: now };
            fixedMistake = true;
            counters.vaultFixed += 1;
          }

          // XP
          const xp = i.awardXp === false ? 0 : xpForAnswer(i.correct, q.difficulty, i.sessionStreak);
          const levelBefore = levelFromXp(s.xp).level;
          const levelAfter = levelFromXp(s.xp + xp).level;

          // Streak + day stats
          const { state: streak, event: streakEvent } = touchStreak(s.streak, today);
          const d = s.days[today] ?? { answered: 0, correct: 0, ms: 0, xp: 0 };
          const days = { ...s.days, [today]: { answered: d.answered + 1, correct: d.correct + (i.correct ? 1 : 0), ms: d.ms + Math.min(i.ms, 180_000), xp: d.xp + xp } };

          // Calibration
          const calib = { ...s.calib };
          if (i.confidence) {
            const c = calib[i.confidence];
            calib[i.confidence] = { n: c.n + 1, ok: c.ok + (i.correct ? 1 : 0) };
          }

          counters.totalAnswered += 1;
          counters.bestRun = Math.max(counters.bestRun, i.sessionStreak);
          if (q.topic === "calc") counters.calcRun = i.correct ? counters.calcRun + 1 : 0;

          const concepts = { ...s.concepts, [q.concept]: nextStat };
          const log = [...s.log, { q: q.id, c: q.concept, t: q.topic, ty: q.type, ok: i.correct, conf: i.confidence, ms: i.ms, at: now, mode: i.mode, ...(i.activityKind ? { k: i.activityKind } : {}) }];
          if (log.length > LOG_CAP) log.splice(0, log.length - LOG_CAP);

          // Achievements
          const ach = { ...s.achievements };
          const ids: string[] = [];
          if (i.sessionStreak >= 10) ids.push("perfect-10");
          if (counters.vaultFixed >= 5) ids.push("comeback-kid");
          if (counters.calcRun >= 5) ids.push("calc-crusher");
          if (counters.totalAnswered >= 100) ids.push("century");
          if (streak.count >= 3) ids.push("on-a-roll");
          if (calib.confident.n >= 20 && calib.confident.ok / calib.confident.n >= 0.9) ids.push("calibrated");
          const masteredCount = Object.values(concepts).filter((c) => effectiveMastery(c, now) >= 80).length;
          if (masteredCount >= 10) ids.push("deep-roots");
          const unlocked = unlockInto(ach, ids);

          set({
            concepts,
            qstats: { ...s.qstats, [q.id]: qstat },
            mistakes,
            xp: s.xp + xp,
            streak,
            days,
            calib,
            counters,
            log,
            achievements: ach,
          });
          const levelUp = levelAfter > levelBefore ? levelAfter : null;
          announce(unlocked, levelUp);
          return { xp, masteryBefore: before, masteryAfter: after, levelUp, streakEvent, fixedMistake, unlocked };
        },

        recordActivity: (a, r, ctx) => {
          // An activity is recorded like one question on its primary concept (mastery, XP, streak, vault)…
          const pseudo: MCQQuestion = {
            id: a.id,
            type: "mcq",
            topic: a.topic,
            concept: a.concepts[0],
            drugs: [],
            difficulty: a.difficulty,
            cognitive: "apply",
            format: "case",
            stem: a.title,
            options: [],
            answer: 0,
            why: r.summary,
            source: a.source,
          };
          const res = get().recordAnswer({ q: pseudo, correct: r.correct, responseText: r.summary, ms: ctx.ms, mode: ctx.mode, sessionId: ctx.sessionId, sessionStreak: ctx.sessionStreak, activityKind: a.kind });
          // …and the other concepts it exercised get a lighter mastery update (no XP / log entry).
          const others = a.concepts.slice(1, 4);
          if (others.length) {
            const now = Date.now();
            const s = get();
            const concepts = { ...s.concepts };
            for (const c of others) concepts[c] = updateConcept(concepts[c], { correct: r.correct, difficulty: 1, cognitive: "apply", ms: ctx.ms, sessionId: ctx.sessionId, now });
            set({ concepts });
          }
          return res;
        },

        finishSession: ({ mode, correct, total }) => {
          const s = get();
          const today = dayKey();
          const counters = { ...s.counters, contrastsCleared: [...s.counters.contrastsCleared], sessions: s.counters.sessions + 1 };
          const ach = { ...s.achievements };
          const ids = ["first-dose"];
          let bonusXp = 0;
          let missionCompleted = false;
          if (mode === "mission" && counters.missionDay !== today && total > 0) {
            counters.missionDay = today;
            counters.missionsDone += 1;
            bonusXp += XP.missionComplete;
            missionCompleted = true;
          }
          const unlocked = unlockInto(ach, ids);
          const levelBefore = levelFromXp(s.xp).level;
          set({ counters, achievements: ach, xp: s.xp + bonusXp });
          const levelAfter = levelFromXp(s.xp + bonusXp).level;
          announce(unlocked, levelAfter > levelBefore ? levelAfter : null);
          void correct;
          return { bonusXp, unlocked, missionCompleted };
        },

        recordBoss: (bossId, won, correct) => {
          const s = get();
          const prev = s.bosses[bossId] ?? { attempts: 0, wins: 0, best: 0 };
          const rec: BossRecord = {
            attempts: prev.attempts + 1,
            wins: prev.wins + (won ? 1 : 0),
            best: Math.max(prev.best, correct),
            lastWin: won ? Date.now() : prev.lastWin,
          };
          const ach = { ...s.achievements };
          const unlocked = won && BOSS_BADGE[bossId] ? unlockInto(ach, [BOSS_BADGE[bossId]]) : [];
          const xp = won ? XP.bossWin : 0;
          const levelBefore = levelFromXp(s.xp).level;
          set({ bosses: { ...s.bosses, [bossId]: rec }, achievements: ach, xp: s.xp + xp });
          const levelAfter = levelFromXp(s.xp + xp).level;
          announce(unlocked, levelAfter > levelBefore ? levelAfter : null);
          return { xp, unlocked };
        },

        recordExam: (r) => {
          const s = get();
          const ach = { ...s.achievements };
          const unlocked = r.total > 0 && r.correct / r.total >= 0.8 ? unlockInto(ach, ["exam-ready"]) : [];
          set({ exams: [r, ...s.exams].slice(0, 12), achievements: ach });
          announce(unlocked, null);
          return unlocked;
        },

        markUnderstood: (qid) =>
          set((s) => {
            const m = s.mistakes[qid];
            if (!m) return {};
            return { mistakes: { ...s.mistakes, [qid]: { ...m, resolved: true, understood: true, fixedAt: Date.now() } } };
          }),

        recordArena: (correct, total) => {
          const s = get();
          const ach = { ...s.achievements };
          const unlocked = total >= 5 && correct === total ? unlockInto(ach, ["antidote-ace"]) : [];
          set({ achievements: ach, counters: { ...s.counters, arenaBest: Math.max(s.counters.arenaBest, correct), arenaRounds: s.counters.arenaRounds + 1 } });
          announce(unlocked, null);
          return unlocked;
        },

        recordLabLock: (perfect) => {
          const s = get();
          const counters = { ...s.counters, labPerfectLocks: s.counters.labPerfectLocks + (perfect ? 1 : 0) };
          const ach = { ...s.achievements };
          const unlocked = counters.labPerfectLocks >= 8 ? unlockInto(ach, ["lab-legend"]) : [];
          set({ counters, achievements: ach });
          announce(unlocked, null);
          return unlocked;
        },

        recordContrast: (setId, perfect) => {
          const s = get();
          const cleared = perfect && !s.counters.contrastsCleared.includes(setId) ? [...s.counters.contrastsCleared, setId] : s.counters.contrastsCleared;
          const ach = { ...s.achievements };
          const unlocked = cleared.length >= 5 ? unlockInto(ach, ["sharp-eye"]) : [];
          set({ counters: { ...s.counters, contrastsCleared: cleared }, achievements: ach });
          announce(unlocked, null);
          return unlocked;
        },

        addXp: (n) => {
          const s = get();
          const levelBefore = levelFromXp(s.xp).level;
          set({ xp: s.xp + n });
          const levelAfter = levelFromXp(s.xp + n).level;
          announce([], levelAfter > levelBefore ? levelAfter : null);
        },

        resetAll: () => set({ ...freshData() }),
      };
    },
    {
      name: "pharm-quest-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { completeOnboarding, updateProfile, updateSettings, recordAnswer, recordActivity, finishSession, recordBoss, recordExam, markUnderstood, recordArena, recordLabLock, recordContrast, addXp, resetAll, ...data } = s;
        return data;
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PQData>;
        const base = freshData();
        return {
          ...current,
          ...base,
          ...p,
          profile: { ...base.profile, ...p.profile },
          settings: { ...base.settings, ...p.settings },
          counters: { ...base.counters, ...p.counters },
          calib: { ...base.calib, ...p.calib },
          streak: { ...base.streak, ...p.streak },
        };
      },
    },
  ),
);

/** Open (unresolved) mistakes per concept. */
export const openMistakesByConcept = (mistakes: Record<string, Mistake>) => {
  const out: Record<string, number> = {};
  for (const m of Object.values(mistakes)) if (!m.resolved) out[m.concept] = (out[m.concept] ?? 0) + 1;
  return out;
};

export const conceptLabel = (id: string) => CONCEPT_BY_ID[id]?.label ?? id;
