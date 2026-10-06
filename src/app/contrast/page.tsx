"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Check } from "lucide-react";
import { Screen, TopBar, Button, cx, haptic } from "@/components/ui";
import { CONTRASTS, type ContrastSet } from "@/data/contrasts";
import { contrastQuestion } from "@/data/bank";
import { useStore } from "@/lib/store";
import { shuffle } from "@/lib/rng";
import { celebrate } from "@/components/celebrate";
import { nowMs } from "@/lib/time";

const COL_COLORS = ["bg-indigo-500", "bg-rose-500", "bg-emerald-600", "bg-amber-500", "bg-cyan-600", "bg-fuchsia-500"];

export default function ContrastPage() {
  const [active, setActive] = useState<ContrastSet | null>(null);
  const cleared = useStore((s) => s.counters.contrastsCleared);
  if (active) return <SetView set={active} onBack={() => setActive(null)} />;
  return (
    <Screen>
      <TopBar back="/practice" title="Don't Mix These Up" />
      <p className="mb-4 text-sm text-muted">Side-by-side, then prove you can tell them apart. {cleared.length}/{CONTRASTS.length} cleared perfectly.</p>
      <div className="flex flex-col gap-3">
        {CONTRASTS.map((c) => (
          <button key={c.id} onClick={() => setActive(c)} className="card flex items-center gap-3 p-4 text-left" data-testid="contrast-set">
            <div className="flex -space-x-1.5">
              {c.columns.slice(0, 4).map((_, i) => (
                <span key={i} className={cx("size-5 rounded-full border-2 border-surface", COL_COLORS[i])} />
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold leading-tight">{c.title}</p>
              <p className="text-xs text-muted">{c.quiz.length} discrimination questions</p>
            </div>
            {cleared.includes(c.id) ? <Check className="text-good" /> : <ChevronRight className="text-muted" />}
          </button>
        ))}
      </div>
    </Screen>
  );
}

function SetView({ set, onBack }: { set: ContrastSet; onBack: () => void }) {
  const [phase, setPhase] = useState<"study" | "quiz" | "done">("study");
  const [score, setScore] = useState(0);
  return (
    <Screen nav={false}>
      <TopBar onClose={onBack} title={set.title} />
      {phase === "study" && (
        <div className="animate-fade-up">
          <div className="flex flex-col gap-3">
            {set.rows.map((r) => (
              <div key={r.label} className="card p-4">
                <p className="text-xs font-extrabold uppercase tracking-wider text-muted">{r.label}</p>
                <div className={cx("mt-2 grid gap-2", set.columns.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
                  {r.cells.map((cell, i) => (
                    <div key={i} className="rounded-xl bg-surface-2 p-2.5">
                      <span className={cx("mb-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-extrabold text-white", COL_COLORS[i])}>{set.columns[i]}</span>
                      <p className="text-[13.5px] font-semibold leading-snug">{cell}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-brand-soft p-4 text-sm">
            <span className="font-extrabold text-brand">Takeaway: </span>
            {set.takeaway}
          </div>
          <p className="mt-2 text-[11px] text-muted">Source: {set.source}</p>
          <Button className="mt-5 w-full" onClick={() => setPhase("quiz")} data-testid="contrast-start">
            Test me
          </Button>
        </div>
      )}
      {phase === "quiz" && (
        <Quiz
          set={set}
          onDone={(s) => {
            setScore(s);
            setPhase("done");
            const perfect = s === set.quiz.length;
            useStore.getState().recordContrast(set.id, perfect);
            if (perfect) celebrate("small");
          }}
        />
      )}
      {phase === "done" && (
        <div className="pt-8 text-center animate-pop" data-testid="contrast-done">
          <p className="text-5xl">{score === set.quiz.length ? "🎯" : "🔁"}</p>
          <p className="mt-2 text-2xl font-extrabold">
            {score}/{set.quiz.length}
          </p>
          <p className="text-muted">{score === set.quiz.length ? "Clean discrimination. Cleared!" : "Review the table once more, then try again."}</p>
          <div className="mt-6 grid gap-2">
            <Button
              onClick={() => {
                setScore(0);
                setPhase("study");
              }}
            >
              Review & retry
            </Button>
            <Button variant="secondary" onClick={onBack}>
              All sets
            </Button>
          </div>
        </div>
      )}
    </Screen>
  );
}

function Quiz({ set, onDone }: { set: ContrastSet; onDone: (score: number) => void }) {
  const items = useMemo(() => shuffle(set.quiz.map((_, i) => i)), [set]);
  const [k, setK] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [sessionId] = useState(() => `contrast-${Date.now()}`);
  const shown = useRef(0);
  useEffect(() => {
    shown.current = nowMs();
  }, [k]);
  const idx = items[k];
  const item = set.quiz[idx];

  const pick = (col: number) => {
    if (picked !== null) return;
    const ok = col === item.answer;
    setPicked(col);
    const st = ok ? streak + 1 : 0;
    setStreak(st);
    if (ok) setScore((s) => s + 1);
    haptic(ok ? 12 : [30, 40, 30]);
    const q = contrastQuestion(set.id, idx);
    if (q) useStore.getState().recordAnswer({ q, correct: ok, responseText: set.columns[col], ms: shown.current ? nowMs() - shown.current : 0, mode: "contrast", sessionId, sessionStreak: st });
  };

  const next = () => {
    if (k + 1 >= items.length) return onDone(score);
    setK(k + 1);
    setPicked(null);
  };

  return (
    <div key={k} className="animate-fade-up">
      <p className="text-xs font-extrabold uppercase tracking-wider text-muted">
        {k + 1}/{items.length} · Which one?
      </p>
      <p className="mt-2 text-xl font-bold leading-snug">{item.q}</p>
      <div className="mt-4 grid gap-2.5">
        {set.columns.map((c, i) => (
          <button
            key={c}
            disabled={picked !== null}
            onClick={() => pick(i)}
            data-testid="contrast-option"
            className={cx(
              "flex min-h-14 items-center gap-3 rounded-2xl border-2 px-4 text-left font-bold",
              picked === null ? "border-line bg-surface" : i === item.answer ? "border-good bg-good-soft" : i === picked ? "border-bad bg-bad-soft animate-shake" : "border-line bg-surface opacity-60",
            )}
          >
            <span className={cx("size-3 shrink-0 rounded-full", COL_COLORS[i])} />
            {c}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className={cx("mt-4 rounded-2xl p-4 text-sm animate-fade-up", picked === item.answer ? "bg-good-soft" : "bg-bad-soft")}>
          <p className="font-extrabold">{picked === item.answer ? "Correct" : `It's ${set.columns[item.answer]}`}</p>
          <p className="mt-1">{item.why}</p>
          <Button className="mt-3 w-full" onClick={next} data-testid="contrast-next">
            {k + 1 >= items.length ? "Finish" : "Next"}
          </Button>
        </div>
      )}
    </div>
  );
}
