"use client";

import { useMemo, useRef, useState } from "react";
import { Lock, Unlock, Check, X, KeyRound } from "lucide-react";
import { Screen, TopBar, Button, cx, haptic } from "@/components/ui";
import { LAB_LOCKS, type LabLock } from "@/data/labs";
import { mulberry32, shuffle } from "@/lib/rng";
import { useStore } from "@/lib/store";
import type { MCQQuestion } from "@/lib/types";
import { celebrate } from "@/components/celebrate";
import { nowMs } from "@/lib/time";

function makeLock(seed: number): LabLock {
  const rng = mulberry32(seed);
  const gen = LAB_LOCKS[Math.floor(rng() * LAB_LOCKS.length)];
  return gen(rng);
}

const KIND_LABEL = { lab: "Which lab?", range: "Target range", interpret: "Interpret", response: "Respond" };

export default function LabPage() {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [count, setCount] = useState(0);
  const lock = useMemo(() => makeLock(seed), [seed]);
  const perfect = useStore((s) => s.counters.labPerfectLocks);
  return (
    <Screen>
      <TopBar back="/practice" title="Lab Lock" right={<span className="text-xs font-bold text-muted">{perfect} perfect</span>} />
      <LockRun
        key={seed}
        lock={lock}
        onNext={() => {
          setSeed(Math.floor(Math.random() * 1e9));
          setCount((c) => c + 1);
        }}
        round={count}
      />
    </Screen>
  );
}

function LockRun({ lock, onNext, round }: { lock: LabLock; onNext: () => void; round: number }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [sessionId] = useState(() => `lab-${Date.now()}`);
  const shownAt = useRef(0);
  const step = lock.steps[stepIdx];
  const order = useMemo(() => shuffle(step ? step.options.map((_, i) => i) : []), [step]);
  const finished = results.length === lock.steps.length;
  const allOk = finished && results.every(Boolean);

  const choose = (orig: number) => {
    if (picked !== null) return;
    const ok = orig === step.answer;
    setPicked(orig);
    haptic(ok ? 12 : [30, 40, 30]);
    const q: MCQQuestion = {
      id: `lab-${lock.id}-${stepIdx}`,
      type: "mcq",
      topic: lock.topic,
      concept: lock.concept,
      drugs: [],
      difficulty: step.kind === "interpret" || step.kind === "response" ? 2 : 1,
      cognitive: step.kind === "interpret" || step.kind === "response" ? "apply" : "remember",
      format: step.kind === "interpret" ? "lab-interpretation" : "lab",
      stem: step.prompt,
      options: step.options,
      answer: step.answer,
      why: step.why,
      source: lock.source,
    };
    const streak = ok ? results.filter(Boolean).length + 1 : 0;
    useStore.getState().recordAnswer({ q, correct: ok, responseText: step.options[orig], ms: shownAt.current ? nowMs() - shownAt.current : 0, mode: "lab", sessionId, sessionStreak: streak, noVault: true });
    const next = [...results, ok];
    setResults(next);
    if (next.length === lock.steps.length) {
      const perfect = next.every(Boolean);
      useStore.getState().recordLabLock(perfect);
      if (perfect) celebrate("small");
    }
  };

  const advance = () => {
    setPicked(null);
    setStepIdx((i) => i + 1);
    shownAt.current = nowMs();
  };

  return (
    <div data-testid="lab-lock">
      <div className={cx("rounded-3xl p-5 text-white shadow-lg transition-colors", allOk ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-cyan-600 to-blue-800")}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-white/80">Lock #{round + 1} · {lock.drug}</span>
          {finished ? <Unlock size={22} /> : <Lock size={22} />}
        </div>
        <p className="mt-2 text-[17px] font-bold leading-snug" data-testid="lab-scenario">
          {lock.scenario}
        </p>
        <div className="mt-4 flex gap-2" aria-label="tumblers">
          {lock.steps.map((s, i) => (
            <div
              key={i}
              className={cx(
                "flex h-10 flex-1 items-center justify-center rounded-xl border-2 text-xs font-extrabold",
                i < results.length ? (results[i] ? "border-white bg-white text-emerald-700" : "border-rose-200 bg-rose-500/80") : i === stepIdx ? "border-white/80 bg-white/15" : "border-white/30",
              )}
            >
              {i < results.length ? results[i] ? <Check size={16} /> : <X size={16} /> : <KeyRound size={14} className="opacity-70" />}
            </div>
          ))}
        </div>
      </div>

      {!finished || picked !== null ? (
        step && (
          <div className="mt-5" key={stepIdx}>
            <p className="text-xs font-extrabold uppercase tracking-wider text-brand">
              Tumbler {stepIdx + 1} · {KIND_LABEL[step.kind]}
            </p>
            <p className="mt-1 text-lg font-bold leading-snug">{step.prompt}</p>
            <div className="mt-3 grid gap-2.5">
              {order.map((orig) => {
                const isAns = orig === step.answer;
                const isPick = orig === picked;
                return (
                  <button
                    key={orig}
                    disabled={picked !== null}
                    onClick={() => choose(orig)}
                    data-testid="lab-option"
                    className={cx(
                      "min-h-14 rounded-2xl border-2 px-4 py-3 text-left text-[15px] font-semibold",
                      picked === null ? "border-line bg-surface" : isAns ? "border-good bg-good-soft" : isPick ? "border-bad bg-bad-soft animate-shake" : "border-line bg-surface opacity-60",
                    )}
                  >
                    {step.options[orig]}
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <div className={cx("mt-4 animate-fade-up rounded-2xl p-4 text-sm", picked === step.answer ? "bg-good-soft" : "bg-bad-soft")}>
                <p className="font-extrabold">{picked === step.answer ? "Tumbler clicks into place." : "Jammed — here's the key:"}</p>
                <p className="mt-1">{step.why}</p>
                <p className="mt-1 text-xs text-muted">Source: {lock.source}</p>
                {stepIdx + 1 < lock.steps.length ? (
                  <Button className="mt-3 w-full" onClick={advance} data-testid="lab-next">
                    Next tumbler
                  </Button>
                ) : (
                  <Button className="mt-3 w-full" onClick={onNext} data-testid="lab-new">
                    {allOk ? "Unlocked! Next lock" : "Next lock"}
                  </Button>
                )}
              </div>
            )}
          </div>
        )
      ) : null}
    </div>
  );
}
