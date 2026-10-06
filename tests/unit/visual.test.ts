import { describe, expect, it } from "vitest";
import { STATIC_ACTIVITIES, TEMPLATES, getActivity, activitiesForConcepts } from "@/data/activities";
import { FAMILIES, FAMILY_DRUGS, SCALES } from "@/data/activities/generated";
import { validateActivities } from "@/lib/activities/validate";
import { ANTIDOTE_NAMES, ANTIDOTES } from "@/data/antidotes";
import { CONCEPTS, CONCEPT_BY_ID } from "@/data/curriculum";
import { QUESTIONS, getQuestion } from "@/data/bank";
import { buildSession, newRuntime, nextItem, slotPlan, type Mode } from "@/lib/engine/session";
import { pickExplainer, gaugeFor, holdFor, questionText } from "@/lib/explain";
import { heatCells, SKILL_GROUPS } from "@/components/analytics/Heatmap";
import { VISUAL_LABS } from "@/data/visualLabs";
import { mulberry32 } from "@/lib/rng";
import type { Activity } from "@/lib/activities/types";

const T0 = Date.UTC(2026, 9, 1, 12);

describe("activity content", () => {
  it("every static activity passes the validator", () => {
    expect(validateActivities(STATIC_ACTIVITIES)).toEqual([]);
  });

  it("40 seeded instances of every generated template validate and round-trip through their id", () => {
    for (const t of TEMPLATES) {
      for (let seed = 1; seed <= 40; seed++) {
        const a = t.make(seed * 7919);
        expect(validateActivities([a])).toEqual([]);
        expect(a.kind).toBe(t.kind);
        expect(getActivity(a.id)).toEqual(a);
      }
    }
  });

  it("every activity concept exists and the primary concept matches its topic", () => {
    const all: Activity[] = [...STATIC_ACTIVITIES, ...TEMPLATES.map((t) => t.make(1))];
    for (const a of all) {
      for (const c of a.concepts) expect(CONCEPT_BY_ID[c], `${a.id} → ${c}`).toBeDefined();
      expect(CONCEPT_BY_ID[a.concepts[0]].topic).toBe(a.topic);
    }
  });

  it("rescue kits only use course antidote pairings", () => {
    for (const a of STATIC_ACTIVITIES) {
      if (a.kind !== "rescue") continue;
      expect(ANTIDOTE_NAMES).toContain(a.data.antidote);
      for (const k of a.data.kits) expect(ANTIDOTE_NAMES).toContain(k);
      expect(new Set(a.data.kits).size).toBe(a.data.kits.length);
    }
  });

  it("suffix drills: every drug literally ends with its taught suffix", () => {
    for (const d of FAMILY_DRUGS) {
      expect(d.name.toLowerCase().endsWith(d.suffix), d.name).toBe(true);
      const fam = FAMILIES.find((f) => f.id === d.family)!;
      expect(fam.suffixes).toContain(`-${d.suffix}`);
    }
  });

  it("gauge scales: ordered thresholds; every generated value sits inside its band; digoxin never 1.5–2.0", () => {
    for (const s of SCALES) {
      expect(s.min).toBeLessThan(s.low);
      expect(s.low).toBeLessThan(s.high);
      expect(s.high).toBeLessThan(s.max);
      for (const v of s.values.low) expect(v).toBeLessThan(s.low);
      for (const v of s.values.in) expect(v >= s.low && v <= s.high).toBe(true);
      for (const v of s.values.high) expect(v).toBeGreaterThan(s.high);
      for (const b of s.bands) {
        expect(s.values[b].length).toBeGreaterThan(0);
        expect(s.meaning[b]).toBeTruthy();
        expect(s.action[b]).toBeTruthy();
      }
      if (s.key === "digoxin") for (const v of [...s.values.in, ...s.values.high]) expect(v > 1.5 && v < 2).toBe(false);
    }
  });

  it("every Visual Lab resolves to at least one activity of its kind", () => {
    for (const l of VISUAL_LABS) {
      if (l.id) expect(getActivity(l.id)?.kind, l.slug).toBe(l.kind);
      const n = STATIC_ACTIVITIES.filter((a) => a.kind === l.kind).length + TEMPLATES.filter((t) => t.kind === l.kind).length;
      expect(n, l.slug).toBeGreaterThan(0);
    }
  });

  it("the composer finds activities for most concepts", () => {
    const covered = CONCEPTS.filter((c) => activitiesForConcepts([c], mulberry32(3)).length > 0).length;
    expect(covered / CONCEPTS.length).toBeGreaterThan(0.6);
  });
});

describe("session composer", () => {
  it("slot plan mixes interaction types (4 of every 10 slots are activities)", () => {
    const kinds = Array.from({ length: 10 }, (_, i) => slotPlan(i).kind);
    expect(kinds.filter((k) => k === "a")).toHaveLength(4);
    expect(kinds[0]).toBe("q");
  });

  const learning: Mode[] = ["mission", "quick5", "weak", "world", "node"];
  for (const mode of learning) {
    it(`${mode}: serves visual activities AND questions, no duplicates`, () => {
      const cfg = buildSession({ mode, node: "heparins", world: "w7", stats: {}, mistakes: {}, exams: [], dailyMinutes: 20, now: T0 });
      const rt = newRuntime();
      const seen = new Set<string>();
      let acts = 0;
      let qs = 0;
      const total = Math.max(cfg.total, 8);
      for (let i = 0; i < total; i++) {
        const it = nextItem(cfg, rt, {}, {}, [], T0, mulberry32(100 + i));
        expect(it).toBeDefined();
        const id = it!.kind === "q" ? it!.q.id : it!.a.id;
        expect(seen.has(id)).toBe(false);
        seen.add(id);
        if (it!.kind === "a") acts++;
        else qs++;
      }
      expect(acts).toBeGreaterThan(0);
      expect(qs).toBeGreaterThan(acts - 1);
    });
  }

  it("activity kinds vary within a session", () => {
    const cfg = buildSession({ mode: "mission", stats: {}, mistakes: {}, exams: [], dailyMinutes: 30, now: T0 });
    const rt = newRuntime();
    for (let i = 0; i < 20; i++) nextItem(cfg, rt, {}, {}, [], T0, mulberry32(i + 9));
    expect(new Set(rt.actKinds).size).toBeGreaterThanOrEqual(Math.min(4, rt.actKinds.length));
  });

  for (const mode of ["boss", "highyield", "vault"] as Mode[]) {
    it(`${mode}: stays question-only (exam-format practice)`, () => {
      const mistakes = { "co-001": { qid: "co-001", concept: getQuestion("co-001")!.concept, topic: "coag", at: T0, count: 1, resolved: false, response: "x" } };
      const cfg = buildSession({ mode, world: "w7", stats: {}, mistakes: mistakes as never, exams: [], dailyMinutes: 10, now: T0 });
      const rt = newRuntime();
      for (let i = 0; i < Math.min(cfg.total, 10); i++) {
        const it = nextItem(cfg, rt, {}, {}, [], T0, mulberry32(i + 1));
        if (!it) break;
        expect(it.kind).toBe("q");
      }
    });
  }

  it("focus mode drills exactly the requested concepts", () => {
    const cfg = buildSession({ mode: "focus", concepts: ["hep-lab", "war-lab"], stats: {}, mistakes: {}, exams: [], dailyMinutes: 10, now: T0 });
    const rt = newRuntime();
    for (let i = 0; i < cfg.total; i++) {
      const it = nextItem(cfg, rt, {}, {}, [], T0, mulberry32(i + 5));
      if (!it) break;
      const concepts = it.kind === "q" ? [it.q.concept] : it.a.concepts;
      expect(concepts.some((c) => c === "hep-lab" || c === "war-lab")).toBe(true);
    }
  });
});

describe("visual explainers", () => {
  it("cover a large share of the bank and every one is grounded in the question", () => {
    let n = 0;
    for (const q of QUESTIONS) {
      const e = pickExplainer(q);
      if (!e) continue;
      n++;
      const text = questionText(q);
      if (e.kind === "antidote") for (const p of e.pairs) expect(ANTIDOTES.find((a) => a.id === p.id)?.concept).toBe(q.concept);
      if (e.kind === "suffix") for (const d of e.drugs) expect(text).toContain(d.name.toLowerCase());
      if (e.kind === "timeline") expect(q.type).toBe("order");
      if (e.kind === "gauge" && e.gauge.value !== null) expect(q.stem).toContain(String(e.gauge.value));
    }
    expect(n / QUESTIONS.length).toBeGreaterThan(0.4);
  });

  it("gauges read the value, respect the indication, and refuse conflicting ranges", () => {
    const g = (id: string) => {
      const e = gaugeFor(getQuestion(id)!);
      return e?.kind === "gauge" ? e.gauge : null;
    };
    expect(g("co-064")).toMatchObject({ low: 2, high: 3, value: 4.2 });
    expect(g("co-063")).toMatchObject({ low: 3, high: 4.5, value: 3.8 });
    expect(g("co-021")).toMatchObject({ low: 60, high: 80, value: 110 });
    expect(g("hf-035")).toBeNull(); // the stem quotes a lab report's own 0.5–2.0 range
    expect(g("co-067")?.value ?? null).toBeNull(); // fill-in-the-blank: no needle
  });

  it("hold lines read real vitals but not rule statements", () => {
    const rules = (id: string) => {
      const e = holdFor(getQuestion(id)!);
      return e?.kind === "hold" ? e.rules : [];
    };
    expect(rules("an-024").map((r) => (r.type === "below" ? r.value : null))).toEqual([11, 128, 74]);
    expect(rules("hf-020")[0]).toMatchObject({ cut: 60, value: 56 });
    expect(rules("hf-023")[0]).toMatchObject({ value: null });
    expect(rules("ag-059").map((r) => (r.type === "below" ? r.value : null))).toEqual([118, 54]);
  });
});

describe("analytics heatmap", () => {
  it("every concept lands in exactly one topic × skill cell", () => {
    const cells = heatCells({}, T0);
    const all = cells.flatMap((c) => c.concepts);
    expect(all.length).toBe(CONCEPTS.length);
    expect(new Set(all).size).toBe(CONCEPTS.length);
    const skills = new Set(SKILL_GROUPS.flatMap((g) => g.skills));
    for (const c of CONCEPTS) expect(skills.has(c.skill)).toBe(true);
  });
});
