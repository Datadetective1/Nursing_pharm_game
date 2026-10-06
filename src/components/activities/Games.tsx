"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "motion/react";
import { Search, Columns3, Hand, ListOrdered, BedDouble, Droplets, Gauge as GaugeIcon, MonitorDot, ClipboardList, TestTubes, Utensils, Smile, Sticker, Pointer, FlaskConical, Pill, CalendarDays, ThumbsUp, TriangleAlert, Check, X } from "lucide-react";
import type { ActivityOf, ActivityResult, RoomObject } from "@/lib/activities/types";
import { DndProvider, DragItem, DropZone } from "@/components/interact/dnd";
import { ActivityHeader, MiniQuestionView, Toast } from "@/components/interact/common";
import { cx, haptic } from "@/components/ui";
import { playSound } from "@/lib/sound";
import { shuffle } from "@/lib/rng";

// ───────────────────────── Clinical room ─────────────────────────
/** Object catalog for the clinical room (order = layout order in the room). */
const OBJ: Record<RoomObject, { icon: React.ReactNode; name: string }> = {
  "iv-bag": { icon: <Droplets size={24} />, name: "IV bag" },
  labs: { icon: <TestTubes size={24} />, name: "Lab panel" },
  monitor: { icon: <MonitorDot size={24} />, name: "Monitor" },
  pump: { icon: <GaugeIcon size={24} />, name: "Pump" },
  patient: { icon: <BedDouble size={26} />, name: "Client" },
  skin: { icon: <Hand size={24} />, name: "Skin" },
  mouth: { icon: <Smile size={24} />, name: "Mouth / gums" },
  bed: { icon: <BedDouble size={26} />, name: "Bed" },
  patch: { icon: <Sticker size={24} />, name: "Patch" },
  "med-cup": { icon: <Pill size={24} />, name: "Med cup" },
  tray: { icon: <Utensils size={24} />, name: "Food tray" },
  pca: { icon: <Pointer size={24} />, name: "PCA button" },
  vial: { icon: <FlaskConical size={24} />, name: "Vial" },
  mar: { icon: <ClipboardList size={24} />, name: "MAR" },
  calendar: { icon: <CalendarDays size={24} />, name: "Calendar" },
};
const OBJ_ORDER = Object.keys(OBJ) as RoomObject[];

/** Original SVG: hospital room with the client in bed, IV pole and monitor. */
function RoomScene() {
  return (
    <svg viewBox="0 0 320 110" className="w-full" aria-hidden>
      <rect x="18" y="8" width="64" height="44" rx="6" className="fill-sky-100 stroke-sky-300 dark:fill-slate-700 dark:stroke-slate-500" strokeWidth="2" />
      <line x1="50" y1="8" x2="50" y2="52" className="stroke-sky-300 dark:stroke-slate-500" strokeWidth="2" />
      <rect x="236" y="10" width="62" height="40" rx="6" className="fill-slate-900" />
      <polyline points="242,32 254,32 259,20 265,42 271,28 277,32 292,32" fill="none" stroke="#34d399" strokeWidth="2" strokeLinejoin="round" />
      <line x1="226" y1="18" x2="226" y2="96" className="stroke-slate-400" strokeWidth="2.5" />
      <rect x="216" y="18" width="20" height="26" rx="5" className="fill-sky-200 stroke-sky-400" strokeWidth="1.5" />
      <path d="M226 44 C 226 62, 200 64, 186 70" fill="none" className="stroke-slate-400" strokeWidth="1.5" />
      <rect x="70" y="74" width="140" height="12" rx="5" className="fill-slate-300 dark:fill-slate-600" />
      <rect x="78" y="86" width="6" height="16" rx="2" className="fill-slate-400" />
      <rect x="196" y="86" width="6" height="16" rx="2" className="fill-slate-400" />
      <rect x="66" y="56" width="10" height="30" rx="4" className="fill-slate-400" />
      <ellipse cx="96" cy="66" rx="16" ry="8" className="fill-white stroke-slate-300 dark:fill-slate-300" strokeWidth="1.5" />
      <circle cx="98" cy="58" r="11" className="fill-amber-200 stroke-amber-300" strokeWidth="1.5" />
      <rect x="110" y="60" width="96" height="16" rx="8" className="fill-indigo-300 dark:fill-indigo-400" />
    </svg>
  );
}

export function ClinicalRoom({ act, onDone }: { act: ActivityOf<"room">; onDone: (r: ActivityResult) => void }) {
  const d = act.data;
  const [open, setOpen] = useState<string | null>(null);
  const [verdicts, setVerdicts] = useState<Record<string, boolean>>({}); // hotspot id -> learner said "problem"
  const reported = useRef(false);
  const hot = d.hotspots.find((h) => h.id === open);
  const judged = Object.keys(verdicts).length;
  const problems = d.hotspots.filter((h) => h.problem);
  const found = problems.filter((h) => verdicts[h.id] === true).length;
  const ordered = useMemo(() => [...d.hotspots].sort((a, b) => OBJ_ORDER.indexOf(a.object) - OBJ_ORDER.indexOf(b.object)), [d.hotspots]);
  const detailRef = useRef<HTMLDivElement>(null);
  const inspect = (id: string) => {
    setOpen(id);
    requestAnimationFrame(() => detailRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  };

  const judge = (id: string, saysProblem: boolean) => {
    const h = d.hotspots.find((x) => x.id === id)!;
    const next = { ...verdicts, [id]: saysProblem };
    setVerdicts(next);
    const right = saysProblem === h.problem;
    playSound(right ? "correct" : "wrong");
    haptic(right ? 10 : [20, 30, 20]);
    if (Object.keys(next).length === d.hotspots.length && !reported.current) {
      reported.current = true;
      const score = d.hotspots.filter((x) => next[x.id] === x.problem).length;
      onDone({ correct: score / d.hotspots.length >= 0.8, score, total: d.hotspots.length, summary: `${score}/${d.hotspots.length} room findings judged correctly` });
    }
  };

  return (
    <div data-testid="room">
      <ActivityHeader label="What's wrong with this client?" icon={<Search size={14} />} title={d.client} prompt={d.prompt} />
      <div className="mb-2 flex items-center justify-between text-[12px] font-extrabold text-muted">
        <span>
          Inspected {judged}/{d.hotspots.length}
        </span>
        <span className="text-bad">
          Problems found {found}/{problems.length}
        </span>
      </div>
      <div className="overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-sky-50 to-amber-50 p-3 dark:from-slate-800 dark:to-slate-900">
        <RoomScene />
        <div className="mt-2 grid grid-cols-3 gap-2.5">
          {ordered.map((h) => {
            const o = OBJ[h.object];
            const v = verdicts[h.id];
            const done = v !== undefined;
            const right = done && v === h.problem;
            return (
              <motion.button
                key={h.id}
                onClick={() => inspect(h.id)}
                whileTap={{ scale: 0.92 }}
                data-testid="room-object"
                className={cx(
                  "relative flex min-h-[84px] flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-surface/95 px-1 py-2 text-center shadow-md",
                  !done && "border-brand/40",
                  done && (h.problem ? "border-bad" : "border-good"),
                  open === h.id && "ring-4 ring-brand/40",
                )}
              >
                <span className={cx(done ? (h.problem ? "text-bad" : "text-good") : "text-brand")}>{o.icon}</span>
                <span className="text-[11px] font-extrabold leading-tight">{h.label}</span>
                {done && <span className={cx("absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full text-white", right ? "bg-good" : "bg-warn")}>{right ? <Check size={12} /> : <X size={12} />}</span>}
                {!done && <motion.span className="absolute -right-1 -top-1 size-3 rounded-full bg-brand" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />}
              </motion.button>
            );
          })}
        </div>
      </div>
      <AnimatePresence>
        {hot && (
          <motion.div ref={detailRef} key={hot.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card mt-3 scroll-mb-24 p-4" data-testid="room-detail">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted">{OBJ[hot.object].name}</p>
            <p className="mt-1 text-[16px] font-bold leading-snug">{hot.detail}</p>
            {verdicts[hot.id] === undefined ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => judge(hot.id, true)} className="flex min-h-12 items-center justify-center gap-1.5 rounded-2xl border-2 border-bad/50 bg-bad-soft font-extrabold text-bad" data-testid="room-problem">
                  <TriangleAlert size={16} /> Concerning
                </button>
                <button onClick={() => judge(hot.id, false)} className="flex min-h-12 items-center justify-center gap-1.5 rounded-2xl border-2 border-good/50 bg-good-soft font-extrabold text-good" data-testid="room-fine">
                  <ThumbsUp size={16} /> Looks fine
                </button>
              </div>
            ) : (
              <Toast ok={verdicts[hot.id] === hot.problem}>
                <b>{hot.problem ? "Safety problem. " : "This one's fine. "}</b>
                {hot.why}
              </Toast>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {!hot && <p className="mt-3 text-center text-[13px] font-semibold text-muted">Tap each object to inspect it.</p>}
      <p className="mt-3 text-[11px] text-muted">Source: {act.source}</p>
    </div>
  );
}

// ───────────────────────── Sorter ─────────────────────────
const BIN_COLORS = ["#e11d48", "#10b981", "#6366f1"];

export function Sorter({ act, onDone }: { act: ActivityOf<"sorter">; onDone: (r: ActivityResult) => void }) {
  const d = act.data;
  const deck = useMemo(() => shuffle(d.cards), [d.cards]);
  const [i, setI] = useState(0);
  const [missed, setMissed] = useState<Set<number>>(new Set());
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [shake, setShake] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const card = deck[i];

  const advance = useCallback(() => {
    setMsg(null);
    setWaiting(false);
    if (i + 1 >= deck.length) {
      const score = deck.length - missed.size;
      onDone({ correct: score / deck.length >= 0.8, score, total: deck.length, summary: `${score}/${deck.length} sorted correctly first try` });
    }
    setI((x) => x + 1);
  }, [deck.length, i, missed.size, onDone]);

  const onDrop = useCallback(
    (_item: string, zone: string) => {
      if (!card || waiting) return false;
      if (zone === card.bin) {
        setCounts((c) => ({ ...c, [zone]: (c[zone] ?? 0) + 1 }));
        setMsg({ ok: true, text: card.why });
        setWaiting(true);
        playSound("snap");
        haptic(10);
        return true;
      }
      setMissed((m) => new Set(m).add(i));
      setShake((s) => s + 1);
      setMsg({ ok: false, text: "Not that bin — think it through and try again." });
      playSound("wrong");
      haptic([20, 30, 20]);
      return false;
    },
    [card, i, waiting],
  );

  return (
    <div data-testid="sorter">
      <ActivityHeader label={`Sort it · ${Math.min(i + 1, deck.length)}/${deck.length}`} icon={<Columns3 size={14} />} title={d.prompt} prompt="Drag the card into a bin — or tap the card, then a bin." />
      <DndProvider onDrop={onDrop}>
        <div className={cx("grid gap-2", d.bins.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
          {d.bins.map((b, k) => (
            <DropZone key={b.id} id={b.id} testId="sorter-bin" label={b.label} className="flex min-h-28 flex-col items-center justify-center rounded-3xl border-2 border-dashed p-2 text-center" activeClassName="scale-[1.04] border-solid ring-4 ring-brand/40">
              <span className="text-[13px] font-black uppercase leading-tight tracking-wide" style={{ color: BIN_COLORS[k] }}>
                {b.label}
              </span>
              {b.sub && <span className="mt-0.5 text-[10.5px] font-semibold text-muted">{b.sub}</span>}
              <motion.span key={counts[b.id] ?? 0} initial={{ scale: 1.6 }} animate={{ scale: 1 }} className="mt-1.5 grid size-7 place-items-center rounded-full text-[12px] font-black text-white" style={{ background: BIN_COLORS[k] }}>
                {counts[b.id] ?? 0}
              </motion.span>
            </DropZone>
          ))}
        </div>
        <div className="mt-4 grid min-h-28 place-items-center">
          <AnimatePresence mode="popLayout">
            {card && !waiting && (
              <motion.div key={i} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}>
                <DragItem id={`card-${i}`} shake={shake} testId="sort-card" className="min-w-52 rounded-2xl border-2 border-line bg-surface px-5 py-4 text-center text-[16px] font-extrabold shadow-lg">
                  {card.text}
                </DragItem>
              </motion.div>
            )}
          </AnimatePresence>
          {!card && <p className="text-sm font-bold text-good">Deck complete ✓</p>}
        </div>
      </DndProvider>
      {msg && <Toast ok={msg.ok}>{msg.text}</Toast>}
      {waiting && (
        <button onClick={advance} className="mt-3 min-h-12 w-full rounded-2xl bg-brand font-extrabold text-brand-ink" data-testid="sorter-next">
          {i + 1 >= deck.length ? "Finish" : "Next card →"}
        </button>
      )}
      <p className="mt-3 text-[11px] text-muted">Source: {act.source}</p>
    </div>
  );
}

// ───────────────────────── Swipe deck ─────────────────────────
export function SwipeDeck({ act, onDone }: { act: ActivityOf<"swipe">; onDone: (r: ActivityResult) => void }) {
  const d = act.data;
  const deck = useMemo(() => shuffle(d.cards), [d.cards]);
  const [i, setI] = useState(0);
  const [result, setResult] = useState<{ ok: boolean; why: string; side: "left" | "right" } | null>(null);
  const score = useRef(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-160, 160], [-14, 14]);
  const leftOpacity = useTransform(x, [-120, -20], [1, 0]);
  const rightOpacity = useTransform(x, [20, 120], [0, 1]);
  const card = deck[i];

  const decide = (side: "left" | "right") => {
    if (!card || result) return;
    const ok = side === card.side;
    if (ok) score.current += 1;
    setResult({ ok, why: card.why, side: card.side });
    playSound(ok ? "correct" : "wrong");
    haptic(ok ? 10 : [20, 30, 20]);
    void animate(x, side === "left" ? -420 : 420, { duration: 0.25 });
  };

  const next = () => {
    setResult(null);
    x.set(0);
    if (i + 1 >= deck.length) onDone({ correct: score.current / deck.length >= 0.8, score: score.current, total: deck.length, summary: `${score.current}/${deck.length} swipes correct` });
    setI(i + 1);
  };

  return (
    <div data-testid="swipe">
      <ActivityHeader label={`Swipe · ${Math.min(i + 1, deck.length)}/${deck.length}`} icon={<Hand size={14} />} title={d.prompt} prompt={`Swipe ← ${d.left}   ·   ${d.right} →`} />
      <div className="relative grid h-56 place-items-center">
        {card && (
          <>
            <motion.span style={{ opacity: leftOpacity }} className="absolute left-0 top-3 rounded-xl border-2 border-bad px-2 py-1 text-[12px] font-black uppercase text-bad">
              {d.left}
            </motion.span>
            <motion.span style={{ opacity: rightOpacity }} className="absolute right-0 top-3 rounded-xl border-2 border-good px-2 py-1 text-[12px] font-black uppercase text-good">
              {d.right}
            </motion.span>
            <motion.div
              key={i}
              drag={result ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.9}
              style={{ x, rotate, touchAction: "pan-y" }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -90) decide("left");
                else if (info.offset.x > 90) decide("right");
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              data-testid="swipe-card"
              className="w-[82%] cursor-grab rounded-3xl border-2 border-line bg-surface p-5 text-center shadow-xl active:cursor-grabbing"
            >
              <p className="text-[19px] font-extrabold leading-snug">{card.text}</p>
              {card.detail && <p className="mt-1.5 text-[13px] font-semibold text-muted">{card.detail}</p>}
            </motion.div>
          </>
        )}
        {!card && <p className="text-sm font-bold text-good">Deck complete ✓</p>}
      </div>
      {result ? (
        <>
          <Toast ok={result.ok}>
            <b>{result.side === "left" ? d.left : d.right}.</b> {result.why}
          </Toast>
          <button onClick={next} className="mt-3 min-h-12 w-full rounded-2xl bg-brand font-extrabold text-brand-ink" data-testid="swipe-next">
            {i + 1 >= deck.length ? "Finish" : "Next →"}
          </button>
        </>
      ) : (
        card && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button onClick={() => decide("left")} className="min-h-14 rounded-2xl border-2 border-bad/50 bg-bad-soft text-[15px] font-black uppercase text-bad" data-testid="swipe-left">
              ← {d.left}
            </button>
            <button onClick={() => decide("right")} className="min-h-14 rounded-2xl border-2 border-good/50 bg-good-soft text-[15px] font-black uppercase text-good" data-testid="swipe-right">
              {d.right} →
            </button>
          </div>
        )
      )}
      <p className="mt-3 text-[11px] text-muted">Source: {act.source}</p>
    </div>
  );
}

// ───────────────────────── Sequence / timeline builder ─────────────────────────
export function SequenceBuilder({ act, onDone }: { act: ActivityOf<"sequence">; onDone: (r: ActivityResult) => void }) {
  const d = act.data;
  const tray = useMemo(() => shuffle(d.steps.map((_, i) => i)), [d.steps]);
  const [filled, setFilled] = useState<number[]>([]); // step indices placed in order
  const [misses, setMisses] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [shake, setShake] = useState<Record<string, number>>({});
  const [replay, setReplay] = useState(0);
  const [followDone, setFollowDone] = useState(false);
  const complete = filled.length === d.steps.length;
  const reported = useRef(false);

  const report = useCallback(
    (followOk: boolean | null) => {
      if (reported.current) return;
      reported.current = true;
      const total = d.steps.length + (followOk === null ? 0 : 1);
      const score = Math.max(0, d.steps.length - misses) + (followOk ? 1 : 0);
      onDone({ correct: misses <= 1 && followOk !== false, score, total, summary: `Sequence built with ${misses} misplacement${misses === 1 ? "" : "s"}` });
    },
    [d.steps.length, misses, onDone],
  );

  const onDrop = useCallback(
    (item: string, zone: string) => {
      const idx = Number(item.replace("s", ""));
      const slot = Number(zone.replace("slot", ""));
      if (slot !== filled.length) {
        setMsg("Fill the timeline in order — start with the next empty step.");
        return false;
      }
      if (idx === slot) {
        const next = [...filled, idx];
        setFilled(next);
        setMsg(null);
        playSound("snap");
        haptic(10);
        if (next.length === d.steps.length) {
          setReplay((r) => r + 1);
          playSound("correct");
          if (!d.followUp) report(null);
        }
        return true;
      }
      setMisses((m) => m + 1);
      setShake((s) => ({ ...s, [item]: (s[item] ?? 0) + 1 }));
      setMsg(idx > slot ? `"${d.steps[idx].text}" comes LATER in the sequence.` : `"${d.steps[idx].text}" comes EARLIER.`);
      playSound("wrong");
      haptic([20, 30, 20]);
      return false;
    },
    [d.followUp, d.steps, filled, report],
  );

  return (
    <div data-testid="sequence">
      <ActivityHeader label="Timeline" icon={<ListOrdered size={14} />} title={d.prompt} prompt="Drag each card into the next empty step (or tap card → tap step)." />
      <DndProvider onDrop={onDrop}>
        <ol className="relative ml-3 border-l-4 border-line pl-5">
          {d.steps.map((s, slot) => {
            const placed = filled[slot] !== undefined;
            return (
              <li key={slot} className="relative mb-2.5">
                <motion.span
                  className={cx("absolute -left-[34px] top-3 grid size-7 place-items-center rounded-full text-[12px] font-black", placed ? "bg-good text-white" : "bg-surface-2 text-muted")}
                  animate={complete ? { scale: [1, 1.35, 1] } : undefined}
                  transition={{ delay: slot * 0.35, duration: 0.5 }}
                  key={`${slot}-${replay}`}
                >
                  {slot + 1}
                </motion.span>
                <DropZone id={`slot${slot}`} testId="sequence-slot" label={`Step ${slot + 1}`} className={cx("min-h-14 rounded-2xl border-2 px-3 py-2.5", placed ? "border-good/50 bg-good-soft" : slot === filled.length ? "border-dashed border-brand/60 bg-brand-soft/40" : "border-dashed border-line")} activeClassName="ring-4 ring-brand/40">
                  {placed ? (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                      <p className="text-[14.5px] font-extrabold">{d.steps[filled[slot]].text}</p>
                      {d.steps[filled[slot]].detail && <p className="text-[12.5px] text-muted">{d.steps[filled[slot]].detail}</p>}
                    </motion.div>
                  ) : (
                    <p className="text-[12px] font-bold text-muted">{slot === filled.length ? "Next step goes here" : "…"}</p>
                  )}
                </DropZone>
              </li>
            );
          })}
        </ol>
        {msg && <Toast ok={false}>{msg}</Toast>}
        {!complete && (
          <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-surface-2 p-3">
            {tray
              .filter((i) => !filled.includes(i))
              .map((i) => (
                <DragItem key={i} id={`s${i}`} shake={shake[`s${i}`]} testId="sequence-card" className="rounded-xl border-2 border-line bg-surface px-3.5 py-3 text-[14.5px] font-bold shadow-sm">
                  {d.steps[i].text}
                </DragItem>
              ))}
          </div>
        )}
      </DndProvider>
      {complete && d.followUp && (
        <div className="mt-4">
          <MiniQuestionView
            q={d.followUp}
            testId="sequence-follow"
            onDone={(ok) => {
              setFollowDone(true);
              report(ok);
            }}
          />
        </div>
      )}
      {complete && (!d.followUp || followDone) && <Toast ok testId="sequence-done">Sequence locked in. Say it once out loud, start to finish.</Toast>}
      <p className="mt-3 text-[11px] text-muted">Source: {act.source}</p>
    </div>
  );
}
