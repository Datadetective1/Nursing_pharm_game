"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PersonStanding, Castle, Shuffle, Syringe, Salad, CalendarCheck, Baby, Brush, Shield, FlaskConical, Pill, HeartPulse, Eye, Droplet, Banana, Clock, TriangleAlert, Smile, Wind, Bed, Thermometer, Ban, Scale, Minus, Plus } from "lucide-react";
import type { ActivityOf, ActivityResult, BodyRegion, PalaceIcon } from "@/lib/activities/types";
import { DndProvider, DragItem, DropZone } from "@/components/interact/dnd";
import { ActivityHeader, MiniQuestionView, PillTag, Toast } from "@/components/interact/common";
import { CONTRASTS } from "@/data/contrasts";
import { getQuestion } from "@/data/bank";
import { cx, haptic } from "@/components/ui";
import { playSound } from "@/lib/sound";
import { mulberry32, shuffle } from "@/lib/rng";
import type { FillQuestion } from "@/lib/types";

// ───────────────────────── BODY MAP ─────────────────────────
const REGION_LABEL: Record<BodyRegion, string> = { brain: "Brain", eyes: "Eyes", ears: "Ears", mouth: "Mouth", lungs: "Lungs", heart: "Heart", vessels: "Vessels", liver: "Liver", gi: "GI tract", kidneys: "Kidneys", blood: "Blood", skin: "Skin", muscle: "Muscle" };

/** Original simplified body illustration with tappable regions. */
export function BodySvg({ acts, effects, selected, onSelect }: { acts: Set<BodyRegion>; effects: Set<BodyRegion>; selected?: BodyRegion | null; onSelect?: (r: BodyRegion) => void }) {
  const fill = (r: BodyRegion) => (effects.has(r) ? "#f59e0b" : acts.has(r) ? "#6366f1" : "currentColor");
  const op = (r: BodyRegion) => (effects.has(r) || acts.has(r) ? 0.85 : 0.12);
  const glow = (r: BodyRegion) => (effects.has(r) || acts.has(r) ? { animate: { opacity: [0.6, 0.95, 0.6] }, transition: { duration: 2, repeat: Infinity } } : {});
  const hit = (r: BodyRegion) => ({
    onClick: () => onSelect?.(r),
    style: { cursor: onSelect ? "pointer" : "default" } as React.CSSProperties,
    "data-testid": `body-${r}`,
    "data-lit": String(effects.has(r) || acts.has(r)),
    strokeWidth: selected === r ? 3 : 0,
    stroke: "#111827",
  });
  return (
    <svg viewBox="0 0 200 360" className="mx-auto h-auto w-full max-w-[260px] text-ink" role="img" aria-label="Body map">
      {/* silhouette */}
      <g opacity={effects.has("skin") ? 1 : 0.9}>
        <motion.path
          {...hit("skin")}
          d="M100 8c18 0 30 14 30 32s-12 32-30 32-30-14-30-32 12-32 30-32zM70 80h60c14 0 24 10 26 24l10 92c1 8-8 10-10 2l-12-70v74l-6 130c0 10-16 10-16 0l-6-110h-12l-6 110c0 10-16 10-16 0l-6-130v-74l-12 70c-2 8-11 6-10-2l10-92c2-14 12-24 26-24z"
          fill={effects.has("skin") ? "#fde68a" : "currentColor"}
          opacity={effects.has("skin") ? 0.55 : 0.07}
          stroke={selected === "skin" ? "#111827" : effects.has("skin") ? "#f59e0b" : "currentColor"}
          strokeOpacity={effects.has("skin") ? 1 : 0.25}
          strokeWidth="2.5"
        />
      </g>
      {/* vessels: arm arteries */}
      <motion.path {...hit("vessels")} d="M66 100 L54 190 M134 100 L146 190 M90 230 L86 340 M110 230 L114 340" stroke={fill("vessels")} strokeOpacity={op("vessels")} strokeWidth={selected === "vessels" ? 7 : 5} strokeLinecap="round" fill="none" {...glow("vessels")} />
      <motion.path d="M100 14c14 0 22 9 23 22H77c1-13 9-22 23-22z" fill={fill("brain")} opacity={op("brain")} {...glow("brain")} {...hit("brain")} />
      <motion.g {...glow("eyes")}>
        <ellipse cx="90" cy="44" rx="5" ry="3.5" fill={fill("eyes")} opacity={op("eyes")} {...hit("eyes")} />
        <ellipse cx="110" cy="44" rx="5" ry="3.5" fill={fill("eyes")} opacity={op("eyes")} {...hit("eyes")} />
      </motion.g>
      <motion.g {...glow("ears")}>
        <ellipse cx="70" cy="44" rx="4" ry="7" fill={fill("ears")} opacity={op("ears")} {...hit("ears")} />
        <ellipse cx="130" cy="44" rx="4" ry="7" fill={fill("ears")} opacity={op("ears")} {...hit("ears")} />
      </motion.g>
      <motion.ellipse cx="100" cy="58" rx="9" ry="4.5" fill={fill("mouth")} opacity={op("mouth")} {...glow("mouth")} {...hit("mouth")} />
      <motion.g {...glow("lungs")}>
        <ellipse cx="84" cy="112" rx="13" ry="22" fill={fill("lungs")} opacity={op("lungs")} {...hit("lungs")} />
        <ellipse cx="116" cy="112" rx="13" ry="22" fill={fill("lungs")} opacity={op("lungs")} {...hit("lungs")} />
      </motion.g>
      <motion.path d="M104 108c4-6 13-3 12 4-1 6-12 14-12 14s-11-8-12-14c-1-7 8-10 12-4z" fill={fill("heart")} opacity={effects.has("heart") || acts.has("heart") ? 1 : 0.18} {...glow("heart")} {...hit("heart")} />
      <motion.ellipse cx="86" cy="150" rx="16" ry="10" fill={fill("liver")} opacity={op("liver")} {...glow("liver")} {...hit("liver")} />
      <motion.path d="M106 142c10 0 16 6 14 14s-10 10-18 8-10-8-8-14 4-8 12-8zM86 170h28c6 0 8 6 6 12s-4 14-20 14-22-8-20-14 0-12 6-12z" fill={fill("gi")} opacity={op("gi")} {...glow("gi")} {...hit("gi")} />
      <motion.g {...glow("kidneys")}>
        <ellipse cx="74" cy="176" rx="6" ry="10" fill={fill("kidneys")} opacity={op("kidneys")} {...hit("kidneys")} />
        <ellipse cx="126" cy="176" rx="6" ry="10" fill={fill("kidneys")} opacity={op("kidneys")} {...hit("kidneys")} />
      </motion.g>
      <motion.path d="M40 214c0 0 10 12 10 18a10 10 0 0 1-20 0c0-6 10-18 10-18z" fill={effects.has("blood") || acts.has("blood") ? fill("blood") : "#ef4444"} opacity={effects.has("blood") || acts.has("blood") ? 0.95 : 0.2} {...glow("blood")} {...hit("blood")} />
      <motion.g {...glow("muscle")}>
        <ellipse cx="88" cy="262" rx="9" ry="24" fill={fill("muscle")} opacity={op("muscle")} {...hit("muscle")} />
        <ellipse cx="112" cy="262" rx="9" ry="24" fill={fill("muscle")} opacity={op("muscle")} {...hit("muscle")} />
      </motion.g>
    </svg>
  );
}

export function BodyMap({ act, onDone }: { act: ActivityOf<"body">; onDone: (r: ActivityResult) => void }) {
  const d = act.data;
  const [stage, setStage] = useState<"guess" | "explore">(d.quiz ? "guess" : "explore");
  const [sel, setSel] = useState<BodyRegion | null>(null);
  const [visited, setVisited] = useState<Set<BodyRegion>>(new Set());
  const reported = useRef(false);
  const actSet = useMemo(() => new Set(d.acts.map((a) => a.region)), [d.acts]);
  const effSet = useMemo(() => new Set(d.effects.map((e) => e.region)), [d.effects]);
  const lit = useMemo(() => new Set([...actSet, ...effSet]), [actSet, effSet]);

  const select = (r: BodyRegion) => {
    setSel(r);
    if (stage === "explore" && lit.has(r)) {
      const v = new Set(visited).add(r);
      setVisited(v);
      playSound("tap");
      if (!d.quiz && v.size === lit.size && !reported.current) {
        reported.current = true;
        onDone({ correct: true, score: 1, total: 1, summary: `Explored ${d.drug} on the body map` });
      }
    }
  };

  const regionText = (r: BodyRegion) => [...d.acts.filter((a) => a.region === r).map((a) => ({ t: a.text, k: "act" as const })), ...d.effects.filter((e) => e.region === r).map((e) => ({ t: e.text, k: "eff" as const }))];

  return (
    <div data-testid="body-map">
      <ActivityHeader label="Body map" icon={<PersonStanding size={14} />} title={stage === "guess" ? "These effects light up. Which drug?" : d.drug} prompt={stage === "guess" ? "Read the glowing regions first." : "Tap each glowing region. Blue = where it acts · Amber = what to watch."} />
      <div className="grid grid-cols-[1fr_1fr] items-start gap-3">
        <div className="card p-2">
          <BodySvg acts={stage === "guess" ? new Set() : actSet} effects={effSet} selected={sel} onSelect={select} />
        </div>
        <div className="flex flex-col gap-1.5 text-[12.5px]">
          {(stage === "guess" ? d.effects.map((e) => ({ r: e.region, t: e.text, k: "eff" as const })) : [...d.acts.map((a) => ({ r: a.region, t: a.text, k: "act" as const })), ...d.effects.map((e) => ({ r: e.region, t: e.text, k: "eff" as const }))]).map((x, i) => (
            <motion.button
              key={x.r + x.t}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => select(x.r)}
              className={cx("rounded-xl border px-2 py-1.5 text-left font-semibold leading-snug", x.k === "act" ? "border-indigo-300 bg-indigo-50 dark:border-indigo-500/40 dark:bg-indigo-500/10" : "border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10", sel === x.r && "ring-2 ring-ink/30")}
            >
              <span className="block text-[9.5px] font-extrabold uppercase tracking-wider text-muted">{REGION_LABEL[x.r]}</span>
              {x.t}
            </motion.button>
          ))}
        </div>
      </div>
      {sel && stage === "explore" && regionText(sel).length > 0 && (
        <Toast ok>
          <b>{REGION_LABEL[sel]}:</b> {regionText(sel).map((x) => x.t).join(" · ")}
        </Toast>
      )}
      {stage === "guess" && d.quiz && (
        <div className="mt-4">
          <MiniQuestionView
            q={d.quiz}
            testId="body-quiz"
            onDone={(ok) => {
              if (!reported.current) {
                reported.current = true;
                onDone({ correct: ok, score: ok ? 1 : 0, total: 1, summary: ok ? `Identified ${d.drug} from its effects` : `Needed a retry to identify ${d.drug}` });
              }
              setTimeout(() => setStage("explore"), 900);
            }}
          />
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted">Source: {act.source}</p>
    </div>
  );
}

// ───────────────────────── MEMORY PALACE ─────────────────────────
const ICONS: Record<PalaceIcon, React.ReactNode> = {
  salad: <Salad size={26} />,
  calendar: <CalendarCheck size={26} />,
  baby: <Baby size={26} />,
  brush: <Brush size={26} />,
  shield: <Shield size={26} />,
  flask: <FlaskConical size={26} />,
  pill: <Pill size={26} />,
  syringe: <Syringe size={26} />,
  heart: <HeartPulse size={26} />,
  eye: <Eye size={26} />,
  droplet: <Droplet size={26} />,
  banana: <Banana size={26} />,
  clock: <Clock size={26} />,
  alert: <TriangleAlert size={26} />,
  smile: <Smile size={26} />,
  wind: <Wind size={26} />,
  bed: <Bed size={26} />,
  thermometer: <Thermometer size={26} />,
  ban: <Ban size={26} />,
  scale: <Scale size={26} />,
};
const CHUNK_LABEL: Record<string, string> = { moa: "MOA", use: "USE", se: "SIDE EFFECT", ci: "CONTRAINDICATED", caution: "CAUTION", intx: "INTERACTION", lab: "LAB", hold: "HOLD", antidote: "ANTIDOTE", action: "NURSING ACTION", teach: "TEACHING" };

export function MemoryPalace({ act, onDone }: { act: ActivityOf<"palace">; onDone: (r: ActivityResult) => void }) {
  const d = act.data;
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const [stage, setStage] = useState<"explore" | "recall" | "done">("explore");
  const missing = useMemo(() => d.objects[Math.floor(mulberry32(act.id.length * 97 + d.objects.length)() * d.objects.length)], [act.id, d.objects]);
  const recallQ = useMemo(() => {
    const others = shuffle(d.objects.filter((o) => o.id !== missing.id)).slice(0, 3);
    const opts = shuffle([missing, ...others]);
    return { prompt: "One object vanished from the room. What fact did it hold?", options: opts.map((o) => o.fact), answer: [opts.indexOf(missing)], why: `${missing.label} → ${missing.fact}` };
  }, [d.objects, missing]);
  const obj = d.objects.find((o) => o.id === open);

  return (
    <div data-testid="palace">
      <ActivityHeader label="Memory palace" icon={<Castle size={14} />} title={`${act.title}`} prompt={stage === "explore" ? `Tap every object in the ${d.scene}. Each one holds a fact.` : "Look at the empty spot."} />
      <div className="relative w-full overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-indigo-50 via-surface to-amber-50 shadow-inner dark:from-indigo-950/40 dark:via-surface dark:to-amber-950/20" style={{ aspectRatio: "1 / 1" }}>
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-amber-100/60 dark:to-amber-900/20" />
        <div className="absolute left-[8%] top-[8%] h-[30%] w-[26%] rounded-xl border-4 border-white/70 bg-sky-100/70 shadow dark:border-white/10 dark:bg-sky-900/30" aria-hidden />
        {d.objects.map((o) => {
          const gone = stage !== "explore" && o.id === missing.id;
          const isSeen = seen.has(o.id);
          return (
            <motion.button
              key={o.id}
              onClick={() => {
                if (gone || stage !== "explore") return;
                setOpen(o.id);
                setSeen((s) => new Set(s).add(o.id));
                playSound("tap");
              }}
              data-testid="palace-object"
              whileTap={{ scale: 0.9 }}
              className={cx("absolute grid size-[17%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl border-2 shadow-md transition-colors", gone ? "border-dashed border-brand bg-brand-soft/60" : isSeen ? "border-good/60 bg-surface text-ink" : "border-brand/40 bg-surface text-brand")}
              style={{ left: `${o.x}%`, top: `${o.y}%` }}
            >
              {gone ? <span className="text-xl font-black text-brand">?</span> : ICONS[o.icon]}
              {!isSeen && stage === "explore" && <motion.span className="absolute -right-1 -top-1 size-3 rounded-full bg-brand" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />}
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        {obj && stage === "explore" && (
          <motion.div key={obj.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card mt-3 p-3.5" data-testid="palace-fact">
            <div className="flex items-center gap-2">
              <span className="text-brand">{ICONS[obj.icon]}</span>
              <span className="font-extrabold">{obj.label}</span>
              <PillTag tone="brand">{CHUNK_LABEL[obj.chunk]}</PillTag>
            </div>
            <p className="mt-1.5 text-[15px] font-semibold leading-snug">{obj.fact}</p>
          </motion.div>
        )}
      </AnimatePresence>
      {stage === "explore" && (
        <button
          disabled={seen.size < d.objects.length}
          onClick={() => {
            setStage("recall");
            setOpen(null);
          }}
          className="mt-3 min-h-12 w-full rounded-2xl bg-brand font-extrabold text-brand-ink disabled:opacity-40"
          data-testid="palace-ready"
        >
          {seen.size < d.objects.length ? `Explore all objects (${seen.size}/${d.objects.length})` : "I've got it — test me"}
        </button>
      )}
      {stage !== "explore" && (
        <div className="mt-4">
          <MiniQuestionView
            q={recallQ}
            testId="palace-recall"
            onDone={(ok) => {
              setStage("done");
              onDone({ correct: ok, score: ok ? 1 : 0, total: 1, summary: ok ? "Recalled the missing object" : "Needed a retry for the missing object" });
            }}
          />
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted">Source: {act.source}</p>
    </div>
  );
}

// ───────────────────────── VISUAL COMPARE (rebuild the table) ─────────────────────────
const COL = ["#6366f1", "#e11d48", "#059669", "#d97706", "#0891b2", "#c026d3"];

export function CompareChallenge({ act, onDone }: { act: ActivityOf<"compare">; onDone: (r: ActivityResult) => void }) {
  const set = CONTRASTS.find((c) => c.id === act.data.setId)!;
  // choose cells to hide: only cells whose text is unique in the set (avoids ambiguous drops)
  const hidden = useMemo(() => {
    const all = set.rows.flatMap((r, ri) => r.cells.map((t, ci) => ({ key: `${ri}:${ci}`, t })));
    const counts = new Map<string, number>();
    for (const c of all) counts.set(c.t, (counts.get(c.t) ?? 0) + 1);
    const uniq = all.filter((c) => counts.get(c.t) === 1 && c.t !== "—");
    return shuffle(uniq).slice(0, act.data.hide);
  }, [act.data.hide, set.rows]);
  const [filled, setFilled] = useState<Set<string>>(new Set());
  const [misses, setMisses] = useState<Record<string, number>>({});
  const [shake, setShake] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const reported = useRef(false);

  const onDrop = useCallback(
    (item: string, zone: string) => {
      const piece = hidden.find((h) => h.key === item);
      if (!piece) return false;
      if (item === zone) {
        const n = new Set(filled).add(item);
        setFilled(n);
        setMsg(null);
        playSound("snap");
        haptic(10);
        if (n.size === hidden.length && !reported.current) {
          reported.current = true;
          const first = hidden.filter((h) => !misses[h.key]).length;
          playSound("correct");
          onDone({ correct: first / hidden.length >= 0.75, score: first, total: hidden.length, summary: `${first}/${hidden.length} comparison pieces placed first try` });
        }
        return true;
      }
      setMisses((m) => ({ ...m, [item]: (m[item] ?? 0) + 1 }));
      setShake((s) => ({ ...s, [item]: (s[item] ?? 0) + 1 }));
      const [ri] = zone.split(":").map(Number);
      setMsg(`Not the ${set.rows[ri]?.label.toLowerCase()} for that drug. Try another slot.`);
      playSound("wrong");
      return false;
    },
    [filled, hidden, misses, onDone, set.rows],
  );

  const hiddenKeys = new Set(hidden.map((h) => h.key));
  return (
    <div data-testid="compare">
      <ActivityHeader label="Don't mix these up" icon={<Shuffle size={14} />} title={set.title} prompt="Some pieces fell out. Drag each one back to its slot." />
      <div className="mb-2 flex flex-wrap gap-1.5">
        {set.columns.map((c, i) => (
          <span key={c} className="rounded-full px-2 py-0.5 text-[11px] font-extrabold text-white" style={{ background: COL[i] }}>
            {c}
          </span>
        ))}
      </div>
      <DndProvider onDrop={onDrop}>
        <div className="flex flex-col gap-2">
          {set.rows.map((r, ri) => (
            <div key={r.label} className="card p-3">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted">{r.label}</p>
              <div className={cx("mt-1.5 grid gap-1.5", set.columns.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
                {r.cells.map((cell, ci) => {
                  const key = `${ri}:${ci}`;
                  const isHidden = hiddenKeys.has(key) && !filled.has(key);
                  return isHidden ? (
                    <DropZone key={key} id={key} testId="compare-slot" label={`${set.columns[ci]} ${r.label}`} className="flex min-h-11 items-center gap-1.5 rounded-xl border-2 border-dashed px-2 py-1.5" activeClassName="ring-4 ring-brand/40">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: COL[ci] }} />
                      <span className="text-[11px] font-bold text-muted">{set.columns[ci]} · ?</span>
                    </DropZone>
                  ) : (
                    <motion.div key={key} layout initial={hiddenKeys.has(key) ? { rotateX: 90 } : false} animate={{ rotateX: 0 }} className={cx("flex gap-1.5 rounded-xl px-2 py-1.5 text-[13px] font-semibold leading-snug", hiddenKeys.has(key) ? "bg-good-soft" : "bg-surface-2")}>
                      <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ background: COL[ci] }} />
                      {cell}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {msg && <Toast ok={false}>{msg}</Toast>}
        <div className="sticky bottom-2 mt-3 flex flex-wrap justify-center gap-2 rounded-2xl bg-surface-2/95 p-3 shadow-lg backdrop-blur">
          {hidden.filter((h) => !filled.has(h.key)).length === 0 && <p className="text-sm font-bold text-good">Table rebuilt ✓ — {set.takeaway}</p>}
          {hidden
            .filter((h) => !filled.has(h.key))
            .map((h) => (
              <DragItem key={h.key} id={h.key} shake={shake[h.key]} testId="compare-piece" className="max-w-full rounded-xl border-2 border-line bg-surface px-3 py-2 text-[13px] font-bold shadow-sm">
                {h.t}
              </DragItem>
            ))}
        </div>
      </DndProvider>
      <p className="mt-3 text-[11px] text-muted">Source: {set.source}</p>
    </div>
  );
}

// ───────────────────────── DRIP / PUMP LAB ─────────────────────────
export function DripLab({ act, onDone }: { act: ActivityOf<"drip">; onDone: (r: ActivityResult) => void }) {
  const q = getQuestion(act.data.calcId) as FillQuestion | undefined;
  const answer = q?.numeric?.value ?? 0;
  const isGtts = q?.unit === "gtts/min";
  const [val, setVal] = useState(isGtts ? 20 : 100);
  const [tries, setTries] = useState(0);
  const [state, setState] = useState<"set" | "ok" | "miss">("set");
  const reported = useRef(false);
  const [tick, setTick] = useState(0);

  // drip animation speed follows the dial (drops/min → interval)
  useEffect(() => {
    if (!isGtts || val <= 0) return;
    const ms = Math.max(120, Math.min(3000, 60000 / val));
    const t = setInterval(() => setTick((x) => x + 1), ms);
    return () => clearInterval(t);
  }, [isGtts, val]);

  if (!q) return null;
  const stem = q.stem.replace(/\s*____.*$/, "");
  const check = () => {
    const ok = Math.abs(val - answer) <= (q.numeric?.tolerance ?? 0.001) + 1e-9;
    setTries((t) => t + 1);
    if (ok) {
      setState("ok");
      playSound("correct");
      haptic(12);
      if (!reported.current) {
        reported.current = true;
        onDone({ correct: tries === 0, score: tries === 0 ? 1 : 0, total: 1, summary: `Set ${val} ${q.unit}${tries ? ` after ${tries} tr${tries === 1 ? "y" : "ies"}` : " first try"}` });
      }
    } else {
      setState("miss");
      playSound("wrong");
      haptic([20, 30, 20]);
    }
  };
  const step = (n: number) => {
    if (state === "ok") return;
    setVal((v) => Math.max(0, Math.round((v + n) * 10) / 10));
    setState("set");
    playSound("tap");
  };

  return (
    <div data-testid="drip-lab">
      <ActivityHeader label={isGtts ? "Drip lab" : "Pump lab"} icon={<Syringe size={14} />} title={stem} prompt={`Set the ${isGtts ? "drip rate" : "pump"} — then start the infusion.`} />
      <div className="grid grid-cols-[0.9fr_1.1fr] items-center gap-3">
        <svg viewBox="0 0 120 200" className="h-auto w-full" aria-hidden>
          <rect x="30" y="6" width="60" height="70" rx="12" fill="#bae6fd" stroke="#38bdf8" strokeWidth="3" />
          <rect x="36" y="30" width="48" height="40" rx="8" fill="#7dd3fc" opacity="0.7" />
          <text x="60" y="24" textAnchor="middle" fontSize="10" fontWeight="800" fill="#0c4a6e">IV</text>
          <rect x="52" y="76" width="16" height="10" fill="#94a3b8" />
          <rect x="46" y="86" width="28" height="44" rx="8" fill="#e0f2fe" stroke="#94a3b8" strokeWidth="2" />
          <rect x="48" y="116" width="24" height="12" rx="4" fill="#7dd3fc" />
          {isGtts && (
            <motion.circle key={tick} cx="60" cy="92" r="3.5" fill="#0284c7" initial={{ cy: 92, opacity: 1 }} animate={{ cy: 114, opacity: 0.2 }} transition={{ duration: 0.35 }} />
          )}
          <path d="M60 130 C60 160, 100 150, 100 196" fill="none" stroke="#94a3b8" strokeWidth="3" />
          {!isGtts && (
            <g>
              <rect x="4" y="140" width="64" height="44" rx="8" fill="#0f172a" />
              <text x="36" y="168" textAnchor="middle" fontSize="15" fontWeight="900" fill="#34d399">
                {val}
              </text>
              <text x="36" y="180" textAnchor="middle" fontSize="7" fill="#94a3b8">
                mL/hr
              </text>
            </g>
          )}
        </svg>
        <div>
          <div className="rounded-2xl bg-slate-950 p-3 text-center font-mono text-emerald-300 shadow-inner">
            <span className="block text-[11px] uppercase tracking-wider text-slate-400">rate</span>
            <motion.span key={val} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="block text-[32px] font-black leading-none" data-testid="drip-value">
              {val}
            </motion.span>
            <span className="text-[12px] text-slate-400">{q.unit}</span>
          </div>
          <div className={cx("mt-2 grid gap-1.5", isGtts ? "grid-cols-4" : "grid-cols-3")}>
            {(isGtts ? [-10, -1, 1, 10] : [-50, -10, -1, 1, 10, 50]).map((n) => (
              <button key={n} onClick={() => step(n)} className="flex min-h-12 items-center justify-center rounded-xl border-2 border-line bg-surface text-[13px] font-black" data-testid={`drip-step-${n}`}>
                {n < 0 ? <Minus size={12} /> : <Plus size={12} />}
                {Math.abs(n)}
              </button>
            ))}
          </div>
        </div>
      </div>
      {state !== "ok" && (
        <button onClick={check} className="mt-3 min-h-12 w-full rounded-2xl bg-brand font-extrabold text-brand-ink" data-testid="drip-check">
          Start infusion at {val} {q.unit}
        </button>
      )}
      {state === "miss" && (
        <Toast ok={false}>
          {val > answer ? "Too fast" : "Too slow"} — work it again: {isGtts ? "(mL/hr × drop factor) ÷ 60, round to a whole drop." : "total volume ÷ hours (convert minutes to hours)."}
        </Toast>
      )}
      {state === "ok" && (
        <div className="mt-3 rounded-2xl bg-good-soft p-3.5" data-testid="drip-done">
          <p className="font-extrabold text-good">
            ✓ Infusing at {answer} {q.unit}
          </p>
          <ol className="mt-1.5 space-y-1 text-[13.5px]">
            {q.steps?.map((s, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.25 }} className="flex gap-2">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-good text-[11px] font-black text-white">{i + 1}</span>
                {s}
              </motion.li>
            ))}
          </ol>
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted">Practice numbers only · Source: {act.source}</p>
    </div>
  );
}
