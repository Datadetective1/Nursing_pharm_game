"use client";

import { useState } from "react";
import { Lightbulb, Search, Sparkles, RefreshCw, ArrowRight, BookOpen } from "lucide-react";
import type { Question } from "@/lib/types";
import { correctAnswerText } from "@/lib/engine/grade";
import { Button, cx } from "./ui";

interface Props {
  q: Question;
  correct: boolean;
  chosenText: string;
  xp: number;
  onNext: () => void;
  onFollowUp?: () => void;
  nextLabel?: string;
  /** hide the explanation behind a self-explanation prompt (elaborative interrogation) */
  elaborate?: boolean;
  scheduledNote?: boolean;
}

export function Feedback({ q, correct, chosenText, xp, onNext, onFollowUp, nextLabel = "Continue", elaborate, scheduledNote = true }: Props) {
  const [showWhy, setShowWhy] = useState(!elaborate);
  return (
    <div
      className={cx("animate-fade-up rounded-3xl border-2 p-4", correct ? "border-good/40 bg-good-soft" : "border-bad/40 bg-bad-soft")}
      data-testid="feedback"
      data-correct={String(correct)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cx("grid size-9 place-items-center rounded-full text-lg text-white", correct ? "bg-good animate-pop" : "bg-bad")}>{correct ? "✓" : "✕"}</span>
          <h3 className={cx("text-xl font-extrabold", correct ? "text-good" : "text-bad")}>{correct ? pickPraise(q.id) : "Not quite"}</h3>
        </div>
        {xp > 0 && (
          <span className="relative font-extrabold text-xp">
            +{xp} XP
            <span className="absolute -top-1 right-0 animate-rise text-xs">+{xp}</span>
          </span>
        )}
      </div>

      {!correct && (
        <div className="mt-3 space-y-2 text-[15px]">
          <div className="rounded-2xl bg-surface/70 p-3">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-bad">You chose</p>
            <p className="font-semibold">{chosenText}</p>
          </div>
          <div className="rounded-2xl bg-surface p-3">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-good">Correct answer</p>
            <p className="font-bold" data-testid="correct-answer">{correctAnswerText(q)}</p>
          </div>
        </div>
      )}

      {q.steps && q.steps.length > 0 && (
        <div className="mt-3 rounded-2xl bg-surface p-3">
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-wider text-muted">Step by step</p>
          <ol className="space-y-1.5 text-[14px]">
            {q.steps.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-soft text-[11px] font-extrabold text-brand">{i + 1}</span>
                <span className="font-medium">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {!q.steps && (
        <div className="mt-3">
          {showWhy ? (
            <div className="flex gap-2.5 rounded-2xl bg-surface p-3 text-[14.5px] leading-relaxed">
              <BookOpen size={18} className="mt-0.5 shrink-0 text-brand" />
              <p>
                <span className="font-extrabold">Why: </span>
                {q.why}
              </p>
            </div>
          ) : (
            <button onClick={() => setShowWhy(true)} className="w-full rounded-2xl border-2 border-dashed border-good/50 bg-surface/60 p-3 text-left" data-testid="elaborate">
              <p className="text-sm font-extrabold text-good">🧠 Explain it to yourself first…</p>
              <p className="text-[13px] text-muted">Why is this the right answer? Say it in one sentence, then tap to check.</p>
            </button>
          )}
        </div>
      )}

      {!correct && q.clue && (
        <div className="mt-2 flex gap-2.5 rounded-2xl bg-surface p-3 text-[14.5px] leading-relaxed">
          <Search size={18} className="mt-0.5 shrink-0 text-warn" />
          <p>
            <span className="font-extrabold">Clue you missed: </span>
            {q.clue}
          </p>
        </div>
      )}

      {q.hook && (!correct || showWhy) && (
        <div className="mt-2 flex gap-2.5 rounded-2xl bg-surface p-3 text-[14.5px] leading-relaxed">
          <Lightbulb size={18} className="mt-0.5 shrink-0 text-xp" />
          <p>
            <span className="font-extrabold">Memory hook: </span>
            {q.hook}
          </p>
        </div>
      )}

      <p className="mt-2 text-[11px] font-semibold text-muted">Source: {q.source}</p>

      {!correct && scheduledNote && (
        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-muted">
          <Sparkles size={13} /> Saved to your Mistake Vault — this concept will come back soon.
        </p>
      )}

      <div className={cx("mt-4 grid gap-2", !correct && onFollowUp ? "grid-cols-2" : "grid-cols-1")}>
        {!correct && onFollowUp && (
          <Button variant="secondary" onClick={onFollowUp} data-testid="follow-up">
            <RefreshCw size={18} /> Try one
          </Button>
        )}
        <Button variant={correct ? "good" : "primary"} onClick={onNext} data-testid="next">
          {nextLabel} <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}

const PRAISE = ["Nice!", "Nailed it", "Exactly", "Sharp!", "Correct", "You got it", "Spot on"];
function pickPraise(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PRAISE[h % PRAISE.length];
}
