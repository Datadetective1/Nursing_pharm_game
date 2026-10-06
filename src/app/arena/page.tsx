"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Timer, Zap, Grid2x2, Check, X, Trophy } from "lucide-react";
import { Screen, TopBar, Button, cx, haptic } from "@/components/ui";
import { ANTIDOTES, type AntidotePair } from "@/data/antidotes";
import { antidoteQuestion } from "@/data/bank";
import { useStore } from "@/lib/store";
import { shuffle } from "@/lib/rng";
import { celebrate } from "@/components/celebrate";
import { nowMs } from "@/lib/time";

const ROUND = 8;
const SECONDS = 8;

function record(pair: AntidotePair, correct: boolean, chosen: string, ms: number, sessionId: string, streak: number) {
  const q = antidoteQuestion(pair.id);
  if (!q) return 0;
  return useStore.getState().recordAnswer({ q, correct, responseText: chosen, ms, mode: "arena", sessionId, sessionStreak: streak }).xp;
}

export default function ArenaPage() {
  const [mode, setMode] = useState<"menu" | "speed" | "match">("menu");
  const [timed, setTimed] = useState(false);
  const [key, setKey] = useState(0);
  const best = useStore((s) => s.counters.arenaBest);

  if (mode === "speed") return <Speed key={key} timed={timed} onExit={() => setMode("menu")} onAgain={() => setKey((k) => k + 1)} />;
  if (mode === "match") return <MatchBoard key={key} onExit={() => setMode("menu")} onAgain={() => setKey((k) => k + 1)} />;

  return (
    <Screen>
      <TopBar back="/practice" title="Antidote Arena" />
      <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-700 p-5 text-white shadow-lg">
        <p className="text-4xl">🧯</p>
        <h2 className="mt-2 text-2xl font-extrabold">Drug → antidote, fast.</h2>
        <p className="mt-1 text-white/85">Only the pairings in your course materials. Best speed round: {best}/{ROUND}.</p>
      </div>
      <div className="mt-5 grid gap-3">
        <button onClick={() => setMode("speed")} className="card flex items-center gap-4 p-4 text-left" data-testid="arena-speed">
          <span className="grid size-12 place-items-center rounded-2xl bg-emerald-500 text-white">
            <Zap size={22} />
          </span>
          <span className="flex-1">
            <span className="block font-extrabold">Speed round</span>
            <span className="block text-sm text-muted">{ROUND} drugs · pick the antidote</span>
          </span>
        </button>
        <button onClick={() => setMode("match")} className="card flex items-center gap-4 p-4 text-left" data-testid="arena-match">
          <span className="grid size-12 place-items-center rounded-2xl bg-teal-600 text-white">
            <Grid2x2 size={22} />
          </span>
          <span className="flex-1">
            <span className="block font-extrabold">Match board</span>
            <span className="block text-sm text-muted">Pair 5 drugs with their antidotes</span>
          </span>
        </button>
        <label className="card flex items-center justify-between p-4">
          <span className="flex items-center gap-3 font-bold">
            <Timer size={20} className="text-muted" /> Timed speed round ({SECONDS}s each)
          </span>
          <input type="checkbox" className="size-6 accent-emerald-600" checked={timed} onChange={(e) => setTimed(e.target.checked)} data-testid="arena-timed" />
        </label>
      </div>
      <div className="card mt-5 p-4">
        <p className="text-xs font-extrabold uppercase tracking-wider text-muted">All course pairings</p>
        <ul className="mt-2 space-y-1.5 text-sm">
          {ANTIDOTES.map((a) => (
            <li key={a.id} className="flex justify-between gap-3">
              <span className="text-muted">{a.drug}</span>
              <span className="text-right font-bold">{a.antidote}</span>
            </li>
          ))}
        </ul>
      </div>
    </Screen>
  );
}

function Speed({ timed, onExit, onAgain }: { timed: boolean; onExit: () => void; onAgain: () => void }) {
  const [deck] = useState(() => shuffle(ANTIDOTES).slice(0, ROUND));
  const [sessionId] = useState(() => `arena-${Date.now()}`);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [left, setLeft] = useState(SECONDS);
  const [done, setDone] = useState(false);
  const shown = useRef(0);
  const pair = deck[i];
  const q = useMemo(() => (pair ? antidoteQuestion(pair.id) : undefined), [pair]);
  const options = useMemo(() => (q ? shuffle(q.options) : []), [q]);

  useEffect(() => {
    shown.current = nowMs();
  }, [i]);

  const choose = (opt: string | null) => {
    if (picked !== null || !pair) return;
    const ok = opt === pair.antidote;
    const st = ok ? streak + 1 : 0;
    setPicked(opt ?? "(time's up)");
    setStreak(st);
    if (ok) setScore((s) => s + 1);
    haptic(ok ? 12 : [30, 40, 30]);
    setXp((x) => x + record(pair, ok, opt ?? "(time's up)", shown.current ? nowMs() - shown.current : 0, sessionId, st));
  };

  useEffect(() => {
    if (!timed || picked !== null || done) return;
    const t = setTimeout(() => {
      if (left <= 1) {
        setLeft(0);
        choose(null);
      } else setLeft(left - 1);
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timed, left, picked, done]);

  const next = () => {
    if (i + 1 >= deck.length) {
      const final = score;
      setDone(true);
      useStore.getState().recordArena(final, deck.length);
      if (final === deck.length) celebrate("big");
      return;
    }
    setI(i + 1);
    setPicked(null);
    setLeft(SECONDS);
  };

  if (done) {
    return (
      <Screen nav={false}>
        <div className="pt-10 text-center" data-testid="arena-result">
          <Trophy size={56} className="mx-auto text-amber-500" />
          <h1 className="mt-3 text-3xl font-extrabold">
            {score}/{deck.length}
          </h1>
          <p className="text-muted">{score === deck.length ? "Perfect round — Antidote Ace material." : "Every pairing you missed is now in your vault."}</p>
          <p className="mt-2 font-extrabold text-xp">+{xp} XP</p>
          <div className="mt-8 grid gap-2">
            <Button onClick={onAgain}>Play again</Button>
            <Button variant="secondary" onClick={onExit}>
              Back
            </Button>
          </div>
        </div>
      </Screen>
    );
  }

  const correct = picked !== null && picked === pair.antidote;
  return (
    <Screen nav={false}>
      <TopBar onClose={onExit} title={`Speed round · ${i + 1}/${deck.length}`} right={<span className="font-extrabold text-good">{score} ✓</span>} />
      {timed && (
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full bg-emerald-500 transition-all duration-1000 ease-linear" style={{ width: `${(left / SECONDS) * 100}%` }} />
        </div>
      )}
      <div className="card animate-pop p-6 text-center" key={i}>
        <p className="text-xs font-extrabold uppercase tracking-wider text-muted">{pair.drugClass}</p>
        <p className="mt-1 text-2xl font-extrabold leading-tight" data-testid="arena-drug">
          {pair.drug}
        </p>
        <p className="mt-1 text-sm text-muted">What&apos;s the antidote?</p>
      </div>
      <div className="mt-4 grid gap-2.5">
        {options.map((o) => {
          const isAns = o === pair.antidote;
          const isPick = o === picked;
          return (
            <button
              key={o}
              disabled={picked !== null}
              onClick={() => choose(o)}
              data-testid="arena-option"
              className={cx(
                "flex min-h-14 items-center justify-between rounded-2xl border-2 px-4 text-left font-bold transition-all",
                picked === null ? "border-line bg-surface active:scale-[0.99]" : isAns ? "border-good bg-good-soft" : isPick ? "border-bad bg-bad-soft animate-shake" : "border-line bg-surface opacity-60",
              )}
            >
              {o}
              {picked !== null && isAns && <Check className="text-good" size={20} />}
              {picked !== null && isPick && !isAns && <X className="text-bad" size={20} />}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className={cx("mt-4 animate-fade-up rounded-2xl p-4 text-sm", correct ? "bg-good-soft" : "bg-bad-soft")}>
          <p className="font-extrabold">{correct ? "Correct!" : `${pair.drug} → ${pair.antidote}`}</p>
          <p className="mt-1">{pair.note}</p>
          <p className="mt-1 text-xs text-muted">Source: {pair.source}</p>
          <Button className="mt-3 w-full" onClick={next} data-testid="arena-next">
            {i + 1 >= deck.length ? "See score" : "Next"}
          </Button>
        </div>
      )}
    </Screen>
  );
}

function MatchBoard({ onExit, onAgain }: { onExit: () => void; onAgain: () => void }) {
  const [pairs] = useState(() => {
    const out: AntidotePair[] = [];
    for (const a of shuffle(ANTIDOTES)) {
      if (out.length >= 5) break;
      if (!out.some((o) => o.antidote === a.antidote)) out.push(a);
    }
    return out;
  });
  const [rights] = useState(() => shuffle(pairs.map((p) => p.antidote)));
  const [sel, setSel] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, boolean>>({});
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);
  const [errors, setErrors] = useState(0);
  const [sessionId] = useState(() => `match-${Date.now()}`);
  const start = useRef(0);
  useEffect(() => {
    start.current = nowMs();
  }, []);
  const done = Object.keys(matched).length === pairs.length;

  const tryMatch = (right: string) => {
    if (!sel) return;
    const pair = pairs.find((p) => p.id === sel)!;
    const ok = pair.antidote === right;
    if (ok) {
      setMatched((m) => ({ ...m, [pair.id]: true }));
      haptic(12);
      record(pair, true, right, nowMs() - start.current, sessionId, 0);
      if (Object.keys(matched).length + 1 === pairs.length) {
        useStore.getState().recordArena(pairs.length - errors, pairs.length);
        if (errors === 0) celebrate("big");
      }
    } else {
      setErrors((e) => e + 1);
      setWrongFlash(right);
      haptic([30, 40, 30]);
      record(pair, false, right, nowMs() - start.current, sessionId, 0);
      setTimeout(() => setWrongFlash(null), 500);
    }
    setSel(null);
  };

  return (
    <Screen nav={false}>
      <TopBar onClose={onExit} title="Match board" right={<span className="text-sm font-bold text-muted">{errors} miss{errors === 1 ? "" : "es"}</span>} />
      <p className="mb-3 text-sm text-muted">Tap a drug, then its antidote.</p>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-2.5">
          {pairs.map((p) => (
            <button
              key={p.id}
              disabled={!!matched[p.id]}
              onClick={() => setSel(p.id)}
              data-testid="board-drug"
              className={cx("min-h-16 rounded-2xl border-2 px-3 text-left text-sm font-bold transition-all", matched[p.id] ? "border-good bg-good-soft opacity-70" : sel === p.id ? "border-brand bg-brand-soft" : "border-line bg-surface")}
            >
              {p.drug}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2.5">
          {rights.map((r) => {
            const used = pairs.some((p) => p.antidote === r && matched[p.id]);
            return (
              <button
                key={r}
                disabled={used || !sel}
                onClick={() => tryMatch(r)}
                data-testid="board-antidote"
                className={cx("min-h-16 rounded-2xl border-2 px-3 text-left text-sm font-bold transition-all disabled:opacity-100", used ? "border-good bg-good-soft opacity-70" : wrongFlash === r ? "border-bad bg-bad-soft animate-shake" : sel ? "border-dashed border-brand bg-surface" : "border-line bg-surface")}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>
      {done && (
        <div className="mt-6 animate-fade-up rounded-3xl bg-good-soft p-5 text-center" data-testid="board-done">
          <p className="text-3xl">{errors === 0 ? "🏆" : "✅"}</p>
          <p className="mt-1 text-xl font-extrabold">{errors === 0 ? "Flawless board!" : `Board cleared with ${errors} miss${errors === 1 ? "" : "es"}`}</p>
          <div className="mt-4 grid gap-2">
            <Button onClick={onAgain}>New board</Button>
            <Button variant="secondary" onClick={onExit}>
              Back
            </Button>
          </div>
        </div>
      )}
    </Screen>
  );
}
