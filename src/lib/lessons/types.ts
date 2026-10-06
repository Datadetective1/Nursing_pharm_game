import type { ClotClass } from "@/lib/activities/types";
import type { ChunkKey } from "@/lib/types";

/**
 * LEARN mode: short, visual micro-lessons that teach BEFORE any testing.
 *
 * One lesson per leaf study unit (src/data/library.ts). Each step teaches ~one idea, cites its source
 * (lecture file + slide), and lists the concept ids it teaches. A concept counts as "taught" once a
 * learner has seen at least one step that lists it — this powers first-exposure detection.
 *
 * Content rules: course materials are the authority (lecture notes/slides first; Memory Aid, Study Guide,
 * Rapid Reference as support). Never add facts that are not in the course files.
 */

/** Static visuals rendered inside a lesson card. All of them reuse the app's existing visual system. */
export type LessonVisual =
  | { kind: "raas"; target: "ace" | "receptor" | "aldosterone" }
  | { kind: "nephron"; drug: "furosemide" | "hctz" | "spironolactone" | "mannitol" }
  | { kind: "clot"; highlight: ClotClass[] }
  /** a SCALES key from src/data/activities/generated.ts (e.g. "dig", "aptt", "inr", "pht"); value optional */
  | { kind: "gauge"; scale: string; value?: number }
  /** a BODY activity id from src/data/activities/body.ts (e.g. "act:body-opioids") */
  | { kind: "body"; activity: string }
  | { kind: "timeline"; steps: string[] }
  | { kind: "potassium"; items: { label: string; dir: "up" | "down"; why: string }[] }
  /** a CONTRASTS set id from src/data/contrasts.ts */
  | { kind: "compare"; set: string }
  /** a hold-rule key from src/lib/explain.ts HOLD (e.g. "op-hold", "dig-hold") */
  | { kind: "hold"; concept: string }
  /** ANTIDOTES pair ids from src/data/antidotes.ts (e.g. ["ad-heparin"]) */
  | { kind: "antidote"; pairs: string[] }
  /** drug names with the suffix to highlight (e.g. { name: "Lisinopril", suffix: "pril" }) */
  | { kind: "suffix"; drugs: { name: string; suffix: string }[] }
  /** simple icon tiles (emoji + label), e.g. foods high in vitamin K */
  | { kind: "icons"; items: { icon: string; label: string; sub?: string }[] };

interface StepBase {
  /** unique within the lesson */
  id: string;
  /** short headline (≤ 48 chars), e.g. "Meet the -prils" */
  title: string;
  /** concept ids (src/data/curriculum.ts) this step teaches */
  concepts: string[];
  /** provenance, e.g. "M6L1 Antihypertensives · Slide 4" or "Memory Aid · Digoxin" */
  source: string;
}

export type LessonStep =
  /** "Meet the drugs": names (with suffix highlight) + one short line */
  | (StepBase & { kind: "meet"; say: string; drugs: { name: string; suffix?: string; note?: string }[]; hook?: string })
  /** one idea: ≤ 2 sentences + up to 3 short points + optional visual + optional memory hook */
  | (StepBase & { kind: "idea"; say: string; points?: string[]; visual?: LessonVisual; hook?: string; tag?: ChunkKey })
  /** cause → effect chain: DRUG ACTION → BODY EFFECT → SIDE EFFECT → NURSING CONCERN (3–5 links) */
  | (StepBase & { kind: "chain"; say?: string; links: { label: string; text: string }[]; hook?: string })
  /** "tap the danger": tap the right target(s); wrong taps explain themselves */
  | (StepBase & { kind: "tap"; say: string; prompt: string; targets: { label: string; icon?: string; correct: boolean; why: string }[]; reveal: string })
  /** key numbers (labs, hold parameters, limits) as big tiles */
  | (StepBase & { kind: "numbers"; say?: string; items: { value: string; label: string; tone?: "good" | "bad" | "warn" }[]; hook?: string })
  /** a guided "try one": recognition question with a hint; wrong answers teach, never punish */
  | (StepBase & { kind: "check"; prompt: string; options: string[]; answer: number; hint: string; why: string; highlight?: { name: string; suffix: string }[] })
  /** embed an existing interactive activity (static id like "act:sim-heparin" or template like "act:raas:1") */
  | (StepBase & { kind: "activity"; activity: string; say?: string });

export interface LessonSummary {
  /** drug / class name */
  drug: string;
  mechanism: string;
  /** biggest danger */
  danger: string;
  lab?: string;
  antidote?: string;
  /** nursing priority */
  priority: string;
}

export interface Lesson {
  /** = the leaf unit id in src/data/library.ts */
  unit: string;
  title: string;
  /** estimated minutes (3–8) */
  minutes: number;
  steps: LessonStep[];
  /**
   * One-sentence key fact per concept taught (every concept of the unit). Used as the strong hint in
   * guided practice, in "Teach me this", and in the lesson summary.
   */
  keys: Record<string, string>;
  summary: LessonSummary;
}
