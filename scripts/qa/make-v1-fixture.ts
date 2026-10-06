// Builds a realistic persisted v1 ("pharm-quest-v1", version 1) state for an existing learner.
// Used by the migration unit test and by the before/after screenshot QA.
import { writeFileSync } from "node:fs";
import { QUESTIONS } from "@/data/bank";
import { updateConcept, type ConceptStat } from "@/lib/engine/mastery";

const now = Date.UTC(2026, 9, 6, 15, 0, 0);
const day = (d: number) => {
  const t = new Date(now - d * 86_400_000);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
};
const concepts: Record<string, ConceptStat> = {};
const qstats: Record<string, { seen: number; correct: number; last: number; lastCorrect: boolean }> = {};
const log: unknown[] = [];
const mistakes: Record<string, unknown> = {};
// strong on opioids/ACE, shaky on warfarin, guessed on digoxin
const plan: [string, boolean[]][] = [
  ["op-hold", [true, true, true, true]],
  ["op-antidote", [true, true, true]],
  ["ace-angioedema", [true, true, false, true]],
  ["ace-ci", [true, true]],
  ["war-teach", [false, false, true, false]],
  ["war-antidote", [false, false]],
  ["dig-tox", [false, true]],
  ["hep-lab", [true, false]],
];
let t = now - 3 * 86_400_000;
for (const [c, results] of plan) {
  const qs = QUESTIONS.filter((q) => q.concept === c);
  results.forEach((ok, i) => {
    const q = qs[i % qs.length];
    t += 600_000;
    concepts[c] = updateConcept(concepts[c], { correct: ok, difficulty: q.difficulty, cognitive: q.cognitive, ms: 9000, sessionId: `s-${i}`, now: t });
    const p = qstats[q.id];
    qstats[q.id] = { seen: (p?.seen ?? 0) + 1, correct: (p?.correct ?? 0) + (ok ? 1 : 0), last: t, lastCorrect: ok };
    log.push({ q: q.id, c, t: q.topic, ty: q.type, ok, ms: 9000, at: t, mode: "mission" });
    if (!ok) {
      const m = mistakes[q.id] as { misses: number } | undefined;
      mistakes[q.id] = { qid: q.id, concept: c, topic: q.topic, chosen: "a wrong pick", at: t, misses: (m?.misses ?? 0) + 1, resolved: false };
    }
  });
}
const state = {
  profile: { onboarded: true, examDate: "2026-10-15", dailyMinutes: 10, startConfidence: "somewhat", createdAt: now - 9 * 86_400_000 },
  settings: { theme: "system", haptics: true, confidencePrompts: true, sound: false },
  xp: 1840,
  streak: { count: 6, best: 6, lastDay: day(0), restUsed: null },
  concepts,
  qstats,
  mistakes,
  log,
  days: { [day(2)]: { answered: 14, correct: 9, ms: 400000, xp: 160 }, [day(1)]: { answered: 10, correct: 7, ms: 300000, xp: 120 }, [day(0)]: { answered: 3, correct: 2, ms: 60000, xp: 30 } },
  achievements: { "first-dose": now - 8 * 86_400_000, "on-a-roll": now - 3 * 86_400_000 },
  bosses: { "boss-w5": { attempts: 2, wins: 1, best: 9, lastWin: now - 86_400_000 } },
  exams: [{ id: "ex-1", at: now - 86_400_000, ms: 3_600_000, total: 50, correct: 34, items: [] }],
  calib: { guess: { n: 4, ok: 1 }, unsure: { n: 9, ok: 6 }, confident: { n: 12, ok: 10 } },
  counters: { totalAnswered: 27, sessions: 5, vaultFixed: 2, calcRun: 0, labPerfectLocks: 1, arenaBest: 8, arenaRounds: 2, contrastsCleared: ["ace-vs-arb"], missionDay: day(1), missionsDone: 4, bestRun: 6 },
};
writeFileSync("tests/fixtures/v1-existing-user.json", JSON.stringify({ state, version: 1 }, null, 1));
console.log("wrote fixture", Object.keys(concepts).length, "concepts", Object.keys(mistakes).length, "mistakes");
