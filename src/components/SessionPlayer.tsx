"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, Heart, X, Trophy, RotateCcw, Home as HomeIcon, Swords, Volume2, VolumeX, ArrowRight, Sparkles, Shuffle, Lightbulb, GraduationCap, Layers } from "lucide-react";
import type { Question } from "@/lib/types";
import type { Activity, ActivityResult } from "@/lib/activities/types";
import { correctAnswerText, isCorrect, responseText, type Response } from "@/lib/engine/grade";
import type { Confidence } from "@/lib/engine/mastery";
import { ASSESSMENT_MODES, masteredSelection, newRuntime, nextItem, pickActivity, teachItem, relearnConcepts, type Item, type SessionConfig } from "@/lib/engine/session";
import { pickQuestionForConcept } from "@/lib/engine/select";
import { CONCEPT_BY_ID, WORLD_BY_ID } from "@/data/curriculum";
import { selKey } from "@/data/library";
import { keyFact, microLesson } from "@/data/lessons";
import { openMistakesByConcept, useStore } from "@/lib/store";
import { mulberry32 } from "@/lib/rng";
import { playSound } from "@/lib/sound";
import { QuestionView } from "./QuestionView";
import { Feedback } from "./Feedback";
import { ActivityView, KIND_LABEL } from "./activities/ActivityView";
import { LessonStepper } from "./learn/LessonStepper";
import { Button, cx, haptic } from "./ui";
import { celebrate } from "./celebrate";

interface Result {
  id: string;
  concept: string;
  title: string;
  correct: boolean;
  xp: number;
  before: number;
  after: number;
  chosen: string;
  q?: Question;
  act?: Activity;
}

function pickNext(cfg: SessionConfig, rt: ReturnType<typeof newRuntime>): Item | undefined {
  const s = useStore.getState();
  const recent = s.log.slice(-40).map((l) => l.q);
  return nextItem(cfg, rt, s.concepts, s.qstats, recent, Date.now(), undefined, openMistakesByConcept(s.mistakes), s.learn);
}

/** The strongest hint we have for a question: its clue, else the lesson's key fact, else its hook. */
function hintFor(q: Question) {
  return q.clue ?? keyFact(q.concept) ?? q.hook ?? "";
}

export function SessionPlayer({ cfg, onAgain }: { cfg: SessionConfig; onAgain: () => void }) {
  const router = useRouter();
  const confPref = useStore((s) => s.settings.confidencePrompts);
  const sound = useStore((s) => s.settings.sound);
  const [boot] = useState(() => {
    const runtime = newRuntime();
    return { runtime, first: cfg.total > 0 ? pickNext(cfg, runtime) : undefined, sessionId: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
  });
  const rt = useRef(boot.runtime);
  const sessionId = boot.sessionId;
  const [total, setTotal] = useState(cfg.total);
  const [item, setItem] = useState<Item | undefined>(boot.first);
  const [phase, setPhase] = useState<"q" | "fb" | "done">(() => (cfg.total > 0 && boot.first ? "q" : "done"));
  const [results, setResults] = useState<Result[]>([]);
  const [streak, setStreak] = useState(0);
  const [hearts, setHearts] = useState(cfg.hearts ?? 0);
  const [last, setLast] = useState<{ correct: boolean; chosen: string; xp: number; elaborate: boolean } | null>(null);
  const [bonus, setBonus] = useState(0);
  const [askConf, setAskConf] = useState(() => confPref && Math.random() < cfg.confidenceRate);
  const shownAt = useRef(0);
  const [confirmExit, setConfirmExit] = useState(false);
  const [serveIdx, setServeIdx] = useState(0);
  // guided practice state for the current question
  const [guide, setGuide] = useState<{ tries: number; hinted: boolean; eliminated: number[] }>({ tries: 0, hinted: false, eliminated: [] });
  const [masterDone, setMasterDone] = useState(false);
  const isBoss = cfg.mode === "boss";
  const isAssessment = ASSESSMENT_MODES.includes(cfg.mode);
  const q = item?.kind === "q" ? item.q : undefined;
  const guided = item?.kind === "q" && !!item.guided;
  const act = item?.kind === "a" ? item.a : undefined;
  const teach = item?.kind === "teach" ? item : undefined;

  const serve = useCallback(
    (next: Item | undefined) => {
      setItem(next);
      setServeIdx((n) => n + 1);
      setLast(null);
      setGuide({ tries: 0, hinted: false, eliminated: [] });
      setPhase(next ? "q" : "done");
      // no confidence prompt on guided items — hints already show she's still learning it
      setAskConf(confPref && !(next?.kind === "q" && next.guided) && Math.random() < cfg.confidenceRate);
      shownAt.current = Date.now();
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [cfg.confidenceRate, confPref],
  );

  const finish = useCallback(
    (res: Result[], heartsLeft: number) => {
      const s = useStore.getState();
      const correct = res.filter((r) => r.correct).length;
      let extra = 0;
      if (res.length > 0) {
        const fin = s.finishSession({ mode: cfg.mode, correct, total: res.length });
        extra += fin.bonusXp;
      }
      if (cfg.sel && res.length > 0) {
        const key = selKey(cfg.sel);
        if (cfg.mode === "test") s.recordUnitTest(key, correct, res.length);
        if (cfg.mode === "pretest") {
          const byConcept: Record<string, boolean> = {};
          for (const r of res) byConcept[r.concept] = (byConcept[r.concept] ?? true) && r.correct;
          s.recordPretest(key, byConcept, Math.round((correct / res.length) * 100));
        }
      }
      if (isBoss && cfg.bossId) {
        const won = heartsLeft > 0 && res.length >= cfg.total;
        const b = s.recordBoss(cfg.bossId, won, correct);
        extra += b.xp;
        if (won) {
          celebrate("big");
          playSound("boss");
        }
      } else if (res.length >= 5 && correct / res.length >= 0.8) celebrate("small");
      setBonus(extra);
      setPhase("done");
    },
    [cfg.bossId, cfg.mode, cfg.total, cfg.sel, isBoss],
  );

  const settle = (correct: boolean, chosen: string, xp: number, before: number, after: number, elaborate: boolean) => {
    if (!q) return;
    setLast({ correct, chosen, xp, elaborate });
    setResults((prev) => [...prev, { id: q.id, concept: q.concept, title: q.stem, correct, xp, before, after, chosen, q }]);
    setPhase("fb");
  };

  const onSubmit = (r: Response, conf?: Confidence) => {
    if (!q) return;
    const ms = shownAt.current ? Date.now() - shownAt.current : 0;
    const correct = isCorrect(q, r);
    const chosen = responseText(q, r);

    // ── Guided practice: a wrong answer teaches (hint + retry) instead of counting against her
    if (guided) {
      if (!correct && guide.tries === 0 && q.type !== "tf") {
        setGuide((g) => ({ tries: 1, hinted: true, eliminated: r.type === "mcq" ? [...g.eliminated, r.choice] : g.eliminated }));
        haptic([20, 30, 20]);
        playSound("wrong");
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const firstTry = guide.tries === 0 && !guide.hinted && correct;
      const newStreak = firstTry ? streak + 1 : 0;
      const res = useStore.getState().recordGuided({ q, correct, firstTry, assisted: !firstTry, responseText: chosen, ms, mode: cfg.mode, sessionId, sessionStreak: newStreak });
      setStreak(newStreak);
      haptic(correct ? 15 : [30, 40, 30]);
      playSound(correct ? "correct" : "wrong");
      return settle(correct, chosen, res.xp, res.masteryBefore, res.masteryAfter, false);
    }

    const newStreak = correct ? streak + 1 : 0;
    const res = useStore.getState().recordAnswer({ q, correct, responseText: chosen, confidence: conf, ms, mode: cfg.mode, sessionId, sessionStreak: newStreak });
    setStreak(newStreak);
    if (!correct && !isAssessment) rt.current.requeue.push({ concept: q.concept, at: rt.current.served.length + 3 });
    if (isBoss && !correct) setHearts((h) => h - 1);
    haptic(correct ? 15 : [30, 40, 30]);
    playSound(correct ? "correct" : "wrong");
    const elaborate = correct && !isAssessment && !q.steps && (q.cognitive === "apply" || q.cognitive === "analyze" || q.cognitive === "evaluate") && Math.random() < 0.3;
    settle(correct, chosen, res.xp, res.masteryBefore, res.masteryAfter, elaborate);
  };

  const onActivityDone = (r: ActivityResult) => {
    if (!act || phase !== "q") return;
    const ms = shownAt.current ? Date.now() - shownAt.current : 0;
    const newStreak = r.correct ? streak + 1 : 0;
    const res = useStore.getState().recordActivity(act, r, { ms, mode: cfg.mode, sessionId, sessionStreak: newStreak });
    setStreak(newStreak);
    if (!r.correct) rt.current.requeue.push({ concept: act.concepts[0], at: rt.current.served.length + 3 });
    setLast({ correct: r.correct, chosen: r.summary, xp: res.xp, elaborate: false });
    setResults((prev) => [...prev, { id: act.id, concept: act.concepts[0], title: act.title, correct: r.correct, xp: res.xp, before: res.masteryBefore, after: res.masteryAfter, chosen: r.summary, act }]);
    setPhase("fb");
  };

  const onNext = () => {
    const done = results.length;
    if (isBoss && hearts <= 0) return finish(results, hearts);
    if (done >= total) return finish(results, hearts);
    if (cfg.masterIt && done >= 6 && masteredSelection(cfg, useStore.getState().learn)) {
      setMasterDone(true);
      return finish(results, hearts);
    }
    const next = pickNext(cfg, rt.current);
    if (!next) return finish(results, hearts);
    serve(next);
  };

  /** A micro-lesson finished inside the session → mark taught, then continue with its guided question. */
  const onTeachDone = () => {
    if (!teach) return;
    useStore.getState().teachConcepts([teach.concept], teach.how);
    const next = pickNext(cfg, rt.current);
    if (!next) return finish(results, hearts);
    serve(next);
  };

  /** "Teach me this": re-teach the missed concept now, then a fresh guided question on it. */
  const onTeach = () => {
    const conceptId = q?.concept;
    if (!conceptId) return onNext();
    const t = teachItem(conceptId, "relearn");
    if (!t) return onNext();
    const c = CONCEPT_BY_ID[conceptId];
    const s = useStore.getState();
    const served = new Set(rt.current.served);
    const fu = c ? pickQuestionForConcept(c, { pool: [c], stats: s.concepts, qstats: s.qstats, recentQ: rt.current.served, recentConcepts: [], now: Date.now(), rng: mulberry32(Date.now() % 2 ** 31), types: cfg.types, band: [2, 3] }, served) : undefined;
    if (fu && !served.has(fu.id)) {
      rt.current.pending = { kind: "q", q: fu, guided: true };
      rt.current.served.push(fu.id);
      rt.current.servedConcepts.push(conceptId);
      setTotal((n) => n + 1);
    }
    rt.current.requeue = rt.current.requeue.filter((x) => x.concept !== conceptId);
    rt.current.taught.push(conceptId);
    serve(t);
  };

  /** Retrieval retry: a different question (or a fresh activity) on the same concept, right now. */
  const onFollowUp = () => {
    const conceptId = q?.concept ?? act?.concepts[0];
    if (!conceptId) return onNext();
    const c = CONCEPT_BY_ID[conceptId];
    const s = useStore.getState();
    const served = new Set(rt.current.served);
    let next: Item | undefined;
    if (act && c) {
      const fresh = pickActivity({ ...cfg, pool: [c], focus: undefined }, { ...rt.current, actKeys: [] }, s.concepts, [], Date.now(), mulberry32(Date.now() % 2 ** 31));
      if (fresh && fresh.id !== act.id) next = { kind: "a", a: fresh };
    }
    if (!next && c) {
      const fu = pickQuestionForConcept(c, { pool: [c], stats: s.concepts, qstats: s.qstats, recentQ: rt.current.served, recentConcepts: [], now: Date.now(), rng: mulberry32(Date.now() % 2 ** 31), types: cfg.types }, served);
      if (fu && !served.has(fu.id)) next = { kind: "q", q: fu };
    }
    if (!next) return onNext();
    rt.current.requeue = rt.current.requeue.filter((x) => x.concept !== conceptId);
    rt.current.served.push(next.kind === "q" ? next.q.id : next.kind === "a" ? next.a.id : next.concept);
    rt.current.servedConcepts.push(conceptId);
    setTotal((t) => t + 1);
    serve(next);
  };

  /** Swap the current visual activity for a question on the same concept (no result recorded). */
  const onSwapActivity = () => {
    if (!act) return;
    const c = CONCEPT_BY_ID[act.concepts[0]];
    const s = useStore.getState();
    const served = new Set(rt.current.served);
    const fu = c ? pickQuestionForConcept(c, { pool: [c], stats: s.concepts, qstats: s.qstats, recentQ: rt.current.served, recentConcepts: [], now: Date.now(), rng: mulberry32(Date.now() % 2 ** 31), types: cfg.types }, served) : undefined;
    const next: Item | undefined = fu ? { kind: "q", q: fu } : pickNext({ ...cfg, visual: false }, rt.current);
    if (!next) return;
    if (fu) {
      rt.current.served.push(fu.id);
      rt.current.servedConcepts.push(fu.concept);
    }
    serve(next);
  };

  const answered = results.length;
  const progress = total ? (answered / total) * 100 : 0;
  const world = cfg.worldId ? WORLD_BY_ID[cfg.worldId] : undefined;
  // repeated misses on this concept → "Teach me this" becomes the recommended action
  const relearnNow = useMemo(() => {
    if (!q || !last || last.correct) return false;
    const s = useStore.getState();
    return relearnConcepts(s.concepts, s.mistakes, [CONCEPT_BY_ID[q.concept]].filter(Boolean)).length > 0;
  }, [q, last]);
  const canTeach = !!q && !isAssessment && !!microLesson(q.concept);

  if (phase === "done") {
    return <Summary cfg={cfg} results={results} hearts={hearts} bonus={bonus} onAgain={onAgain} masterDone={masterDone} />;
  }

  return (
    <div className={cx(isBoss && "dark min-h-dvh bg-bg bg-[radial-gradient(ellipse_at_top,rgba(225,29,72,0.22),transparent_60%)] text-ink")}>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <div className={cx("sticky top-0 z-30 px-4 pb-3 pt-[max(env(safe-area-inset-top),12px)] backdrop-blur-xl", isBoss ? "bg-black/40 text-white" : "bg-bg/85")}>
          <div className="flex items-center gap-2">
            <button aria-label="End session" onClick={() => (answered === 0 ? router.back() : setConfirmExit(true))} className={cx("-ml-2 grid size-11 place-items-center rounded-full", isBoss ? "text-white/70" : "text-muted")}>
              <X size={22} />
            </button>
            <div className="relative h-3.5 flex-1 overflow-hidden rounded-full bg-line/70" role="progressbar" aria-valuenow={answered} aria-valuemax={total}>
              <div className={cx("h-full rounded-full transition-all duration-500", isBoss ? "bg-gradient-to-r from-rose-500 to-amber-400" : "bg-gradient-to-r from-brand to-brand-2")} style={{ width: `${progress}%` }} />
            </div>
            {isBoss ? (
              <div className="flex gap-0.5" data-testid="hearts" aria-label={`${hearts} hearts left`}>
                {Array.from({ length: cfg.hearts ?? 3 }).map((_, i) => (
                  <Heart key={i} size={20} className={cx("transition-all", i < hearts ? "fill-rose-500 text-rose-500" : "text-white/25")} />
                ))}
              </div>
            ) : (
              <div className={cx("flex items-center gap-1 text-sm font-extrabold", streak >= 3 ? "text-xp" : "text-muted")} data-testid="session-streak">
                <Flame size={18} className={streak >= 3 ? "fill-xp" : ""} />
                {streak}
              </div>
            )}
            <button
              aria-label={sound ? "Mute sounds" : "Turn sounds on"}
              onClick={() => useStore.getState().updateSettings({ sound: !sound })}
              className={cx("grid size-10 place-items-center rounded-full", isBoss ? "text-white/70" : "text-muted")}
              data-testid="sound-toggle"
            >
              {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
            </button>
          </div>
          <div className={cx("mt-2 flex items-center justify-between text-xs font-bold", isBoss ? "text-white/75" : "text-muted")}>
            <span className="truncate">
              {isBoss && <Swords size={13} className="mr-1 inline" />}
              {cfg.title}
              {world && !isBoss ? ` · W${world.num}` : ""}
              {cfg.mode === "test" ? " · Test" : cfg.mode === "pretest" ? " · Test out" : cfg.mode === "practice" ? " · Practice" : ""}
            </span>
            <span data-testid="session-count">{teach ? "Learn" : `${Math.min(answered + (phase === "q" ? 1 : 0), total)}/${total}`}</span>
          </div>
        </div>

        <main className="flex-1 px-4 pb-8 pt-2">
          {teach && (
            <div key={`${serveIdx}-teach-${teach.concept}`} className="animate-fade-up" data-testid="session-teach" data-concept={teach.concept}>
              <LessonStepper steps={teach.steps} compactHeader={`${teach.how === "relearn" ? "Relearn" : "Learn first"} · ${teach.lessonTitle}`} finishLabel="Got it — try one" onFinish={onTeachDone} />
            </div>
          )}
          {q && (
            <div key={`${serveIdx}-${q.id}`} className="animate-fade-up" data-guided={guided ? "true" : undefined}>
              {guided && phase === "q" && (
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-good-soft px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-good" data-testid="guided-badge">
                    <Sparkles size={13} /> Guided practice · no penalty
                  </span>
                  {!guide.hinted && (
                    <button onClick={() => setGuide((g) => ({ ...g, hinted: true }))} className="ml-auto inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-[12.5px] font-extrabold text-brand" data-testid="hint-btn">
                      <Lightbulb size={15} /> Hint
                    </button>
                  )}
                </div>
              )}
              {guided && guide.hinted && phase === "q" && (
                <div className="mb-3 flex items-start gap-2 rounded-2xl border-2 border-warn/35 bg-warn-soft p-3 text-[14.5px] font-semibold leading-snug" data-testid="guided-hint">
                  <Lightbulb size={18} className="mt-0.5 shrink-0 text-warn" />
                  <p>
                    {guide.tries > 0 && <span className="font-extrabold">Not quite — here&apos;s a hint. </span>}
                    {hintFor(q)}
                    {guide.tries > 0 && <span className="text-muted"> Try again.</span>}
                  </p>
                </div>
              )}
              <QuestionView q={q} revealed={phase === "fb"} askConfidence={askConf && !guided} onSubmit={onSubmit} eliminated={guide.eliminated} highlightSuffix={guided && guide.hinted} />
            </div>
          )}
          {act && (
            <div key={`${serveIdx}-${act.id}`} className="animate-fade-up" data-testid="session-activity" data-kind={act.kind}>
              <ActivityView act={act} onDone={onActivityDone} />
              {phase === "q" && (
                <button onClick={onSwapActivity} className="mx-auto mt-4 flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[13px] font-bold text-muted" data-testid="activity-skip">
                  <Shuffle size={14} /> Swap for a question
                </button>
              )}
            </div>
          )}
          {phase === "fb" && q && last && (
            <div className="mt-4">
              <Feedback
                q={q}
                correct={last.correct}
                chosenText={last.chosen}
                xp={last.xp}
                elaborate={last.elaborate}
                onNext={onNext}
                onFollowUp={!isAssessment ? onFollowUp : undefined}
                onTeach={canTeach ? onTeach : undefined}
                teachFirst={relearnNow}
                nextLabel={isBoss && hearts <= 0 ? "See result" : answered >= total ? "Finish" : "Continue"}
                scheduledNote={!isBoss && !guided}
              />
            </div>
          )}
          {phase === "fb" && act && last && (
            <div className={cx("sticky bottom-3 mt-4 rounded-3xl border-2 p-3 shadow-xl backdrop-blur", last.correct ? "border-good/40 bg-good-soft/95" : "border-warn/40 bg-warn-soft/95")} data-testid="activity-footer" data-correct={String(last.correct)}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[14px] font-extrabold">
                  {last.correct ? "Nicely done" : "Good work getting there"} <span className="font-semibold text-muted">· {last.chosen}</span>
                </p>
                {last.xp > 0 && <span className="shrink-0 font-black text-xp">+{last.xp} XP</span>}
              </div>
              {!last.correct && <p className="mt-0.5 text-[12px] font-semibold text-muted">This concept will come back — try a fresh one now to lock it in.</p>}
              <div className={cx("mt-2 grid gap-2", !last.correct ? "grid-cols-2" : "grid-cols-1")}>
                {!last.correct && (
                  <Button variant="secondary" size="md" onClick={onFollowUp} data-testid="activity-retry">
                    <Sparkles size={16} /> Try a fresh one
                  </Button>
                )}
                <Button size="md" onClick={onNext} data-testid="next">
                  {answered >= total ? "Finish" : "Continue"} <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </main>

        {confirmExit && (
          <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-4 sm:place-items-center" onClick={() => setConfirmExit(false)}>
            <div className="card w-full max-w-sm animate-pop p-5" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-extrabold">End this session?</h3>
              <p className="mt-1 text-sm text-muted">Everything you answered is already saved.</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="secondary" size="md" onClick={() => setConfirmExit(false)}>
                  Keep going
                </Button>
                <Button variant="primary" size="md" onClick={() => finish(results, isBoss ? 0 : hearts)}>
                  End
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Summary({ cfg, results, hearts, bonus, onAgain, masterDone }: { cfg: SessionConfig; results: Result[]; hearts: number; bonus: number; onAgain: () => void; masterDone: boolean }) {
  const router = useRouter();
  const correct = results.filter((r) => r.correct).length;
  const xp = results.reduce((a, r) => a + r.xp, 0) + bonus;
  const pct = results.length ? Math.round((correct / results.length) * 100) : 0;
  const isBoss = cfg.mode === "boss";
  const won = isBoss && hearts > 0 && results.length >= cfg.total;
  const isTest = cfg.mode === "test";
  const isPre = cfg.mode === "pretest";
  const selHref = cfg.sel ? `/unit?sel=${encodeURIComponent(selKey(cfg.sel))}` : null;
  const improved = useMemo(() => {
    const byConcept = new Map<string, { before: number; after: number }>();
    for (const r of results) {
      const e = byConcept.get(r.concept);
      if (!e) byConcept.set(r.concept, { before: r.before, after: r.after });
      else e.after = r.after;
    }
    return [...byConcept.entries()].map(([c, v]) => ({ c, delta: v.after - v.before, after: v.after })).sort((a, b) => b.delta - a.delta);
  }, [results]);
  const missed = results.filter((r) => !r.correct);
  const missedConcepts = Array.from(new Set(missed.map((m) => m.concept))).filter((c) => microLesson(c));

  if (results.length === 0) {
    return (
      <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
        <div>
          <div className="text-5xl">🗂️</div>
          <p className="mt-3 text-lg font-bold">{cfg.emptyMessage ?? "Nothing to practice here yet."}</p>
          <Button className="mt-6 w-full" onClick={() => router.push(selHref ?? "/")}>
            {selHref ? "Back" : "Back home"}
          </Button>
        </div>
      </div>
    );
  }

  const headline = isBoss
    ? won
      ? `${cfg.title} defeated!`
      : "So close — regroup and retry"
    : isPre
      ? pct >= 80
        ? "You tested out!"
        : "Let's learn this one first"
      : isTest
        ? pct >= 80
          ? "Test passed"
          : "Good check-in — now you know what to review"
        : masterDone
          ? "Mastered for now!"
          : pct >= 80
            ? "Outstanding round"
            : pct >= 50
              ? "Solid progress"
              : "Every miss is a lesson";
  const sub = isBoss
    ? won
      ? `Badge earned · +100 XP`
      : `${hearts} hearts left · the bosses reward focus`
    : isPre
      ? pct >= 80
        ? "Intro teaching skipped — you'll move straight to harder retrieval and application."
        : "The lesson will make the next round feel easy."
      : isTest
        ? `${cfg.title} · independent test`
        : masterDone
          ? `Every concept in ${cfg.title} reached clinical-scenario level.`
          : cfg.title;

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-10 pt-[max(env(safe-area-inset-top),24px)]" data-testid="summary" data-mode={cfg.mode}>
      <div className={cx("animate-pop rounded-3xl p-6 text-center text-white shadow-xl", isBoss ? (won ? "bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500" : "bg-gradient-to-br from-slate-600 to-slate-800") : "bg-gradient-to-br from-brand to-brand-2")}>
        <div className="text-5xl">{isBoss ? (won ? "🏆" : "🛡️") : isPre ? (pct >= 80 ? "🚀" : "📘") : pct >= 80 ? "🎉" : pct >= 50 ? "💪" : "🌱"}</div>
        <h1 className="mt-2 text-2xl font-extrabold" data-testid="summary-title">
          {headline}
        </h1>
        <p className="mt-1 text-white/85">{sub}</p>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="Score" value={`${correct}/${results.length}`} />
          <Stat label="Accuracy" value={`${pct}%`} />
          <Stat label="XP" value={`+${xp}`} testId="summary-xp" />
        </div>
      </div>

      {(isTest || isPre) && missedConcepts.length > 0 && (
        <div className="card mt-4 p-4" data-testid="summary-teach">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-muted">{isPre ? "Learn these first" : "Review what you missed"}</h2>
          <ul className="mt-2 space-y-2">
            {missedConcepts.slice(0, 5).map((c) => (
              <li key={c} className="flex items-center justify-between gap-2">
                <span className="min-w-0 text-sm font-semibold leading-snug">{CONCEPT_BY_ID[c]?.label}</span>
                <Button size="md" variant="secondary" className="shrink-0 gap-1 px-3 text-xs" onClick={() => router.push(`/learn?concept=${c}${selHref ? `&back=${encodeURIComponent(selHref)}` : ""}`)} data-testid="summary-teach-me">
                  <GraduationCap size={15} /> Teach me this
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {improved.some((i) => i.delta > 0) && (
        <div className="card mt-4 p-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-muted">Mastery gains</h2>
          <ul className="mt-2 space-y-2">
            {improved
              .filter((i) => i.delta > 0)
              .slice(0, 4)
              .map((i) => (
                <li key={i.c} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate font-semibold">{CONCEPT_BY_ID[i.c]?.label ?? i.c}</span>
                  <span className="shrink-0 font-extrabold text-good">+{Math.round(i.delta)}</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {missed.length > 0 && (
        <div className="card mt-4 p-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-muted">Review your misses</h2>
          <ul className="mt-2 space-y-3">
            {missed.map((m, i) =>
              m.q ? (
                <li key={m.id + i} className="text-sm">
                  <p className="font-semibold">{m.q.stem}</p>
                  <p className="mt-1 text-good">
                    <span className="font-bold">Answer: </span>
                    {correctAnswerText(m.q)}
                  </p>
                  <p className="mt-0.5 text-muted">{m.q.why}</p>
                </li>
              ) : (
                <li key={m.id + i} className="text-sm">
                  <p className="font-semibold">
                    <span className="mr-1.5 rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-extrabold text-brand">{m.act ? KIND_LABEL[m.act.kind] : "Activity"}</span>
                    {m.title}
                  </p>
                  <p className="mt-0.5 text-muted">{m.chosen} — {CONCEPT_BY_ID[m.concept]?.label}</p>
                </li>
              ),
            )}
          </ul>
          {!isPre && <p className="mt-3 text-xs font-semibold text-muted">These are in your Mistake Vault and will be scheduled to return.</p>}
        </div>
      )}

      <div className="mt-6 grid gap-2">
        {isPre && cfg.sel ? (
          pct >= 80 ? (
            <Button onClick={() => router.push(`/play?mode=practice&sel=${encodeURIComponent(selKey(cfg.sel!))}&min=10`)} data-testid="pretest-practice">
              <Layers size={18} /> Practice harder questions
            </Button>
          ) : (
            <Button onClick={() => router.push(`/learn?sel=${encodeURIComponent(selKey(cfg.sel!))}`)} data-testid="pretest-learn">
              <GraduationCap size={18} /> Start the lesson
            </Button>
          )
        ) : isBoss && !won ? (
          <Button onClick={onAgain} data-testid="retry">
            <RotateCcw size={18} /> Retry boss
          </Button>
        ) : (
          <Button onClick={onAgain} data-testid="again">
            <Trophy size={18} /> Another round
          </Button>
        )}
        {selHref ? (
          <Button variant="secondary" onClick={() => router.push(selHref)} data-testid="back-to-unit">
            <ArrowRight size={18} className="rotate-180" /> Back to {cfg.title}
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => router.push("/")} data-testid="home">
            <HomeIcon size={18} /> Home
          </Button>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="rounded-2xl bg-white/15 px-2 py-3">
      <div className="text-xl font-extrabold" data-testid={testId}>
        {value}
      </div>
      <div className="text-[11px] font-bold uppercase tracking-wider text-white/80">{label}</div>
    </div>
  );
}
