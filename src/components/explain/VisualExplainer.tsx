"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Eye, Ban, ShieldCheck, Sparkles, Droplets, ArrowRight, BriefcaseMedical, Check, Hand, OctagonX } from "lucide-react";
import type { Question } from "@/lib/types";
import { pickExplainer, type Explainer, type HoldRule } from "@/lib/explain";
import { ANTIDOTE_NAMES, type AntidotePair } from "@/data/antidotes";
import { FAMILIES, FAMILY_DRUGS } from "@/data/activities/generated";
import type { BodyRegion, ClotClass, GaugeData } from "@/lib/activities/types";
import { GaugeBar, bandOf } from "@/components/activities/LabGauge";
import { SuffixName } from "@/components/activities/FamilyWall";
import { BodySvg } from "@/components/activities/Visuals";
import { CLASS_STYLE } from "@/components/activities/ClottingLab";
import { EFFECT as RAAS_EFFECT } from "@/components/activities/Raas";
import { EFFECT as NEPHRON_EFFECT, type DrugId } from "@/components/activities/Nephron";
import { cx, haptic } from "@/components/ui";
import { playSound } from "@/lib/sound";

/** Stable small hash → deterministic choices (no Math.random during render). */
function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

const TITLE: Record<Explainer["kind"], string> = {
  timeline: "See the order",
  antidote: "Connect the rescue",
  gauge: "See the range",
  suffix: "Read the suffix",
  raas: "Where it blocks",
  nephron: "Where it works",
  clot: "Clot classes",
  potassium: "Which way does K⁺ go?",
  body: "Body map",
  compare: "Side by side",
  hold: "Hold line",
};

/** Visual (and when useful, interactive) explanation shown under an answered question. */
export function VisualExplainer({ q, correct, chosenText }: { q: Question; correct: boolean; chosenText?: string }) {
  const ex = useMemo(() => pickExplainer(q), [q]);
  if (!ex) return null;
  return (
    <div className="mt-3 rounded-2xl bg-surface p-3" data-testid="visual-explainer" data-kind={ex.kind}>
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-brand">
        <Eye size={13} /> {TITLE[ex.kind]}
      </p>
      {ex.kind === "timeline" && <TimelineX steps={ex.steps} />}
      {ex.kind === "antidote" && <AntidoteX pairs={ex.pairs} interactive={!correct} seed={q.id} />}
      {ex.kind === "gauge" && <GaugeX g={ex.gauge} interactive={!correct} />}
      {ex.kind === "suffix" && <SuffixX drugs={ex.drugs} seed={q.id} chosenText={correct ? undefined : chosenText} />}
      {ex.kind === "raas" && <RaasX target={ex.target} />}
      {ex.kind === "nephron" && <NephronX drug={ex.drug} />}
      {ex.kind === "clot" && <ClotX highlight={ex.highlight} />}
      {ex.kind === "potassium" && <PotassiumX items={ex.items} />}
      {ex.kind === "body" && <BodyX acts={ex.act.data.acts} effects={ex.act.data.effects} drug={ex.act.data.drug} />}
      {ex.kind === "compare" && <CompareX columns={ex.set.columns} rows={ex.set.rows} interactive={!correct} />}
      {ex.kind === "hold" && <HoldX rules={ex.rules} />}
    </div>
  );
}

// ───────────────────────── timeline ─────────────────────────
export function TimelineX({ steps }: { steps: string[] }) {
  return (
    <ol className="relative ml-3 border-l-2 border-brand/30 pl-4" data-testid="x-timeline">
      {steps.map((s, i) => (
        <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.18 }} className="relative mb-2.5 last:mb-0">
          <span className="absolute -left-[27px] top-0 grid size-5 place-items-center rounded-full bg-brand text-[11px] font-black text-white">{i + 1}</span>
          <span className="text-[14px] font-semibold leading-snug">{s}</span>
        </motion.li>
      ))}
    </ol>
  );
}

// ───────────────────────── antidote ─────────────────────────
const ARGUABLE: Record<string, string[]> = { Digoxin: ["Atropine"], "Enoxaparin (LMWH)": ["Andexanet alfa"], Heparin: ["Andexanet alfa"] };

function AntidoteX({ pairs, interactive, seed }: { pairs: AntidotePair[]; interactive: boolean; seed: string }) {
  const p = pairs[0];
  const kits = useMemo(() => {
    // never offer a kit that could be argued right for this drug (per content audit)
    const avoid = ARGUABLE[p.drug] ?? [];
    const others = ANTIDOTE_NAMES.filter((n) => n !== p.antidote && !avoid.includes(n));
    const h = hash(seed);
    const a = others[h % others.length];
    const b = others[(h * 7 + 3) % others.length] === a ? others[(h + 1) % others.length] : others[(h * 7 + 3) % others.length];
    const list = [p.antidote, a, b];
    return h % 3 === 0 ? list : h % 3 === 1 ? [a, p.antidote, b] : [a, b, p.antidote];
  }, [p.antidote, p.drug, seed]);
  const [linked, setLinked] = useState(!interactive);
  const [miss, setMiss] = useState<string | null>(null);
  const tap = (k: string) => {
    if (linked) return;
    if (k === p.antidote) {
      setLinked(true);
      playSound("snap");
      haptic(10);
    } else {
      setMiss(k);
      playSound("wrong");
    }
  };
  return (
    <div data-testid="x-antidote">
      {pairs.map((pair, i) => (
        <div key={pair.id} className={cx("flex items-center gap-2", i > 0 && "mt-2")}>
          <span className="min-w-0 flex-1 rounded-xl bg-bad-soft px-2.5 py-2 text-center text-[13px] font-extrabold text-ink">{pair.drug}</span>
          <div className="relative h-1 w-12 shrink-0 overflow-hidden rounded-full bg-line">
            <motion.div className="absolute inset-y-0 left-0 bg-good" initial={{ width: 0 }} animate={{ width: linked || i > 0 ? "100%" : "0%" }} transition={{ duration: 0.5 }} />
          </div>
          <span className={cx("flex min-w-0 flex-1 items-center justify-center gap-1 rounded-xl px-2.5 py-2 text-center text-[13px] font-extrabold", linked || i > 0 ? "bg-good-soft text-good" : "border-2 border-dashed border-line text-muted")}>
            {linked || i > 0 ? (
              <>
                <BriefcaseMedical size={14} className="shrink-0" /> {pair.antidote}
              </>
            ) : (
              "?"
            )}
          </span>
        </div>
      ))}
      {!linked && (
        <div className="mt-3">
          <p className="mb-1.5 text-[12px] font-bold text-muted">Tap the kit that reverses {p.drug.toLowerCase()}:</p>
          <div className="grid grid-cols-3 gap-1.5">
            {kits.map((k) => (
              <motion.button key={k} onClick={() => tap(k)} animate={miss === k ? { x: [0, -6, 6, -4, 0] } : {}} className={cx("min-h-12 rounded-xl border-2 px-1.5 text-[12px] font-extrabold leading-tight", miss === k ? "border-warn/50 text-muted line-through" : "border-line bg-surface-2")} data-testid="x-antidote-kit">
                {k}
              </motion.button>
            ))}
          </div>
          {miss && <p className="mt-1.5 text-[12px] font-semibold text-warn">{miss} reverses a different drug. Try again.</p>}
        </div>
      )}
      {linked && <p className="mt-2 text-[12.5px] font-semibold text-muted">{p.note}</p>}
    </div>
  );
}

// ───────────────────────── gauge ─────────────────────────
function GaugeX({ g, interactive }: { g: Omit<GaugeData, "value"> & { value: number | null }; interactive: boolean }) {
  const hasValue = g.value !== null;
  const gv = { ...g, value: g.value ?? g.low };
  const band = bandOf(gv);
  const [picked, setPicked] = useState<"low" | "in" | "high" | null>(null);
  const solved = !interactive || !hasValue || picked === band;
  const tap = (b: "low" | "in" | "high") => {
    setPicked(b);
    playSound(b === band ? "snap" : "wrong");
  };
  return (
    <div data-testid="x-gauge">
      <p className="text-[13px] font-bold">
        {g.drug} · {g.lab} target <span className="text-good">{g.low}–{g.high}{g.unit ? ` ${g.unit}` : ""}</span>
        {g.context ? <span className="font-semibold text-muted"> ({g.context})</span> : null}
      </p>
      <GaugeBar g={gv} showNeedle={hasValue && solved} onZone={!solved ? tap : undefined} picked={picked} compact />
      {!solved && <p className="mt-1 text-[12px] font-bold text-brand">Tap the zone where {g.value} falls.</p>}
      {hasValue && solved && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1 text-[13px] font-semibold">
          <b>{g.value}</b> → {g.meaning[band]}. <span className="text-muted">{g.action[band]}.</span>
        </motion.p>
      )}
    </div>
  );
}

// ───────────────────────── suffix ─────────────────────────
const FAM = Object.fromEntries(FAMILIES.map((f) => [f.id, f]));

function SuffixX({ drugs, seed, chosenText }: { drugs: { name: string; family: string; suffix: string; correct: boolean }[]; seed: string; chosenText?: string }) {
  const chosen = chosenText?.toLowerCase() ?? "";
  return (
    <div data-testid="x-suffix">
      <div className="space-y-1.5">
        {drugs.map((d, i) => {
          const f = FAM[d.family];
          const picked = chosen && chosen.includes(d.name.toLowerCase()) && !d.correct;
          return (
            <motion.div key={d.name} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }} className={cx("flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-xl px-2.5 py-1.5", d.correct ? "bg-good-soft" : picked ? "bg-warn-soft" : "bg-surface-2")}>
              <SuffixName name={d.name} suffix={d.suffix} className="shrink-0 text-[14px] font-extrabold" />
              <span className="ml-auto flex items-center gap-1.5">
                <ArrowRight size={14} className="shrink-0 text-muted" />
                <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-black uppercase text-white" style={{ background: f.color }}>
                  -{d.suffix}
                </span>
                <span className="text-[12px] font-extrabold leading-tight" style={{ color: f.color }}>
                  {f.label}
                </span>
                {d.correct && <Check size={15} className="shrink-0 text-good" />}
              </span>
            </motion.div>
          );
        })}
      </div>
      <NowYouTry exclude={drugs.map((d) => d.name)} seed={seed} />
    </div>
  );
}

function NowYouTry({ exclude, seed }: { exclude: string[]; seed: string }) {
  const { drug, options } = useMemo(() => {
    const pool = FAMILY_DRUGS.filter((d) => !exclude.includes(d.name));
    const h = hash(seed + "try");
    const drug = pool[h % pool.length];
    const others = FAMILIES.filter((f) => f.id !== drug.family);
    const opts = [drug.family, others[h % others.length].id, others[(h + 2) % others.length].id];
    const rot = h % 3;
    return { drug, options: [...opts.slice(rot), ...opts.slice(0, rot)] };
  }, [exclude, seed]);
  const [miss, setMiss] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const tap = (id: string) => {
    if (done) return;
    if (id === drug.family) {
      setDone(true);
      playSound("correct");
      haptic(10);
    } else {
      setMiss((m) => [...m, id]);
      playSound("wrong");
    }
  };
  return (
    <div className="mt-3 rounded-xl border-2 border-dashed border-brand/30 p-2.5" data-testid="x-try">
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-brand">Now you try</p>
      <p className="mt-0.5 text-[16px] font-extrabold">
        <SuffixName name={drug.name} suffix={drug.suffix} show={done || miss.length > 0} />
      </p>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {options.map((id) => {
          const f = FAM[id];
          const wrong = miss.includes(id);
          const right = done && id === drug.family;
          return (
            <motion.button key={id} onClick={() => tap(id)} animate={wrong ? { x: [0, -5, 5, -3, 0] } : {}} disabled={wrong || done} className={cx("min-h-11 rounded-xl border-2 px-1 text-[11.5px] font-extrabold leading-tight hyphens-auto break-words", right ? "border-good bg-good-soft text-good" : wrong ? "border-line text-muted line-through" : "border-line bg-surface")} data-testid="x-try-option">
              {f.label}
            </motion.button>
          );
        })}
      </div>
      {miss.length > 0 && !done && <p className="mt-1.5 text-[12px] font-semibold text-warn">Look at the highlighted ending, then try again.</p>}
      {done && <p className="mt-1.5 text-[12px] font-semibold text-good">✓ {FAM[drug.family].hint}</p>}
    </div>
  );
}

// ───────────────────────── RAAS ─────────────────────────
function RaasX({ target }: { target: "ace" | "receptor" | "aldosterone" }) {
  const block = (t: typeof target) =>
    target === t ? (
      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-bad text-white shadow" aria-label="blocked">
        <Ban size={14} />
      </motion.span>
    ) : null;
  const box = (t: typeof target | null, label: string, sub?: string) => (
    <div className={cx("relative rounded-xl border-2 px-2 py-1.5 text-center", t && target === t ? "border-bad/60 bg-bad-soft" : "border-line bg-surface-2")}>
      <p className="text-[12px] font-extrabold leading-tight">{label}</p>
      {sub && <p className="text-[10.5px] font-bold text-muted">{sub}</p>}
      {t && block(t)}
    </div>
  );
  const eff = RAAS_EFFECT[target];
  return (
    <div data-testid="x-raas">
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1">
        {box(null, "Ang I")}
        <ArrowRight size={14} className="text-muted" />
        {box("ace", "ACE", "-pril")}
        <ArrowRight size={14} className="text-muted" />
        {box(null, "Ang II")}
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        {box("receptor", "Ang II receptor", "-sartan")}
        {box("aldosterone", "Aldosterone", "spironolactone")}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {[...eff.lines, ...(eff.cough ? [eff.cough] : [])].map((l) => (
          <span key={l} className="rounded-full bg-brand-soft px-2 py-0.5 text-[11.5px] font-bold text-brand">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────── nephron ─────────────────────────
function NephronX({ drug }: { drug: DrugId }) {
  const e = NEPHRON_EFFECT[drug];
  const segs: { id: DrugId; label: string }[] = [
    { id: "mannitol", label: "Bloodstream" },
    { id: "furosemide", label: "Loop of Henle" },
    { id: "hctz", label: "Distal tubule" },
    { id: "spironolactone", label: "Aldosterone" },
  ];
  return (
    <div data-testid="x-nephron">
      <div className="grid grid-cols-4 gap-1">
        {segs.map((s) => (
          <div key={s.id} className={cx("rounded-lg px-1 py-2 text-center text-[10.5px] font-extrabold leading-tight", s.id === drug ? "bg-sky-500 text-white" : "bg-surface-2 text-muted")}>
            {s.label}
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <Droplets size={14} className="text-sky-500" />
        {e.lost.map((p, i) => (
          <motion.span key={p} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.08 }} className={cx("rounded-md px-1.5 py-0.5 text-[11px] font-black text-white", p.startsWith("K") ? "bg-rose-500" : "bg-sky-500")}>
            ↓ {p}
          </motion.span>
        ))}
        {e.kept?.map((p) => (
          <span key={p} className="rounded-md bg-emerald-500 px-1.5 py-0.5 text-[11px] font-black text-white">
            kept {p}
          </span>
        ))}
      </div>
      <p className="mt-1.5 text-[12.5px] font-semibold text-muted">{e.extra}</p>
    </div>
  );
}

// ───────────────────────── clot classes ─────────────────────────
const CLOT_ICON: Record<ClotClass, React.ReactNode> = { anticoagulant: <ShieldCheck size={18} />, antiplatelet: <Hand size={18} />, thrombolytic: <Sparkles size={18} /> };
function ClotX({ highlight }: { highlight: ClotClass[] }) {
  return (
    <div className="grid grid-cols-3 gap-1.5" data-testid="x-clot">
      {(Object.keys(CLASS_STYLE) as ClotClass[]).map((c) => {
        const on = highlight.length === 0 || highlight.includes(c);
        const st = CLASS_STYLE[c];
        return (
          <motion.div key={c} animate={{ opacity: on ? 1 : 0.4, scale: highlight.includes(c) ? 1.03 : 1 }} className="rounded-xl border-2 p-2 text-center" style={{ borderColor: on ? st.color : "transparent", background: `color-mix(in srgb, ${st.color} ${on ? 12 : 4}%, transparent)` }}>
            <span className="mx-auto grid size-8 place-items-center rounded-full text-white" style={{ background: st.color }}>
              {CLOT_ICON[c]}
            </span>
            <p className="mt-1 text-[11.5px] font-extrabold leading-tight hyphens-auto break-words" style={{ color: st.color }}>
              {st.label}
            </p>
            <p className="text-[10.5px] font-semibold leading-tight text-muted">{st.does}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

// ───────────────────────── potassium ─────────────────────────
function PotassiumX({ items }: { items: { label: string; dir: "up" | "down"; why: string }[] }) {
  const col = (dir: "up" | "down") => (
    <div className={cx("rounded-xl p-2", dir === "down" ? "bg-sky-500/10" : "bg-amber-500/10")}>
      <p className={cx("text-center text-[13px] font-black", dir === "down" ? "text-sky-600 dark:text-sky-300" : "text-amber-600 dark:text-amber-300")}>K⁺ {dir === "down" ? "↓ DOWN" : "↑ UP"}</p>
      <p className="text-center text-[10.5px] font-bold text-muted">{dir === "down" ? "wasting → eat more K⁺" : "watch for HIGH K⁺"}</p>
      <div className="mt-1.5 space-y-1">
        {!items.some((i) => i.dir === dir) && <p className="py-2 text-center text-[11px] font-semibold text-muted">— none in this question —</p>}
        {items
          .filter((i) => i.dir === dir)
          .map((i, n) => (
            <motion.div key={i.label} initial={{ y: dir === "down" ? -10 : 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 + n * 0.12 }} className="rounded-lg bg-surface px-2 py-1">
              <p className="text-[12.5px] font-extrabold leading-tight">{i.label}</p>
              <p className="text-[10.5px] font-semibold leading-tight text-muted">{i.why}</p>
            </motion.div>
          ))}
      </div>
    </div>
  );
  return (
    <div className="grid grid-cols-2 gap-1.5" data-testid="x-potassium">
      {col("down")}
      {col("up")}
    </div>
  );
}

// ───────────────────────── body ─────────────────────────
const REGION_LABEL: Record<BodyRegion, string> = { brain: "Brain", eyes: "Eyes", ears: "Ears", mouth: "Mouth", lungs: "Lungs", heart: "Heart", vessels: "Vessels", liver: "Liver", gi: "GI tract", kidneys: "Kidneys", blood: "Blood", skin: "Skin", muscle: "Muscle" };
function BodyX({ acts, effects, drug }: { acts: { region: BodyRegion; text: string }[]; effects: { region: BodyRegion; text: string }[]; drug: string }) {
  const [sel, setSel] = useState<BodyRegion | null>(null);
  const actSet = useMemo(() => new Set(acts.map((a) => a.region)), [acts]);
  const effSet = useMemo(() => new Set(effects.map((a) => a.region)), [effects]);
  const list = sel ? [...acts, ...effects].filter((x) => x.region === sel) : effects;
  return (
    <div className="grid grid-cols-[38%_1fr] items-start gap-2" data-testid="x-body">
      <div className="max-w-[150px]">
        <BodySvg acts={actSet} effects={effSet} selected={sel} onSelect={(r) => setSel((s) => (s === r ? null : r))} />
      </div>
      <div className="min-w-0">
        <p className="text-[12px] font-extrabold">{drug}</p>
        <p className="mb-1 text-[10.5px] font-bold text-muted">{sel ? REGION_LABEL[sel] : "Tap a glowing region"}</p>
        <ul className="space-y-1">
          {list.slice(0, 6).map((x, i) => (
            <li key={i} className="rounded-lg bg-amber-500/10 px-2 py-1 text-[12px] font-semibold leading-tight">
              <span className="font-extrabold text-amber-700 dark:text-amber-300">{REGION_LABEL[x.region]}:</span> {x.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ───────────────────────── compare ─────────────────────────
function CompareX({ columns, rows, interactive }: { columns: string[]; rows: { label: string; cells: string[] }[]; interactive: boolean }) {
  const shown = rows.slice(0, 3);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <div data-testid="x-compare">
      <div className="grid gap-1" style={{ gridTemplateColumns: `minmax(64px,0.7fr) repeat(${columns.length}, minmax(0,1fr))` }}>
        <span />
        {columns.map((c, i) => (
          <span key={c} className={cx("rounded-lg px-1.5 py-1 text-center text-[11.5px] font-black text-white", i === 0 ? "bg-indigo-500" : i === 1 ? "bg-fuchsia-500" : "bg-teal-500")}>
            {c}
          </span>
        ))}
        {shown.map((r) => (
          <FragmentRow key={r.label} label={r.label}>
            {r.cells.map((cell, ci) => {
              const k = `${r.label}-${ci}`;
              const visible = !interactive || open[k];
              return (
                <button key={k} onClick={() => setOpen((o) => ({ ...o, [k]: true }))} className={cx("min-h-10 rounded-lg px-1.5 py-1 text-left text-[11.5px] font-semibold leading-tight", visible ? "bg-surface-2" : "border-2 border-dashed border-brand/30 text-center text-brand")} data-testid="x-compare-cell">
                  {visible ? cell : "tap"}
                </button>
              );
            })}
          </FragmentRow>
        ))}
      </div>
      {interactive && <p className="mt-1.5 text-[11.5px] font-semibold text-muted">Recall each cell first, then tap to check.</p>}
    </div>
  );
}
function FragmentRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <span className="self-center text-[11px] font-extrabold uppercase leading-tight text-muted">{label}</span>
      {children}
    </>
  );
}

// ───────────────────────── hold line ─────────────────────────
function HoldX({ rules }: { rules: HoldRule[] }) {
  return (
    <div className="space-y-2.5" data-testid="x-hold">
      {rules.map((r) =>
        r.type === "rule" ? (
          <div key={r.label} className="flex items-start gap-2 rounded-xl bg-bad-soft/70 px-2.5 py-2">
            <OctagonX size={18} className="mt-0.5 shrink-0 text-bad" />
            <p className="text-[13px] font-semibold leading-snug">
              <b>{r.label}:</b> {r.text}
            </p>
          </div>
        ) : (
          <HoldLine key={r.label} r={r} />
        ),
      )}
    </div>
  );
}

function HoldLine({ r }: { r: Extract<HoldRule, { type: "below" }> }) {
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - r.min) / (r.max - r.min)) * 100));
  const cut = pct(r.cut);
  const rescue = r.rescue ? pct(r.rescue.cut) : null;
  const holding = r.value !== null && r.value < r.cut;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-[12.5px] font-extrabold">{r.label}</p>
        <p className="text-[11.5px] font-bold text-muted">
          hold if &lt; {r.cut}
          {r.rescue ? ` · < ${r.rescue.cut} → ${r.rescue.label.toLowerCase()}` : ""}
        </p>
      </div>
      <div className={cx("relative", r.value !== null ? "pt-6" : "pt-1")}>
        <div className="relative flex h-6 overflow-hidden rounded-full text-[10px] font-black uppercase text-white">
          {rescue !== null && (
            <div className="grid place-items-center bg-rose-700" style={{ width: `${rescue}%` }}>
              {rescue > 14 ? r.rescue!.label : ""}
            </div>
          )}
          <div className="grid place-items-center bg-rose-500" style={{ width: `${cut - (rescue ?? 0)}%` }}>
            Hold
          </div>
          <div className="grid flex-1 place-items-center bg-emerald-500">Give</div>
        </div>
        <span className="absolute -translate-x-1/2 text-[10.5px] font-bold text-muted" style={{ left: `${cut}%` }}>
          {r.cut}
        </span>
        {r.value !== null && (
          <motion.div className="absolute top-0 flex -translate-x-1/2 flex-col items-center" initial={{ left: "100%" }} animate={{ left: `${pct(r.value)}%` }} transition={{ type: "spring", stiffness: 70, damping: 13 }}>
            <span className={cx("rounded-md px-1.5 text-[11px] font-black text-white", holding ? "bg-bad" : "bg-ink")}>{r.value}</span>
            <span className="h-7 w-0.5 bg-ink" />
          </motion.div>
        )}
      </div>
      <div className="h-3" />
    </div>
  );
}
