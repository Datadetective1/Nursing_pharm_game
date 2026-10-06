"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, GraduationCap } from "lucide-react";
import type { LessonStep, LessonSummary } from "@/lib/lessons/types";
import { LessonStepView, needsInteraction } from "./LessonStepView";
import { Button, cx } from "@/components/ui";

/**
 * Walks through lesson steps one screen at a time (progressive disclosure).
 * Used by the full Learn page and, compactly, inside sessions for first-exposure micro-lessons.
 */
export function LessonStepper({
  steps,
  onFinish,
  onIndex,
  finishLabel = "Continue",
  compactHeader,
}: {
  steps: LessonStep[];
  onFinish: () => void;
  onIndex?: (i: number) => void;
  finishLabel?: string;
  /** inline (in-session) header label, e.g. "Learn first · ACE Inhibitors" */
  compactHeader?: string;
}) {
  const [i, setI] = useState(0);
  const [ready, setReady] = useState<Record<number, boolean>>({});
  const step = steps[i];
  const canGo = !needsInteraction(step) || ready[i];
  const go = (n: number) => {
    setI(n);
    onIndex?.(n);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const last = i === steps.length - 1;
  return (
    <div data-testid="lesson-stepper" data-index={i} data-total={steps.length}>
      {compactHeader && (
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-brand" data-testid="teach-badge">
            <GraduationCap size={14} /> {compactHeader}
          </span>
          <span className="ml-auto text-[12px] font-bold text-muted">
            {i + 1}/{steps.length}
          </span>
        </div>
      )}
      {compactHeader && (
        <div className="mb-4 flex gap-1" aria-hidden>
          {steps.map((_, n) => (
            <span key={n} className={cx("h-1.5 flex-1 rounded-full transition-colors", n <= i ? "bg-brand" : "bg-line")} />
          ))}
        </div>
      )}
      <LessonStepView key={`${i}-${step.id}`} step={step} onReady={(r) => setReady((m) => ({ ...m, [i]: r }))} />
      <div className="sticky bottom-3 z-10 mt-6 grid grid-cols-[auto_1fr] gap-2">
        <Button variant="secondary" size="lg" className="px-4" disabled={i === 0} onClick={() => go(i - 1)} aria-label="Previous screen" data-testid="lesson-back">
          <ArrowLeft size={18} />
        </Button>
        <Button size="lg" disabled={!canGo} onClick={() => (last ? onFinish() : go(i + 1))} data-testid="lesson-next">
          {last ? finishLabel : canGo ? "Continue" : step.kind === "check" ? "Pick an answer" : step.kind === "tap" ? "Tap to find it" : "Finish the activity"}
          {canGo && <ArrowRight size={18} />}
        </Button>
      </div>
    </div>
  );
}

/** "YOU JUST LEARNED" — only the categories that apply to this drug. */
export function LessonSummaryCard({ summary, xp }: { summary: LessonSummary; xp?: number }) {
  const rows: [string, string | undefined][] = [
    ["Drug / class", summary.drug],
    ["Mechanism", summary.mechanism],
    ["Biggest danger", summary.danger],
    ["Important lab", summary.lab],
    ["Antidote", summary.antidote],
    ["Nursing priority", summary.priority],
  ];
  return (
    <div className="animate-pop overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-2 p-5 text-white shadow-xl" data-testid="lesson-summary">
      <div className="flex items-center justify-between">
        <p className="text-xs font-extrabold uppercase tracking-widest text-white/80">You just learned</p>
        {xp ? <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-extrabold text-amber-200">+{xp} XP</span> : null}
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {rows
          .filter(([, v]) => !!v)
          .map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-white/12 px-3 py-2.5">
              <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-white/75">{k}</p>
              <p className="text-[15px] font-bold leading-snug">{v}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
