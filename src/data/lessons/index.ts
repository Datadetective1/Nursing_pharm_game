import type { Lesson, LessonStep } from "@/lib/lessons/types";
import { m5Lessons } from "./m5";
import { m6Lessons } from "./m6";
import { m7Lessons } from "./m7";
import { m8Lessons } from "./m8";
import { calcLessons } from "./calc";
import { CONCEPT_BY_ID } from "@/data/curriculum";
import { GROUPS, UNIT_BY_ID } from "@/data/library";

export const LESSONS: Lesson[] = [...m5Lessons, ...m6Lessons, ...m7Lessons, ...m8Lessons, ...calcLessons];
export const LESSON_BY_UNIT: Record<string, Lesson> = Object.fromEntries(LESSONS.map((l) => [l.unit, l]));

/** Library order of units, used to pick the "home" lesson of a concept. */
const UNIT_ORDER = GROUPS.flatMap((g) => g.units);

/** The lesson + the steps that teach a concept (first unit in library order that teaches it). */
export function teachingFor(conceptId: string): { lesson: Lesson; steps: LessonStep[]; key?: string } | undefined {
  for (const uid of UNIT_ORDER) {
    const l = LESSON_BY_UNIT[uid];
    if (!l) continue;
    const steps = l.steps.filter((s) => s.concepts.includes(conceptId));
    if (steps.length) return { lesson: l, steps, key: l.keys[conceptId] };
  }
  return undefined;
}

/** One-line key fact for a concept (strong hint in guided practice). Falls back to the concept label. */
export function keyFact(conceptId: string): string {
  for (const uid of UNIT_ORDER) {
    const k = LESSON_BY_UNIT[uid]?.keys[conceptId];
    if (k) return k;
  }
  return CONCEPT_BY_ID[conceptId]?.label ?? "";
}

/**
 * A short micro-lesson for one concept (first-exposure teaching / "Teach me this"):
 * the concept's teaching steps (max 3, interactive "check" steps last) — never the whole lesson.
 */
export function microLesson(conceptId: string): { lesson: Lesson; steps: LessonStep[] } | undefined {
  const t = teachingFor(conceptId);
  if (!t) return undefined;
  const teach = t.steps.filter((s) => s.kind !== "check" && s.kind !== "activity").slice(0, 2);
  const check = t.steps.find((s) => s.kind === "check");
  const steps = [...teach, ...(check ? [check] : [])];
  return { lesson: t.lesson, steps: steps.length ? steps : t.steps.slice(0, 2) };
}

/** Lesson steps for a selection narrowed to some concepts (single-drug Learn). Keeps lesson order. */
export function lessonStepsFor(unitId: string, concepts?: string[]): LessonStep[] {
  const l = LESSON_BY_UNIT[unitId];
  if (!l) return [];
  if (!concepts) return l.steps;
  const set = new Set(concepts);
  const steps = l.steps.filter((s) => s.kind === "meet" || s.concepts.some((c) => set.has(c)));
  return steps.length ? steps : l.steps;
}

export const unitHasLesson = (unitId: string) => !!LESSON_BY_UNIT[unitId] && !!UNIT_BY_ID[unitId];
