import type { Lesson, LessonStep, LessonVisual } from "./types";
import { CONCEPT_BY_ID } from "@/data/curriculum";
import { UNITS, UNIT_BY_ID } from "@/data/library";
import { SCALES } from "@/data/activities/generated";
import { BODY } from "@/data/activities/body";
import { CONTRASTS } from "@/data/contrasts";
import { ANTIDOTES } from "@/data/antidotes";
import { getActivity } from "@/data/activities";
import { HOLD } from "@/lib/explain";

/** Lesson content checks: ids, sources, coverage of every unit concept, and "one idea per screen" size limits. */
export function validateLesson(l: Lesson): string[] {
  const e: string[] = [];
  const p = (m: string) => e.push(`[${l.unit}] ${m}`);
  const unit = UNIT_BY_ID[l.unit];
  if (!unit) p("unit does not exist in library.ts");
  if (l.minutes < 2 || l.minutes > 9) p(`minutes ${l.minutes} outside 2–9`);
  if (l.steps.length < 2 || l.steps.length > 13) p(`${l.steps.length} steps (want 2–13)`);
  const ids = new Set<string>();
  for (const s of l.steps) {
    if (ids.has(s.id)) p(`duplicate step id ${s.id}`);
    ids.add(s.id);
    e.push(...validateStep(s).map((m) => `[${l.unit}/${s.id}] ${m}`));
  }
  const taught = new Set(l.steps.flatMap((s) => s.concepts));
  for (const c of unit?.concepts ?? []) {
    if (!taught.has(c)) p(`unit concept ${c} is not taught by any step`);
    if (!l.keys[c]) p(`missing key fact for ${c}`);
  }
  for (const [c, k] of Object.entries(l.keys)) {
    if (!CONCEPT_BY_ID[c]) p(`key for unknown concept ${c}`);
    if (k.length > 190) p(`key for ${c} too long (${k.length})`);
  }
  if (!l.summary.drug || !l.summary.mechanism || !l.summary.danger || !l.summary.priority) p("summary needs drug, mechanism, danger, priority");
  return e;
}

const MAX = { title: 48, say: 230, point: 120, link: 90 };

function validateStep(s: LessonStep): string[] {
  const e: string[] = [];
  if (!s.title || s.title.length > MAX.title) e.push(`title length ${s.title?.length}`);
  if (!s.source || s.source.length < 6) e.push("missing source");
  if (!s.concepts.length) e.push("no concepts");
  for (const c of s.concepts) if (!CONCEPT_BY_ID[c]) e.push(`unknown concept ${c}`);
  const say = "say" in s ? s.say : undefined;
  if (say && say.length > MAX.say) e.push(`say too long (${say.length})`);
  switch (s.kind) {
    case "meet":
      if (!s.drugs.length || s.drugs.length > 6) e.push("meet needs 1–6 drugs");
      for (const d of s.drugs) if (d.suffix && !d.name.toLowerCase().includes(d.suffix.toLowerCase())) e.push(`suffix ${d.suffix} not in ${d.name}`);
      break;
    case "idea":
      if ((s.points?.length ?? 0) > 3) e.push("idea has more than 3 points");
      for (const pt of s.points ?? []) if (pt.length > MAX.point) e.push(`point too long (${pt.length}): ${pt.slice(0, 40)}…`);
      if (s.visual) e.push(...validateVisual(s.visual));
      break;
    case "chain":
      if (s.links.length < 2 || s.links.length > 5) e.push("chain needs 2–5 links");
      for (const k of s.links) if (k.text.length > MAX.link) e.push(`link too long: ${k.text.slice(0, 40)}…`);
      break;
    case "tap":
      if (s.targets.length < 2 || s.targets.length > 6) e.push("tap needs 2–6 targets");
      if (!s.targets.some((t) => t.correct)) e.push("tap has no correct target");
      for (const t of s.targets) if (!t.why) e.push(`target ${t.label} missing why`);
      if (!s.reveal) e.push("tap missing reveal");
      break;
    case "numbers":
      if (!s.items.length || s.items.length > 4) e.push("numbers needs 1–4 items");
      break;
    case "check":
      if (s.options.length < 2 || s.options.length > 4) e.push("check needs 2–4 options");
      if (s.answer < 0 || s.answer >= s.options.length) e.push("check answer out of range");
      if (new Set(s.options).size !== s.options.length) e.push("duplicate check options");
      if (!s.hint || !s.why) e.push("check needs hint + why");
      for (const h of s.highlight ?? []) if (!h.name.toLowerCase().includes(h.suffix.toLowerCase())) e.push(`highlight suffix ${h.suffix} not in ${h.name}`);
      break;
    case "activity":
      if (!getActivity(s.activity)) e.push(`unknown activity ${s.activity}`);
      break;
  }
  return e;
}

function validateVisual(v: LessonVisual): string[] {
  switch (v.kind) {
    case "gauge":
      return SCALES.some((x) => x.key === v.scale) ? [] : [`unknown gauge scale ${v.scale}`];
    case "body":
      return BODY.some((b) => b.id === v.activity) ? [] : [`unknown body map ${v.activity}`];
    case "compare":
      return CONTRASTS.some((c) => c.id === v.set) ? [] : [`unknown contrast set ${v.set}`];
    case "hold":
      return HOLD[v.concept] ? [] : [`unknown hold rule ${v.concept}`];
    case "antidote":
      return v.pairs.every((id) => ANTIDOTES.some((a) => a.id === id)) ? [] : [`unknown antidote pair in ${v.pairs.join(",")}`];
    case "timeline":
      return v.steps.length >= 2 && v.steps.length <= 6 ? [] : ["timeline needs 2–6 steps"];
    case "icons":
      return v.items.length >= 2 && v.items.length <= 8 ? [] : ["icons needs 2–8 items"];
    case "suffix":
      return v.drugs.every((d) => d.name.toLowerCase().includes(d.suffix.toLowerCase())) ? [] : ["suffix not in name"];
    default:
      return [];
  }
}

/** Every leaf unit in the library must have a valid lesson. */
export function validateAllLessons(lessons: Lesson[]): string[] {
  const e = lessons.flatMap(validateLesson);
  const have = new Set(lessons.map((l) => l.unit));
  for (const u of UNITS) if (!have.has(u.id)) e.push(`[${u.id}] has no lesson`);
  const dup = lessons.map((l) => l.unit).filter((u, i, a) => a.indexOf(u) !== i);
  for (const d of dup) e.push(`[${d}] has more than one lesson`);
  return e;
}
