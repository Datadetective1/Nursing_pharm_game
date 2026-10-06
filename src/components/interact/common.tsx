"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Lightbulb, RotateCcw } from "lucide-react";
import type { MiniQuestion } from "@/lib/activities/types";
import { shuffle } from "@/lib/rng";
import { cx, haptic } from "@/components/ui";
import { playSound } from "@/lib/sound";

export function ActivityHeader({ label, icon, title, prompt }: { label: string; icon: ReactNode; title?: string; prompt?: ReactNode }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-brand">
        <span className="grid size-6 place-items-center rounded-lg bg-brand-soft">{icon}</span>
        {label}
      </div>
      {title && <h2 className="mt-1.5 text-[19px] font-extrabold leading-snug tracking-tight">{title}</h2>}
      {prompt && <div className="mt-1 text-[15px] font-semibold leading-snug text-muted">{prompt}</div>}
    </div>
  );
}

/** Feedback after a learner action; calm (not alarming) for misses. */
export function Toast({ ok, children, testId }: { ok: boolean; children: ReactNode; testId?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cx("mt-3 flex gap-2 rounded-2xl px-3.5 py-3 text-[14px] leading-snug", ok ? "bg-good-soft text-ink" : "bg-warn-soft text-ink")}
      data-testid={testId}
      data-ok={String(ok)}
    >
      {ok ? <Check size={18} className="mt-0.5 shrink-0 text-good" /> : <Lightbulb size={18} className="mt-0.5 shrink-0 text-warn" />}
      <div>{children}</div>
    </motion.div>
  );
}

/**
 * Short follow-up question (retrieval). Wrong taps don't reveal the answer at first —
 * the learner retries; after two misses the correct option is highlighted to tap.
 * onDone(firstTry) fires once the correct option is chosen.
 */
export function MiniQuestionView({ q, onDone, testId = "mini" }: { q: MiniQuestion; onDone: (firstTry: boolean) => void; testId?: string }) {
  const order = useMemo(() => shuffle(q.options.map((_, i) => i)), [q]);
  const multi = q.answer.length > 1;
  const [wrong, setWrong] = useState<number[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [misses, setMisses] = useState(0);

  const finish = (firstTry: boolean) => {
    setDone(true);
    playSound("correct");
    haptic(12);
    onDone(firstTry);
  };

  const tap = (i: number) => {
    if (done) return;
    if (multi) {
      setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
      return;
    }
    if (q.answer.includes(i)) finish(misses === 0);
    else {
      setWrong((w) => [...w, i]);
      setMisses((m) => m + 1);
      playSound("wrong");
      haptic([20, 30, 20]);
    }
  };

  const checkMulti = () => {
    const ok = picked.length === q.answer.length && q.answer.every((a) => picked.includes(a));
    if (ok) finish(misses === 0);
    else {
      setWrong(picked.filter((p) => !q.answer.includes(p)));
      setMisses((m) => m + 1);
      playSound("wrong");
    }
  };

  const reveal = misses >= 2 && !done;
  return (
    <div data-testid={testId}>
      <p className="text-[16px] font-bold leading-snug">{q.prompt}</p>
      <div className="mt-2.5 grid gap-2">
        {order.map((i) => {
          const isAns = q.answer.includes(i);
          const isWrong = wrong.includes(i);
          const isPicked = picked.includes(i);
          return (
            <motion.button
              key={i}
              onClick={() => tap(i)}
              disabled={done}
              data-testid={`${testId}-option`}
              data-correct={String(isAns)}
              animate={isWrong && !multi ? { x: [0, -6, 6, -3, 3, 0] } : undefined}
              transition={{ duration: 0.3 }}
              className={cx(
                "min-h-12 rounded-2xl border-2 px-3.5 py-2.5 text-left text-[14.5px] font-semibold transition-colors",
                done && isAns ? "border-good bg-good-soft" : isWrong ? "border-line bg-surface-2 text-muted line-through decoration-2" : isPicked ? "border-brand bg-brand-soft" : reveal && isAns ? "border-dashed border-good bg-surface" : "border-line bg-surface",
              )}
            >
              {q.options[i]}
            </motion.button>
          );
        })}
      </div>
      {multi && !done && (
        <button onClick={checkMulti} disabled={!picked.length} className="mt-2 min-h-11 w-full rounded-2xl bg-brand font-extrabold text-brand-ink disabled:opacity-40" data-testid={`${testId}-check`}>
          Check
        </button>
      )}
      <AnimatePresence>
        {misses > 0 && !done && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-warn">
            <RotateCcw size={14} /> {reveal ? "The dashed option is the one — tap it to lock it in." : "Not that one — try again."}
          </motion.p>
        )}
      </AnimatePresence>
      {done && <Toast ok>{q.why}</Toast>}
    </div>
  );
}

export function PillTag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "bad" | "brand" | "warn" }) {
  const t = { neutral: "bg-surface-2 text-muted", good: "bg-good-soft text-good", bad: "bg-bad-soft text-bad", brand: "bg-brand-soft text-brand", warn: "bg-warn-soft text-warn" }[tone];
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold", t)}>{children}</span>;
}
