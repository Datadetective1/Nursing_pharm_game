"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { Skill } from "@/lib/types";
import type { ConceptStat } from "@/lib/engine/mastery";
import { effectiveMastery } from "@/lib/engine/mastery";
import { TOPICS, CONCEPTS } from "@/data/curriculum";
import { masteryColor } from "@/components/ui";

/** Skill groups shown as heatmap columns (12 skills → 6 phone-width columns). */
export const SKILL_GROUPS: { id: string; label: string; skills: Skill[] }[] = [
  { id: "moa", label: "How it works", skills: ["moa", "use", "class"] },
  { id: "se", label: "Side effects", skills: ["se"] },
  { id: "safety", label: "CI · Intx", skills: ["ci", "intx"] },
  { id: "lab", label: "Labs", skills: ["lab"] },
  { id: "hold", label: "Hold · Antidote", skills: ["hold", "antidote"] },
  { id: "care", label: "Nursing · Calc", skills: ["action", "teach", "calc"] },
];

export interface HeatCell {
  topic: string;
  group: string;
  concepts: string[];
  mastery: number;
  seen: boolean;
}

/** Pure: topic × skill-group cells with average effective mastery. */
export function heatCells(stats: Record<string, ConceptStat>, now: number): HeatCell[] {
  const out: HeatCell[] = [];
  for (const t of TOPICS) {
    for (const g of SKILL_GROUPS) {
      const cs = CONCEPTS.filter((c) => c.topic === t.id && g.skills.includes(c.skill));
      if (!cs.length) continue;
      const seen = cs.some((c) => (stats[c.id]?.seen ?? 0) > 0);
      const mastery = cs.reduce((a, c) => a + effectiveMastery(stats[c.id], now), 0) / cs.length;
      out.push({ topic: t.id, group: g.id, concepts: cs.map((c) => c.id), mastery, seen });
    }
  }
  return out;
}

export const focusHref = (concepts: string[]) => `/play?mode=focus&concepts=${concepts.join(",")}`;

/** Tap any cell → an 8-item focus session (questions + visual activities) on exactly those concepts. */
export function Heatmap({ stats, now }: { stats: Record<string, ConceptStat>; now: number }) {
  const cells = heatCells(stats, now);
  const at = (t: string, g: string) => cells.find((c) => c.topic === t && c.group === g);
  return (
    <div className="card p-3" data-testid="heatmap">
      <div className="grid gap-1" style={{ gridTemplateColumns: "minmax(70px,1.1fr) repeat(6, minmax(0,1fr))" }}>
        <span />
        {SKILL_GROUPS.map((g) => (
          <span key={g.id} className="pb-1 text-center text-[9.5px] font-extrabold uppercase leading-tight text-muted">
            {g.label}
          </span>
        ))}
        {TOPICS.map((t, ti) => (
          <Row key={t.id} label={t.short}>
            {SKILL_GROUPS.map((g, gi) => {
              const c = at(t.id, g.id);
              if (!c) return <span key={g.id} className="aspect-square rounded-md bg-surface-2/40" />;
              return (
                <motion.span key={g.id} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: (ti * 6 + gi) * 0.006 }}>
                  <Link
                    href={focusHref(c.concepts)}
                    aria-label={`Practice ${t.title}: ${g.label} (${Math.round(c.mastery)}%)`}
                    className="grid aspect-square place-items-center rounded-md text-[10px] font-black text-white transition-transform active:scale-90"
                    style={{ background: masteryColor(c.mastery, c.seen), opacity: c.seen ? 0.45 + (c.mastery / 100) * 0.55 : 1 }}
                    data-testid="heat-cell"
                    data-mastery={Math.round(c.mastery)}
                  >
                    {c.seen ? Math.round(c.mastery) : ""}
                  </Link>
                </motion.span>
              );
            })}
          </Row>
        ))}
      </div>
      <p className="mt-2 text-[11.5px] font-semibold text-muted">Tap any square to drill exactly that weak area.</p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <span className="self-center truncate pr-1 text-[11px] font-bold">{label}</span>
      {children}
    </>
  );
}

/** 14-day accuracy sparkline (SVG). */
export function AccuracyTrend({ points }: { points: { label: string; acc: number | null; n: number }[] }) {
  const W = 300;
  const H = 80;
  const xs = (i: number) => 8 + (i * (W - 16)) / Math.max(1, points.length - 1);
  const ys = (a: number) => H - 8 - (a / 100) * (H - 20);
  const pts = points.map((p, i) => (p.acc === null ? null : { x: xs(i), y: ys(p.acc), ...p })).filter(Boolean) as { x: number; y: number; acc: number; n: number; label: string }[];
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <div className="card p-4" data-testid="accuracy-trend">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Accuracy over the last 14 days">
        {[50, 80].map((g) => (
          <g key={g}>
            <line x1="8" x2={W - 8} y1={ys(g)} y2={ys(g)} stroke="var(--line)" strokeDasharray="3 4" />
            <text x={W - 8} y={ys(g) - 3} textAnchor="end" fontSize="9" fill="var(--muted)">
              {g}%
            </text>
          </g>
        ))}
        {pts.length > 1 && <motion.path d={path} fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />}
        {pts.map((p) => (
          <circle key={p.label + p.x} cx={p.x} cy={p.y} r={Math.min(6, 2.5 + p.n / 10)} fill={masteryColor(p.acc)} />
        ))}
      </svg>
      {pts.length === 0 && <p className="text-center text-xs text-muted">Your accuracy line appears after your first session.</p>}
      <p className="mt-1 text-[11.5px] font-semibold text-muted">Daily accuracy · dot size = questions answered</p>
    </div>
  );
}
