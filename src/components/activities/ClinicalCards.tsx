"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ClipboardList, Stethoscope, TriangleAlert, MonitorDot, Wind, Droplet, HeartPulse, Brain, Hand, FlaskConical, Activity as ActivityIcon, Droplets, ArrowRight, Check } from "lucide-react";
import type { ActivityOf, ActivityResult, ChartRow, PriorityData } from "@/lib/activities/types";
import { DndProvider, DragItem, DropZone } from "@/components/interact/dnd";
import { ActivityHeader, MiniQuestionView, Toast } from "@/components/interact/common";
import { cx, haptic } from "@/components/ui";
import { playSound } from "@/lib/sound";

// ───────────────────────── Patient chart ─────────────────────────
const FLAG: Record<NonNullable<ChartRow["flag"]>, { cls: string; sym: string }> = {
  high: { cls: "text-bad", sym: "▲" },
  low: { cls: "text-warn", sym: "▼" },
  critical: { cls: "text-bad animate-pulse", sym: "‼" },
  ok: { cls: "text-good", sym: "✓" },
  note: { cls: "text-brand", sym: "•" },
};

export function ChartCard({ patient, meds, rows, findings }: { patient: string; meds?: string[]; rows: ChartRow[]; findings?: string[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-line bg-surface shadow-sm" data-testid="patient-chart">
      <div className="flex items-center gap-2 bg-surface-2 px-3.5 py-2">
        <ClipboardList size={15} className="text-brand" />
        <span className="text-[13px] font-extrabold">{patient}</span>
      </div>
      {meds && meds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-line px-3.5 py-2">
          {meds.map((m) => (
            <span key={m} className="rounded-full bg-brand-soft px-2 py-0.5 text-[11.5px] font-bold text-brand">
              💊 {m}
            </span>
          ))}
        </div>
      )}
      <dl className="divide-y divide-line">
        {rows.map((r) => (
          <div key={r.label + r.value} className="flex items-center justify-between gap-3 px-3.5 py-1.5 text-[13.5px]">
            <dt className="font-semibold text-muted">{r.label}</dt>
            <dd className={cx("flex items-center gap-1.5 text-right font-extrabold", r.flag && FLAG[r.flag].cls)}>
              {r.value}
              {r.flag && <span className="text-[11px]">{FLAG[r.flag].sym}</span>}
            </dd>
          </div>
        ))}
      </dl>
      {findings && findings.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-line px-3.5 py-2">
          {findings.map((f) => (
            <span key={f} className="rounded-full bg-warn-soft px-2 py-0.5 text-[11.5px] font-bold text-ink">
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function PatientChart({ act, onDone }: { act: ActivityOf<"chart">; onDone: (r: ActivityResult) => void }) {
  const d = act.data;
  return (
    <div data-testid="chart-activity">
      <ActivityHeader label="Patient chart" icon={<ClipboardList size={14} />} title={act.title} prompt="Read the chart. Then decide." />
      <ChartCard patient={d.patient} meds={d.meds} rows={d.rows} findings={d.findings} />
      <div className="mt-4">
        <MiniQuestionView q={d.question} onDone={(ok) => onDone({ correct: ok, score: ok ? 1 : 0, total: 1, summary: ok ? "Interpreted the chart first try" : "Needed a retry on the chart" })} />
      </div>
      <p className="mt-3 text-[11px] text-muted">Source: {act.source}</p>
    </div>
  );
}

// ───────────────────────── Priority Zone ─────────────────────────
const VISUAL: Record<PriorityData["visual"], { icon: React.ReactNode; label: string }> = {
  airway: { icon: <Wind size={28} />, label: "AIRWAY" },
  breathing: { icon: <Wind size={28} />, label: "BREATHING" },
  bleeding: { icon: <Droplet size={28} />, label: "BLOOD" },
  heart: { icon: <HeartPulse size={28} />, label: "HEART" },
  brain: { icon: <Brain size={28} />, label: "NEURO" },
  skin: { icon: <Hand size={28} />, label: "SKIN" },
  liver: { icon: <FlaskConical size={28} />, label: "LIVER" },
  muscle: { icon: <ActivityIcon size={28} />, label: "MUSCLE" },
  kidney: { icon: <Droplets size={28} />, label: "KIDNEY / K⁺" },
};

export function PriorityZone({ act, onDone }: { act: ActivityOf<"priority">; onDone: (r: ActivityResult) => void }) {
  const d = act.data;
  const [placed, setPlaced] = useState(false);
  const [misses, setMisses] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [shake, setShake] = useState<Record<string, number>>({});

  const onDrop = useCallback(
    (item: string, zone: string) => {
      if (zone !== "priority" || placed) return false;
      const idx = Number(item.replace("f", ""));
      if (idx === d.answer) {
        setPlaced(true);
        setMsg(null);
        playSound("correct");
        haptic([15, 40, 15]);
        onDone({ correct: misses === 0, score: misses === 0 ? 1 : 0, total: 1, summary: misses === 0 ? "Picked the priority first try" : `Priority found after ${misses} miss${misses > 1 ? "es" : ""}` });
        return true;
      }
      setMisses((m) => m + 1);
      setShake((s) => ({ ...s, [item]: (s[item] ?? 0) + 1 }));
      setMsg(`"${d.findings[idx]}" can wait. Which finding is dangerous right now?`);
      playSound("wrong");
      haptic([20, 30, 20]);
      return false;
    },
    [d, misses, onDone, placed],
  );

  const v = VISUAL[d.visual];
  return (
    <div data-testid="priority">
      <ActivityHeader label="Priority Zone" icon={<TriangleAlert size={14} />} title={`${d.client} · ${d.drug}`} prompt="Drag the finding that needs IMMEDIATE action into the red zone." />
      <DndProvider onDrop={onDrop}>
        <DropZone id="priority" testId="priority-zone" label="Priority zone" className={cx("relative grid min-h-28 place-items-center overflow-hidden rounded-3xl border-2 border-dashed p-3 text-center", placed ? "border-bad bg-bad-soft" : "border-bad/50 bg-bad-soft/40")} activeClassName="scale-[1.02] border-solid ring-4 ring-bad/40">
          <AnimatePresence mode="wait">
            {placed ? (
              <motion.div key="hit" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-1">
                <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1, repeat: 2 }} className="grid size-14 place-items-center rounded-full bg-bad text-white shadow-lg">
                  {v.icon}
                </motion.span>
                <span className="text-[12px] font-black tracking-widest text-bad">{v.label}</span>
                <span className="text-[14px] font-extrabold">{d.findings[d.answer]}</span>
              </motion.div>
            ) : (
              <motion.div key="empty" className="flex flex-col items-center gap-1 text-bad/80">
                <TriangleAlert size={26} />
                <span className="text-[12px] font-black uppercase tracking-widest">Priority zone</span>
              </motion.div>
            )}
          </AnimatePresence>
        </DropZone>
        {msg && <Toast ok={false}>{msg}</Toast>}
        {placed && (
          <Toast ok testId="priority-done">
            {d.why}
          </Toast>
        )}
        <div className="mt-3 grid gap-2">
          {d.findings.map((f, i) =>
            placed && i === d.answer ? null : (
              <DragItem key={f} id={`f${i}`} shake={shake[`f${i}`]} disabled={placed} testId="finding-card" className={cx("rounded-2xl border-2 border-line bg-surface px-4 py-3 text-[15px] font-bold shadow-sm", placed && "opacity-50")}>
                {f}
              </DragItem>
            ),
          )}
        </div>
      </DndProvider>
      <p className="mt-3 text-[11px] text-muted">Source: {act.source}</p>
    </div>
  );
}

// ───────────────────────── Lab dashboard / monitor ─────────────────────────
export function LabMonitor({ act, onDone }: { act: ActivityOf<"monitor">; onDone: (r: ActivityResult) => void }) {
  const d = act.data;
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [checked, setChecked] = useState(false);

  const check = () => {
    const right = d.tiles.filter((t, i) => t.action === flags.has(i)).length;
    const ok = right === d.tiles.length;
    setChecked(true);
    playSound(ok ? "correct" : "wrong");
    onDone({ correct: ok, score: right, total: d.tiles.length, summary: `${right}/${d.tiles.length} monitor tiles judged correctly` });
  };

  return (
    <div data-testid="monitor">
      <ActivityHeader label="Lab dashboard" icon={<MonitorDot size={14} />} title={d.client} prompt="Tap every reading that needs nurse action, then check." />
      <div className="rounded-3xl bg-slate-950 p-3 shadow-xl ring-1 ring-white/10">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {d.meds.map((m) => (
            <span key={m} className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-slate-200">
              {m}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {d.tiles.map((t, i) => {
            const on = flags.has(i);
            const right = checked && t.action === on;
            return (
              <button
                key={t.label}
                disabled={checked}
                data-testid="monitor-tile"
                data-action={String(t.action)}
                onClick={() => {
                  const n = new Set(flags);
                  if (on) n.delete(i);
                  else n.add(i);
                  setFlags(n);
                  playSound("tap");
                  haptic(6);
                }}
                className={cx(
                  "min-h-20 rounded-2xl border-2 p-2.5 text-left font-mono transition-all",
                  !checked && (on ? "border-amber-400 bg-amber-400/15" : "border-white/10 bg-white/5"),
                  checked && (right ? (t.action ? "border-emerald-400 bg-emerald-400/15" : "border-white/10 bg-white/5") : "border-rose-400 bg-rose-400/15"),
                )}
              >
                <span className="block text-[10.5px] uppercase tracking-wider text-slate-400">{t.label}</span>
                <span className={cx("block text-[19px] font-black", t.action && checked ? "text-amber-300" : "text-emerald-300")}>
                  {t.value}
                  {t.unit && <span className="ml-1 text-[11px] text-slate-400">{t.unit}</span>}
                </span>
                {on && !checked && <span className="text-[10px] font-bold text-amber-300">⚑ flagged</span>}
                {checked && <span className="mt-0.5 block font-sans text-[11px] font-semibold leading-snug text-slate-200">{t.why}</span>}
              </button>
            );
          })}
        </div>
      </div>
      {!checked && (
        <button onClick={check} className="mt-3 min-h-12 w-full rounded-2xl bg-brand font-extrabold text-brand-ink" data-testid="monitor-check">
          Check my flags ({flags.size})
        </button>
      )}
      {checked && (
        <Toast ok={d.tiles.every((t, i) => t.action === flags.has(i))} testId="monitor-done">
          Needs action: {d.tiles.filter((t) => t.action).map((t) => t.label).join(" · ")}
        </Toast>
      )}
      <p className="mt-3 text-[11px] text-muted">Source: {act.source}</p>
    </div>
  );
}

// ───────────────────────── Micro-simulation ─────────────────────────
export function MicroSim({ act, onDone }: { act: ActivityOf<"sim">; onDone: (r: ActivityResult) => void }) {
  const d = act.data;
  const [step, setStep] = useState(-1); // -1 = intro
  const [chosen, setChosen] = useState<number | null>(null);
  const [wrongs, setWrongs] = useState<number[]>([]);
  const [firsts, setFirsts] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const node = step >= 0 ? d.nodes[step] : null;

  const choose = (i: number) => {
    if (!node || chosen !== null) return;
    const c = node.choices[i];
    if (c.correct) {
      setChosen(i);
      setFirsts((f) => [...f, wrongs.length === 0]);
      playSound("correct");
      haptic(12);
    } else {
      setWrongs((w) => (w.includes(i) ? w : [...w, i]));
      playSound("wrong");
      haptic([20, 30, 20]);
    }
  };

  const next = () => {
    if (step + 1 >= d.nodes.length) {
      setFinished(true);
      const score = firsts.filter(Boolean).length;
      onDone({ correct: score >= d.nodes.length - 1 && score > 0, score, total: d.nodes.length, summary: `${score}/${d.nodes.length} decisions right first time` });
      return;
    }
    setStep(step + 1);
    setChosen(null);
    setWrongs([]);
  };

  return (
    <div data-testid="sim">
      <ActivityHeader label={step < 0 ? "Clinical simulation" : `Simulation · decision ${step + 1}/${d.nodes.length}`} icon={<Stethoscope size={14} />} title={`${d.client}`} prompt={step < 0 ? d.intro : undefined} />
      {/* progress track */}
      <div className="mb-3 flex items-center gap-1.5" aria-hidden>
        {d.nodes.map((n, i) => (
          <span key={n.id} className={cx("h-1.5 flex-1 rounded-full transition-colors", i < step || finished ? "bg-good" : i === step ? "bg-brand" : "bg-line")} />
        ))}
      </div>
      {step < 0 && (
        <button onClick={() => setStep(0)} className="min-h-12 w-full rounded-2xl bg-brand font-extrabold text-brand-ink" data-testid="sim-start">
          Start shift <ArrowRight size={16} className="ml-1 inline" />
        </button>
      )}
      <AnimatePresence mode="wait">
        {node && !finished && (
          <motion.div key={node.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {node.rows && node.rows.length > 0 && <ChartCard patient={`${d.client} · ${d.drug}`} rows={node.rows} />}
            <p className="mt-3 text-[15px] font-semibold leading-snug">{node.text}</p>
            <p className="mt-2 text-[16px] font-extrabold">{node.prompt}</p>
            <div className="mt-2.5 grid gap-2">
              {node.choices.map((c, i) => {
                const isWrong = wrongs.includes(i);
                const isRight = chosen === i;
                return (
                  <motion.button
                    key={c.label}
                    onClick={() => choose(i)}
                    disabled={chosen !== null || isWrong}
                    animate={isWrong ? { x: [0, -6, 6, 0] } : undefined}
                    data-testid="sim-choice"
                    data-correct={String(c.correct)}
                    className={cx("min-h-12 rounded-2xl border-2 px-3.5 py-2.5 text-left text-[14.5px] font-semibold", isRight ? "border-good bg-good-soft" : isWrong ? "border-line bg-surface-2 text-muted" : "border-line bg-surface")}
                  >
                    {c.label}
                    {(isWrong || isRight) && <span className="mt-1 block text-[13px] font-medium text-ink/80">{c.feedback}</span>}
                  </motion.button>
                );
              })}
            </div>
            {wrongs.length > 0 && chosen === null && <p className="mt-2 text-[13px] font-semibold text-warn">Not the best move — read the feedback and choose again.</p>}
            {chosen !== null && (
              <button onClick={next} className="mt-3 min-h-12 w-full rounded-2xl bg-brand font-extrabold text-brand-ink" data-testid="sim-next">
                {step + 1 >= d.nodes.length ? "Debrief" : "Next"} <ArrowRight size={16} className="ml-1 inline" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {finished && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-good-soft p-4" data-testid="sim-debrief">
          <p className="text-[12px] font-extrabold uppercase tracking-wider text-good">Debrief</p>
          <ul className="mt-1.5 space-y-1.5 text-[14px]">
            {d.debrief.map((b) => (
              <li key={b} className="flex gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-good" />
                {b}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
      <p className="mt-3 text-[11px] text-muted">Source: {act.source}</p>
    </div>
  );
}
