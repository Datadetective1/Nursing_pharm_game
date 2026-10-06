"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Layers, ArrowRight, GraduationCap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
import { LessonStepper, LessonSummaryCard } from "@/components/learn/LessonStepper";
import { useStore } from "@/lib/store";
import { DRUG_BY_ID, UNIT_BY_ID, parseSelection, resolveSelection, selKey, type Selection } from "@/data/library";
import { LESSON_BY_UNIT, lessonStepsFor, microLesson } from "@/data/lessons";
import { CONCEPT_BY_ID } from "@/data/curriculum";
import type { LessonStep, LessonSummary } from "@/lib/lessons/types";

interface Plan {
  /** selection key recorded as "lesson done" */
  key: string;
  title: string;
  steps: LessonStep[];
  summary?: LessonSummary;
  /** concepts taught by this lesson */
  concepts: string[];
  /** where Practice goes afterwards */
  practiceSel?: Selection;
  /** group/module lessons: position in the sequence */
  seq?: { index: number; total: number; nextSel?: Selection };
  /** single-concept "Teach me this" */
  concept?: string;
}

function planFor(sel: Selection | null, concept: string | null, done: Record<string, { lessonDone?: number }>): Plan | null {
  if (concept) {
    const m = microLesson(concept);
    if (!m) return null;
    return { key: `concept:${concept}`, title: CONCEPT_BY_ID[concept]?.label ?? m.lesson.title, steps: m.steps, concepts: [concept], concept, practiceSel: { kind: "unit", id: m.lesson.unit } };
  }
  if (!sel) return null;
  if (sel.kind === "unit" || sel.kind === "drug") {
    const unitId = sel.kind === "unit" ? sel.id : DRUG_BY_ID[sel.id]?.unit;
    const lesson = unitId ? LESSON_BY_UNIT[unitId] : undefined;
    if (!lesson) return null;
    const r = resolveSelection(sel);
    const steps = lessonStepsFor(lesson.unit, sel.kind === "drug" ? r.concepts : undefined);
    const taught = Array.from(new Set(steps.flatMap((s) => s.concepts)));
    return { key: selKey(sel), title: sel.kind === "drug" ? `${r.title} · ${lesson.title}` : lesson.title, steps, summary: lesson.summary, concepts: taught, practiceSel: sel };
  }
  // group / module → work through its unit lessons in order, starting with the first unfinished one
  const r = resolveSelection(sel);
  const units = r.units.filter((u) => LESSON_BY_UNIT[u]);
  if (!units.length) return null;
  const idx = Math.max(0, units.findIndex((u) => !done[`unit:${u}`]?.lessonDone));
  const unitId = units[idx];
  const lesson = LESSON_BY_UNIT[unitId];
  return {
    key: `unit:${unitId}`,
    title: lesson.title,
    steps: lesson.steps,
    summary: lesson.summary,
    concepts: Array.from(new Set(lesson.steps.flatMap((s) => s.concepts))),
    practiceSel: { kind: "unit", id: unitId },
    seq: { index: idx, total: units.length, nextSel: idx + 1 < units.length ? sel : undefined },
  };
}

function LearnInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const sel = parseSelection(sp.get("sel"));
  const concept = sp.get("concept");
  const back = sp.get("back");
  const [round, setRound] = useState(0);
  // freeze the plan for this round so finishing a lesson doesn't swap it out mid-summary
  const plan = useMemo(() => planFor(sel, concept, useStore.getState().units), [sp, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState<{ xp: number } | null>(null);
  const exitTo = back ?? (sel ? `/unit?sel=${encodeURIComponent(selKey(sel))}` : "/library");

  if (!plan) {
    return (
      <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
        <div>
          <div className="text-5xl">📘</div>
          <p className="mt-3 text-lg font-bold">No lesson for this yet.</p>
          <Button className="mt-6 w-full" onClick={() => router.push("/library")}>
            Drug Library
          </Button>
        </div>
      </div>
    );
  }

  const finish = () => {
    const s = useStore.getState();
    if (plan.concept) {
      s.teachConcepts([plan.concept], "relearn");
      setDone({ xp: 0 });
    } else {
      const res = s.completeLesson(plan.key, plan.concepts);
      setDone(res);
    }
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const progress = done ? 100 : ((idx + 1) / plan.steps.length) * 100;
  const practiceHref = plan.practiceSel ? `/play?mode=practice&sel=${encodeURIComponent(selKey(plan.practiceSel))}&min=5` : "/library";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col" data-testid="learn-page">
      <div className="sticky top-0 z-30 bg-bg/85 px-4 pb-3 pt-[max(env(safe-area-inset-top),12px)] backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button aria-label="Close lesson" onClick={() => router.push(exitTo)} className="-ml-2 grid size-11 place-items-center rounded-full text-muted" data-testid="learn-close">
            <X size={22} />
          </button>
          <div className="relative h-3.5 flex-1 overflow-hidden rounded-full bg-line/70" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemax={100}>
            <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-2 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-brand">
            <GraduationCap size={13} /> Learn
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs font-bold text-muted">
          <span className="truncate" data-testid="learn-heading">
            {plan.concept ? "Teach me this · " : ""}
            {plan.title}
            {plan.seq ? ` · lesson ${plan.seq.index + 1} of ${plan.seq.total}` : ""}
          </span>
          <span>{done ? "Done" : `${idx + 1}/${plan.steps.length}`}</span>
        </div>
      </div>

      <main className="flex-1 px-4 pb-10 pt-2">
        {!done ? (
          <LessonStepper key={`${plan.key}-${round}`} steps={plan.steps} onIndex={setIdx} onFinish={finish} finishLabel={plan.concept ? "I've got it" : "Finish lesson"} />
        ) : (
          <div className="animate-fade-up" data-testid="learn-done">
            {plan.summary ? (
              <LessonSummaryCard summary={plan.summary} xp={done.xp} />
            ) : (
              <div className="animate-pop rounded-3xl bg-gradient-to-br from-brand to-brand-2 p-5 text-white shadow-xl" data-testid="lesson-summary">
                <p className="text-xs font-extrabold uppercase tracking-widest text-white/80">You just relearned</p>
                <p className="mt-1 text-lg font-extrabold leading-snug">{plan.title}</p>
              </div>
            )}
            <div className="mt-5 grid gap-2">
              {plan.concept ? (
                <Button onClick={() => router.push(`/play?mode=similar&concept=${plan.concept}`)} data-testid="learn-try">
                  <RefreshCw size={18} /> Try a question on it
                </Button>
              ) : (
                <Button onClick={() => router.push(practiceHref)} data-testid="learn-practice">
                  I&apos;ve got it → Practice <ArrowRight size={18} />
                </Button>
              )}
              {plan.seq?.nextSel && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDone(null);
                    setIdx(0);
                    setRound((r) => r + 1);
                  }}
                  data-testid="learn-next-lesson"
                >
                  <Layers size={18} /> Next lesson
                </Button>
              )}
              <Button variant="secondary" onClick={() => router.push(exitTo)} data-testid="learn-back">
                {back ? "Back" : sel ? `Back to ${resolveSelection(sel).title || UNIT_BY_ID[plan.key.slice(5)]?.title || "library"}` : "Drug Library"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={null}>
      <LearnInner />
    </Suspense>
  );
}

