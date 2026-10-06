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
import { motion } from "motion/react";
import { CompareChallenge } from "@/components/activities/Visuals";
import { getActivity } from "@/data/activities";
import type { ActivityResult } from "@/lib/activities/types";

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

/** Step 1: predict-then-flip comparison cards (one row at a time). */
function FlipRows({ set, onReady }: { set: ContrastSet; onReady: () => void }) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const all = flipped.size === set.rows.length;
  return (
    <div className="animate-fade-up">
      <p className="mb-3 text-[14px] font-semibold text-muted">Predict each row in your head, then tap to flip it.</p>
      <div className="flex flex-col gap-2.5">
        {set.rows.map((r, ri) => {
          const open = flipped.has(ri);
          return (
            <button
              key={r.label}
              onClick={() => setFlipped((f) => new Set(f).add(ri))}
              className="card p-3 text-left"
              data-testid="flip-row"
              style={{ perspective: 800 }}
            >
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted">{r.label}</p>
              <div className={cx("mt-1.5 grid gap-1.5", set.columns.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
                {r.cells.map((cell, i) => (
                  <motion.div
                    key={`${i}-${open ? "o" : "c"}`}
                    initial={open ? { rotateY: 90, opacity: 0.3 } : false}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ duration: 0.35, delay: i * 0.1 }}
                    className={cx("rounded-xl p-2.5", open ? "bg-surface-2" : "bg-brand-soft")}
                  >
                    <span className={cx("mb-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-extrabold text-white", COL_COLORS[i])}>{set.columns[i]}</span>
                    <p className={cx("text-[13.5px] font-semibold leading-snug", !open && "text-brand/60")}>{open ? cell : "? tap to reveal"}</p>
                  </motion.div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
      {all && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-2xl bg-brand-soft p-4 text-sm">
          <span className="font-extrabold text-brand">Takeaway: </span>
          {set.takeaway}
        </motion.div>
      )}
      <Button className="mt-5 w-full" disabled={!all} onClick={onReady} data-testid="contrast-rebuild">
        {all ? "Now rebuild it from memory" : `Flip every row (${flipped.size}/${set.rows.length})`}
      </Button>
    </div>
  );
}

function SetView({ set, onBack }: { set: ContrastSet; onBack: () => void }) {
  const [phase, setPhase] = useState<"study" | "rebuild" | "quiz" | "done">("study");
  const [score, setScore] = useState(0);
  const [rebuilt, setRebuilt] = useState(false);
  const [sessionId] = useState(() => `contrast-${Date.now()}`);
  const act = useMemo(() => getActivity(`act:compare-${set.id}`), [set.id]);
  return (
    <Screen nav={false}>
      <TopBar onClose={onBack} title={set.title} />
      <div className="mb-4 grid grid-cols-3 gap-1.5 text-center text-[11px] font-extrabold uppercase tracking-wider">
        {(["See it", "Rebuild it", "Test it"] as const).map((l, i) => {
          const idx = phase === "study" ? 0 : phase === "rebuild" ? 1 : 2;
          return (
            <span key={l} className={cx("rounded-full py-1.5", i < idx ? "bg-good-soft text-good" : i === idx ? "bg-brand text-brand-ink" : "bg-surface-2 text-muted")}>
              {i + 1}. {l}
            </span>
          );
        })}
      </div>
      {phase === "study" && <FlipRows set={set} onReady={() => setPhase(act ? "rebuild" : "quiz")} />}
      {phase === "rebuild" && act && act.kind === "compare" && (
        <div className="animate-fade-up">
          <CompareChallenge
            act={act}
            onDone={(r: ActivityResult) => {
              setRebuilt(true);
              useStore.getState().recordActivity(act, r, { ms: 0, mode: "contrast", sessionId, sessionStreak: r.correct ? 1 : 0 });
            }}
          />
          <Button className="mt-4 w-full" disabled={!rebuilt} onClick={() => setPhase("quiz")} data-testid="contrast-start">
            {rebuilt ? "Test me" : "Place every piece first"}
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
