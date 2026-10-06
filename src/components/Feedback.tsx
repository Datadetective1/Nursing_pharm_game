"use client";

import { useState } from "react";
import { Lightbulb, Search, Sparkles, RefreshCw, ArrowRight, BookOpen, ChevronDown, RotateCcw, GraduationCap } from "lucide-react";
import type { Question } from "@/lib/types";
import { correctAnswerText } from "@/lib/engine/grade";
import { VisualExplainer } from "./explain/VisualExplainer";
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
  /** "Teach me this": open a short micro-lesson on the concept instead of more questions */
  onTeach?: () => void;
  /** repeated misses → make Teach me this the primary action */
  teachFirst?: boolean;
}

/** Long text collapses to ~3 lines; the visual explainer carries the idea. */
function Clamp({ text, testId }: { text: string; testId?: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 170;
  return (
    <span data-testid={testId}>
      <span className={cx(long && !open && "line-clamp-3")}>{text}</span>
      {long && (
        <button onClick={() => setOpen((o) => !o)} className="mt-0.5 flex items-center gap-0.5 text-[12px] font-extrabold text-brand" data-testid="why-more">
          {open ? "Less" : "More"} <ChevronDown size={13} className={cx("transition-transform", open && "rotate-180")} />
        </button>
      )}
    </span>
  );
}

export function Feedback({ q, correct, chosenText, xp, onNext, onFollowUp, nextLabel = "Continue", elaborate, scheduledNote = true, onTeach, teachFirst }: Props) {
  const [showWhy, setShowWhy] = useState(!elaborate);
  const answerText = correctAnswerText(q);
  const stacked = q.type === "match" || q.type === "order" || q.type === "sata" || chosenText.length + answerText.length > 70;
  return (
    <div
      className={cx("animate-fade-up rounded-3xl border-2 p-4", correct ? "border-good/40 bg-good-soft" : "border-warn/35 bg-warn-soft")}
      data-testid="feedback"
      data-correct={String(correct)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cx("grid size-9 place-items-center rounded-full text-lg text-white", correct ? "bg-good animate-pop" : "bg-warn")}>{correct ? "✓" : <RotateCcw size={18} />}</span>
          <h3 className={cx("text-xl font-extrabold", correct ? "text-good" : "text-warn")}>{correct ? pickPraise(q.id) : "Not quite — let's fix it"}</h3>
        </div>
        {xp > 0 && (
          <span className="relative font-extrabold text-xp">
            +{xp} XP
            <span className="absolute -top-1 right-0 animate-rise text-xs">+{xp}</span>
          </span>
        )}
      </div>

      {!correct && (
        <div className={cx("mt-3 gap-1.5 text-[14px]", stacked ? "flex flex-col" : "grid grid-cols-[1fr_auto_1fr] items-stretch")} data-testid="misconception">
          <div className="rounded-2xl bg-surface/70 p-2.5">
            <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-warn">You chose</p>
            <p className="line-clamp-3 font-semibold text-muted line-through decoration-warn/60 decoration-2">{chosenText}</p>
          </div>
          <ArrowRight size={18} className={cx("self-center text-muted", stacked && "rotate-90")} />
          <div className="rounded-2xl bg-surface p-2.5 ring-2 ring-good/40">
            <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-good">Correct</p>
            <p className="font-bold" data-testid="correct-answer">
              {q.type === "order" && q.items.length >= 3 ? "The order shown below ↓" : answerText}
            </p>
          </div>
        </div>
      )}

      {!correct && q.clue && (
        <div className="mt-2 flex gap-2 rounded-2xl bg-surface px-3 py-2 text-[14px] leading-snug" data-testid="clue">
          <Search size={17} className="mt-0.5 shrink-0 text-warn" />
          <p>
            <span className="font-extrabold">Clue you missed: </span>
            {q.clue}
          </p>
        </div>
      )}

      {showWhy && <VisualExplainer q={q} correct={correct} chosenText={chosenText} />}

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
        <div className="mt-2">
          {showWhy ? (
            <div className="flex gap-2.5 rounded-2xl bg-surface p-3 text-[14.5px] leading-relaxed">
              <BookOpen size={18} className="mt-0.5 shrink-0 text-brand" />
              <p>
                <span className="font-extrabold">Why: </span>
                <Clamp text={q.why} testId="why" />
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

      {q.hook && (!correct || showWhy) && (
        <div className="mt-2 flex items-start gap-2 rounded-2xl bg-surface px-3 py-2 text-[14px] leading-snug">
          <Lightbulb size={17} className="mt-0.5 shrink-0 text-xp" />
          <p>
            <span className="font-extrabold">Hook: </span>
            {q.hook}
          </p>
        </div>
      )}

      <p className="mt-2 text-[11px] font-semibold text-muted">Source: {q.source}</p>

      {!correct && scheduledNote && (
        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-muted">
          <Sparkles size={13} /> Saved to your Mistake Vault — it will come back soon.
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2">
        {!correct && onTeach && (
          <Button variant={teachFirst ? "primary" : "secondary"} onClick={onTeach} data-testid="teach-me">
            <GraduationCap size={18} /> Teach me this
          </Button>
        )}
        {!correct && onFollowUp && (
          <Button onClick={onFollowUp} data-testid="follow-up">
            <RefreshCw size={18} /> Retry a similar question
          </Button>
        )}
        <Button variant={correct ? "good" : "secondary"} onClick={onNext} data-testid="next">
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
