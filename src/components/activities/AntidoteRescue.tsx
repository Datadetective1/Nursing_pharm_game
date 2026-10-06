"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "motion/react";
import { BriefcaseMedical, HeartPulse, Siren } from "lucide-react";
import type { ActivityOf, ActivityResult } from "@/lib/activities/types";
import { ANTIDOTES } from "@/data/antidotes";
import { DndProvider, DragItem, DropZone } from "@/components/interact/dnd";
import { ActivityHeader, Toast } from "@/components/interact/common";
import { cx, haptic } from "@/components/ui";
import { playSound } from "@/lib/sound";
import { shuffle } from "@/lib/rng";
import { celebrate } from "@/components/celebrate";

/** Simple original illustration of a client in bed. */
function ClientInBed({ stable }: { stable: boolean }) {
  return (
    <svg viewBox="0 0 200 110" className="h-auto w-full" aria-hidden>
      <rect x="10" y="62" width="180" height="16" rx="6" fill="currentColor" opacity="0.15" />
      <rect x="18" y="78" width="8" height="24" rx="3" fill="currentColor" opacity="0.2" />
      <rect x="174" y="78" width="8" height="24" rx="3" fill="currentColor" opacity="0.2" />
      <rect x="18" y="50" width="34" height="14" rx="7" fill="#e2e8f0" />
      <motion.circle cx="40" cy="44" r="13" fill={stable ? "#fbcfe8" : "#cbd5e1"} animate={{ fill: stable ? "#fbcfe8" : "#cbd5e1" }} />
      <motion.rect x="52" y="44" width="122" height="22" rx="11" fill={stable ? "#a5b4fc" : "#94a3b8"} animate={{ fill: stable ? "#a5b4fc" : "#94a3b8" }} />
      {!stable && (
        <motion.text x="40" y="22" textAnchor="middle" fontSize="12" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.2, repeat: Infinity }}>
          ⚠
        </motion.text>
      )}
    </svg>
  );
}

export function AntidoteRescue({ act, onDone }: { act: ActivityOf<"rescue">; onDone: (r: ActivityResult) => void }) {
  const d = act.data;
  const kits = useMemo(() => shuffle(d.kits), [d.kits]);
  const [stable, setStable] = useState(false);
  const [missed, setMissed] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [shake, setShake] = useState<Record<string, number>>({});

  const onDrop = useCallback(
    (kit: string, zone: string) => {
      if (zone !== "client" || stable) return false;
      if (kit === d.antidote) {
        setStable(true);
        setMsg(null);
        playSound("correct");
        haptic([15, 40, 15]);
        celebrate("small");
        onDone({ correct: missed === 0, score: missed === 0 ? 1 : 0, total: 1, summary: missed === 0 ? `Rescued with ${kit}` : `Rescued after ${missed} wrong kit${missed > 1 ? "s" : ""}` });
        return true;
      }
      const reverses = ANTIDOTES.filter((a) => a.antidote === kit).map((a) => a.drug.split(" (")[0]);
      setMissed((m) => m + 1);
      setShake((s) => ({ ...s, [kit]: (s[kit] ?? 0) + 1 }));
      setMsg(`${kit} reverses ${reverses.join(" / ")} — not ${d.drug}. Look at the drug again.`);
      playSound("wrong");
      haptic([20, 30, 20]);
      return false;
    },
    [d.antidote, d.drug, missed, onDone, stable],
  );

  return (
    <div data-testid="rescue">
      <ActivityHeader label="Antidote Rescue" icon={<Siren size={14} />} title={`${d.drug}: the client is deteriorating`} prompt={d.story} />
      <DndProvider onDrop={onDrop}>
        <DropZone id="client" testId="rescue-client" label="Client" className={cx("rounded-3xl border-2 p-3 transition-colors", stable ? "border-good bg-good-soft" : "border-bad/40 bg-surface")} activeClassName="ring-4 ring-good/60 scale-[1.01]">
          <div className="grid grid-cols-[1fr_1.1fr] items-center gap-3">
            <div className="text-muted">
              <ClientInBed stable={stable} />
            </div>
            <div className="rounded-2xl bg-slate-900 p-2.5 font-mono text-[12px] text-emerald-300 shadow-inner" data-testid="rescue-monitor">
              <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400">
                <span>monitor</span>
                <HeartPulse size={13} className={stable ? "text-emerald-400" : "animate-pulse text-rose-400"} />
              </div>
              {d.vitals.map((v) => (
                <div key={v.label} className="flex justify-between gap-2">
                  <span className="text-slate-400">{v.label}</span>
                  <motion.span animate={v.bad && !stable ? { opacity: [1, 0.35, 1] } : { opacity: 1 }} transition={{ duration: 1, repeat: v.bad && !stable ? Infinity : 0 }} className={cx("font-bold", v.bad && !stable ? "text-rose-400" : "text-emerald-300")}>
                    {v.value}
                  </motion.span>
                </div>
              ))}
              {stable && <p className="mt-1 text-[11px] font-bold text-emerald-300">✓ rescue given — keep monitoring</p>}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {d.signs.map((s) => (
              <span key={s} className="rounded-full bg-bad-soft px-2 py-0.5 text-[11.5px] font-bold text-bad">
                {s}
              </span>
            ))}
          </div>
          {!stable && <p className="mt-2 text-center text-[11px] font-extrabold uppercase tracking-wider text-muted">drop the rescue kit here</p>}
        </DropZone>
        {msg && <Toast ok={false}>{msg}</Toast>}
        {stable && (
          <Toast ok testId="rescue-done">
            <b>{d.antidote}</b> for {d.drug}. {d.note}
          </Toast>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {kits.map((k) => (
            <DragItem key={k} id={k} shake={shake[k]} disabled={stable} testId="rescue-kit" className={cx("flex min-h-16 items-center gap-2 rounded-2xl border-2 bg-surface px-3 py-2 shadow-sm", stable && k === d.antidote ? "border-good" : "border-line")}>
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-rose-500 text-white">
                <BriefcaseMedical size={17} />
              </span>
              <span className="text-[13.5px] font-extrabold leading-tight">{k}</span>
            </DragItem>
          ))}
        </div>
      </DndProvider>
      <p className="mt-3 text-[11px] text-muted">Source: {act.source}</p>
    </div>
  );
}
