import { CONCEPT_BY_ID } from "@/data/curriculum";
import { ANTIDOTE_NAMES } from "@/data/antidotes";
import { CONTRASTS } from "@/data/contrasts";
import type { Activity, BodyRegion, MiniQuestion } from "./types";

const REGIONS: BodyRegion[] = ["brain", "eyes", "ears", "mouth", "lungs", "heart", "vessels", "liver", "gi", "kidneys", "blood", "skin", "muscle"];
const ROOM_OBJECTS = ["patient", "iv-bag", "pump", "monitor", "mar", "labs", "tray", "mouth", "skin", "patch", "pca", "vial", "med-cup", "bed", "calendar"];
const PALACE_ICONS = ["salad", "calendar", "baby", "brush", "shield", "flask", "pill", "syringe", "heart", "eye", "droplet", "banana", "clock", "alert", "smile", "wind", "bed", "thermometer", "ban", "scale"];

function checkMini(where: string, q: MiniQuestion | undefined, errs: string[]) {
  if (!q) return;
  if (!q.prompt || q.options.length < 2) errs.push(`${where} mini-question needs prompt + ≥2 options`);
  if (!q.answer.length || q.answer.some((a) => a < 0 || a >= q.options.length)) errs.push(`${where} mini-question answer out of range`);
  if (new Set(q.options).size !== q.options.length) errs.push(`${where} mini-question duplicate options`);
  if (!q.why) errs.push(`${where} mini-question missing why`);
}

/** Structural QA for activities (returns problems; empty = OK). */
export function validateActivities(acts: Activity[]): string[] {
  const errs: string[] = [];
  const ids = new Set<string>();
  for (const a of acts) {
    const w = `[${a.id}]`;
    if (!a.id.startsWith("act:")) errs.push(`${w} id must start with "act:"`);
    if (ids.has(a.id)) errs.push(`${w} duplicate id`);
    ids.add(a.id);
    if (!a.title) errs.push(`${w} missing title`);
    if (!a.source) errs.push(`${w} missing source`);
    if (!a.concepts.length) errs.push(`${w} needs ≥1 concept`);
    for (const c of a.concepts) if (!CONCEPT_BY_ID[c]) errs.push(`${w} unknown concept ${c}`);
    if (a.concepts[0] && CONCEPT_BY_ID[a.concepts[0]] && CONCEPT_BY_ID[a.concepts[0]].topic !== a.topic) errs.push(`${w} topic ${a.topic} != primary concept topic ${CONCEPT_BY_ID[a.concepts[0]].topic}`);
    switch (a.kind) {
      case "sim": {
        const d = a.data;
        if (d.nodes.length < 2 || d.nodes.length > 5) errs.push(`${w} sim needs 2–5 decision nodes`);
        for (const n of d.nodes) {
          if (n.choices.length < 2 || n.choices.length > 4) errs.push(`${w}/${n.id} needs 2–4 choices`);
          if (n.choices.filter((c) => c.correct).length !== 1) errs.push(`${w}/${n.id} needs exactly 1 correct choice`);
          if (n.choices.some((c) => !c.feedback)) errs.push(`${w}/${n.id} every choice needs feedback`);
        }
        if (!d.debrief.length) errs.push(`${w} needs debrief`);
        break;
      }
      case "room": {
        const d = a.data;
        if (d.hotspots.length < 4) errs.push(`${w} room needs ≥4 hotspots`);
        if (!d.hotspots.some((h) => h.problem)) errs.push(`${w} room needs ≥1 problem`);
        if (!d.hotspots.some((h) => !h.problem)) errs.push(`${w} room needs ≥1 non-problem`);
        for (const h of d.hotspots) if (!ROOM_OBJECTS.includes(h.object)) errs.push(`${w} unknown room object ${h.object}`);
        if (new Set(d.hotspots.map((h) => h.id)).size !== d.hotspots.length) errs.push(`${w} duplicate hotspot ids`);
        break;
      }
      case "monitor": {
        const d = a.data;
        if (d.tiles.length < 4) errs.push(`${w} monitor needs ≥4 tiles`);
        if (!d.tiles.some((t) => t.action)) errs.push(`${w} monitor needs ≥1 action tile`);
        if (!d.tiles.some((t) => !t.action)) errs.push(`${w} monitor needs ≥1 normal tile`);
        break;
      }
      case "chart":
        if (a.data.rows.length < 2) errs.push(`${w} chart needs ≥2 rows`);
        checkMini(w, a.data.question, errs);
        break;
      case "priority":
        if (a.data.findings.length < 3 || a.data.findings.length > 5) errs.push(`${w} priority needs 3–5 findings`);
        if (a.data.answer < 0 || a.data.answer >= a.data.findings.length) errs.push(`${w} priority answer out of range`);
        break;
      case "swipe":
        if (a.data.cards.length < 4) errs.push(`${w} swipe needs ≥4 cards`);
        if (!a.data.cards.some((c) => c.side === "left") || !a.data.cards.some((c) => c.side === "right")) errs.push(`${w} swipe needs both sides`);
        break;
      case "sorter": {
        const bins = new Set(a.data.bins.map((b) => b.id));
        if (bins.size < 2 || bins.size > 3) errs.push(`${w} sorter needs 2–3 bins`);
        if (a.data.cards.length < 4) errs.push(`${w} sorter needs ≥4 cards`);
        for (const c of a.data.cards) if (!bins.has(c.bin)) errs.push(`${w} card "${c.text}" has unknown bin`);
        for (const b of bins) if (!a.data.cards.some((c) => c.bin === b)) errs.push(`${w} bin ${b} has no cards`);
        break;
      }
      case "sequence":
        if (a.data.steps.length < 3 || a.data.steps.length > 6) errs.push(`${w} sequence needs 3–6 steps`);
        if (new Set(a.data.steps.map((s) => s.text)).size !== a.data.steps.length) errs.push(`${w} sequence duplicate steps`);
        checkMini(w, a.data.followUp, errs);
        break;
      case "body":
        for (const r of [...a.data.acts, ...a.data.effects]) if (!REGIONS.includes(r.region)) errs.push(`${w} unknown region ${r.region}`);
        if (!a.data.effects.length) errs.push(`${w} body needs ≥1 effect`);
        checkMini(w, a.data.quiz, errs);
        break;
      case "palace":
        if (a.data.objects.length < 4) errs.push(`${w} palace needs ≥4 objects`);
        for (const o of a.data.objects) {
          if (!PALACE_ICONS.includes(o.icon)) errs.push(`${w} unknown icon ${o.icon}`);
          if (o.x < 5 || o.x > 95 || o.y < 5 || o.y > 95) errs.push(`${w} object ${o.id} position must be 5–95`);
        }
        break;
      case "rescue": {
        const d = a.data;
        if (!ANTIDOTE_NAMES.includes(d.antidote)) errs.push(`${w} antidote "${d.antidote}" is not a course pairing name`);
        if (!d.kits.includes(d.antidote)) errs.push(`${w} kits must include the antidote`);
        for (const k of d.kits) if (!ANTIDOTE_NAMES.includes(k)) errs.push(`${w} kit "${k}" must be one of ANTIDOTE_NAMES`);
        if (new Set(d.kits).size !== d.kits.length || d.kits.length < 3) errs.push(`${w} needs ≥3 unique kits`);
        break;
      }
      case "compare":
        if (!CONTRASTS.some((c) => c.id === a.data.setId)) errs.push(`${w} unknown contrast set`);
        break;
      default:
        break;
    }
  }
  return errs;
}
