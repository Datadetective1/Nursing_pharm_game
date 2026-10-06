"use client";

import { useEffect, useRef, useState } from "react";
import { Timer, Eye, ThumbsUp, RotateCcw } from "lucide-react";
import { Screen, TopBar, Button, cx, haptic } from "@/components/ui";
import { RAPID, RAPID_CATS, type RapidCard, type RapidCat } from "@/data/rapid";
import { shuffle, mulberry32 } from "@/lib/rng";
import { QuestionView } from "@/components/QuestionView";
import { Feedback } from "@/components/Feedback";
import { CONCEPTS } from "@/data/curriculum";
import { useStore } from "@/lib/store";
import { nextQuestion } from "@/lib/engine/select";
import { EXAM_TYPES } from "@/lib/engine/exam";
import { isCorrect, responseText, type Response } from "@/lib/engine/grade";
import type { Question } from "@/lib/types";

type Item = { kind: "card"; card: RapidCard } | { kind: "q"; q: Question };

export default function RapidPage() {
  const [minutes, setMinutes] = useState<5 | 10 | 20>(10);
  const [cats, setCats] = useState<RapidCat[]>([]);
  const [run, setRun] = useState(0);
  if (run > 0) return <RapidRun key={run} minutes={minutes} cats={cats} onExit={() => setRun(0)} onAgain={() => setRun((r) => r + 1)} />;
  const count = RAPID.filter((c) => !cats.length || cats.includes(c.cat)).length;
  return (
    <Screen>
      <TopBar back="/practice" title="Rapid Review" />
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-brand-2 p-5 text-white shadow-lg">
        <p className="text-4xl">⏱️</p>
        <h2 className="mt-2 text-2xl font-extrabold">Night before. Morning of.</h2>
        <p className="mt-1 text-white/85">Only the high-yield stuff: antidotes, dangerous effects, holds, labs, contraindications, priorities, and look-alikes. Recall first, then reveal.</p>
      </div>
      <p className="mt-5 text-xs font-extrabold uppercase tracking-wider text-muted">How long?</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {([5, 10, 20] as const).map((m) => (
          <button key={m} onClick={() => setMinutes(m)} data-testid={`rapid-${m}`} className={cx("min-h-16 rounded-2xl border-2 text-lg font-extrabold", minutes === m ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface")}>
            {m} min
          </button>
        ))}
      </div>
      <p className="mt-5 text-xs font-extrabold uppercase tracking-wider text-muted">Focus (optional)</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {(Object.keys(RAPID_CATS) as RapidCat[]).map((c) => {
          const on = cats.includes(c);
          return (
            <button key={c} onClick={() => setCats(on ? cats.filter((x) => x !== c) : [...cats, c])} className={cx("min-h-10 rounded-full border-2 px-3 text-sm font-bold", on ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface")}>
              {RAPID_CATS[c].icon} {RAPID_CATS[c].label}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted">{count} cards · every 5th item is an exam-style question.</p>
      <Button className="mt-6 w-full" onClick={() => setRun(1)} data-testid="rapid-start">
        <Timer size={18} /> Start {minutes}-minute review
      </Button>
    </Screen>
  );
}

function RapidRun({ minutes, cats, onExit, onAgain }: { minutes: number; cats: RapidCat[]; onExit: () => void; onAgain: () => void }) {
  const [queue, setQueue] = useState<Item[]>(() => shuffle(RAPID.filter((c) => !cats.length || cats.includes(c.cat))).map((card) => ({ kind: "card" as const, card })));
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [left, setLeft] = useState(minutes * 60);
  const [got, setGot] = useState(0);
  const [missed, setMissed] = useState<RapidCard[]>([]);
  const [qAnswered, setQAnswered] = useState<{ ok: boolean; chosen: string; xp: number } | null>(null);
  const [qs, setQs] = useState({ ok: 0, n: 0 });
  const [sessionId] = useState(() => `rapid-${Date.now()}`);
  const shown = useRef(0);
  const served = useRef<string[]>([]);
  const done = left <= 0 || idx >= queue.length;

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(t);
  }, [done]);

  // every 5th slot becomes a graded high-yield question
  useEffect(() => {
    if (done) return;
    if ((idx + 1) % 5 === 0 && queue[idx]?.kind === "card") {
      const s = useStore.getState();
      const pool = CONCEPTS.filter((c) => c.highYield && c.topic !== "calc" && (!cats.length || RAPID.some((r) => r.concept === c.id && cats.includes(r.cat))));
      const q = nextQuestion({
        pool: pool.length ? pool : CONCEPTS.filter((c) => c.highYield),
        stats: s.concepts,
        qstats: s.qstats,
        recentQ: [...s.log.slice(-40).map((l) => l.q), ...served.current],
        recentConcepts: [],
        now: Date.now(),
        rng: mulberry32(Date.now() % 2 ** 31),
        types: EXAM_TYPES,
      });
      if (q) {
        served.current.push(q.id);
        setQueue((qq) => [...qq.slice(0, idx), { kind: "q", q }, ...qq.slice(idx)]);
      }
    }
    shown.current = Date.now();
  }, [idx, done, queue, cats]);

  const item = queue[idx];

  const grade = (ok: boolean) => {
    if (!item || item.kind !== "card") return;
    haptic(ok ? 10 : 20);
    if (ok) setGot((g) => g + 1);
    else {
      setMissed((m) => (m.some((x) => x.id === item.card.id) ? m : [...m, item.card]));
      // re-queue the missed card a few items later
      setQueue((qq) => {
        const copy = [...qq];
        copy.splice(Math.min(copy.length, idx + 5), 0, { kind: "card", card: item.card });
        return copy;
      });
    }
    setRevealed(false);
    setIdx((i) => i + 1);
  };

  const answerQ = (r: Response) => {
    if (!item || item.kind !== "q") return;
    const ok = isCorrect(item.q, r);
    const chosen = responseText(item.q, r);
    const res = useStore.getState().recordAnswer({ q: item.q, correct: ok, responseText: chosen, ms: Date.now() - shown.current, mode: "rapid", sessionId, sessionStreak: ok ? 1 : 0 });
    setQs((s) => ({ ok: s.ok + (ok ? 1 : 0), n: s.n + 1 }));
    setQAnswered({ ok, chosen, xp: res.xp });
  };

  const mm = Math.max(0, Math.floor(left / 60));
  const ss = String(Math.max(0, left % 60)).padStart(2, "0");

  if (done) {
    return (
      <Screen nav={false}>
        <div className="pt-8" data-testid="rapid-done">
          <div className="text-center">
            <p className="text-5xl">🌙</p>
            <h1 className="mt-2 text-2xl font-extrabold">Review complete</h1>
            <p className="text-muted">
              {got} recalled · {missed.length} to revisit · {qs.ok}/{qs.n} exam-style correct
            </p>
          </div>
          {missed.length > 0 && (
            <div className="card mt-5 p-4">
              <p className="text-xs font-extrabold uppercase tracking-wider text-muted">One more look</p>
              <ul className="mt-2 space-y-3 text-sm">
                {missed.map((c) => (
                  <li key={c.id}>
                    <p className="font-bold">{c.front}</p>
                    <p className="text-muted">{c.back}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-6 grid gap-2">
            <Button onClick={onAgain}>
              <RotateCcw size={18} /> Go again
            </Button>
            <Button variant="secondary" onClick={onExit}>
              Done
            </Button>
          </div>
        </div>
      </Screen>
    );
  }

  return (
    <Screen nav={false}>
      <TopBar
        onClose={onExit}
        title="Rapid Review"
        right={
          <span className={cx("rounded-full px-3 py-1 font-mono text-sm font-extrabold", left < 60 ? "bg-bad-soft text-bad" : "bg-surface-2")} data-testid="rapid-timer">
            {mm}:{ss}
          </span>
        }
      />
      {item?.kind === "card" && (
        <div key={`${idx}-${item.card.id}`} className="animate-fade-up">
          <div className="card min-h-72 p-6" data-testid="rapid-card">
            <p className="text-xs font-extrabold uppercase tracking-wider text-brand">
              {RAPID_CATS[item.card.cat].icon} {RAPID_CATS[item.card.cat].label}
            </p>
            <p className="mt-3 text-[22px] font-extrabold leading-snug">{item.card.front}</p>
            {revealed ? (
              <div className="mt-5 animate-fade-up rounded-2xl bg-brand-soft p-4">
                <p className="text-[16px] font-semibold leading-relaxed">{item.card.back}</p>
                <p className="mt-2 text-[11px] text-muted">Source: {item.card.source}</p>
              </div>
            ) : (
              <p className="mt-5 text-sm font-semibold text-muted">Say the answer in your head first.</p>
            )}
          </div>
          <div className="mt-4">
            {!revealed ? (
              <Button className="w-full" onClick={() => setRevealed(true)} data-testid="rapid-reveal">
                <Eye size={18} /> Reveal
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => grade(false)} data-testid="rapid-missed">
                  <RotateCcw size={18} /> Missed it
                </Button>
                <Button variant="good" onClick={() => grade(true)} data-testid="rapid-got">
                  <ThumbsUp size={18} /> Got it
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      {item?.kind === "q" && (
        <div key={`q-${idx}`} className="animate-fade-up">
          <QuestionView q={item.q} revealed={!!qAnswered} askConfidence={false} onSubmit={(r) => answerQ(r)} />
          {qAnswered && (
            <div className="mt-4">
              <Feedback
                q={item.q}
                correct={qAnswered.ok}
                chosenText={qAnswered.chosen}
                xp={qAnswered.xp}
                onNext={() => {
                  setQAnswered(null);
                  setIdx((i) => i + 1);
                }}
              />
            </div>
          )}
        </div>
      )}
    </Screen>
  );
}
