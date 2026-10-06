"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "motion/react";
import { Shapes } from "lucide-react";
import type { ActivityOf, ActivityResult } from "@/lib/activities/types";
import { DndProvider, DragItem, DropZone } from "@/components/interact/dnd";
import { ActivityHeader, Toast } from "@/components/interact/common";
import { cx, haptic } from "@/components/ui";
import { playSound } from "@/lib/sound";

/** Highlights the identifying suffix inside a drug name. */
export function SuffixName({ name, suffix, show = true, className }: { name: string; suffix: string; show?: boolean; className?: string }) {
  const i = name.toLowerCase().lastIndexOf(suffix.toLowerCase());
  if (!show || i < 0) return <span className={className}>{name}</span>;
  return (
    <span className={className}>
      {name.slice(0, i)}
      <motion.span initial={{ backgroundColor: "rgba(0,0,0,0)" }} animate={{ backgroundColor: "color-mix(in srgb, var(--brand) 22%, transparent)" }} className="rounded-md px-0.5 font-black text-brand">
        {name.slice(i)}
      </motion.span>
    </span>
  );
}

export function FamilyWall({ act, onDone }: { act: ActivityOf<"family-wall">; onDone: (r: ActivityResult) => void }) {
  const { families, cards } = act.data;
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [misses, setMisses] = useState<Record<string, number>>({});
  const [shake, setShake] = useState<Record<string, number>>({});
  const [hint, setHint] = useState<{ zone: string; text: string } | null>(null);
  const [done, setDone] = useState(false);
  const reported = useRef(false);

  const onDrop = useCallback(
    (item: string, zone: string) => {
      const card = cards.find((c) => c.name === item);
      if (!card || placed[item]) return false;
      if (card.family === zone) {
        const next = { ...placed, [item]: zone };
        setPlaced(next);
        setHint(null);
        playSound("snap");
        haptic(10);
        if (Object.keys(next).length === cards.length && !reported.current) {
          reported.current = true;
          const first = cards.filter((c) => !misses[c.name]).length;
          setDone(true);
          playSound("correct");
          onDone({ correct: first / cards.length >= 0.8, score: first, total: cards.length, summary: `${first}/${cards.length} cards placed on the first try` });
        }
        return true;
      }
      setMisses((m) => ({ ...m, [item]: (m[item] ?? 0) + 1 }));
      setShake((s) => ({ ...s, [item]: (s[item] ?? 0) + 1 }));
      const fam = families.find((f) => f.id === zone);
      setHint({ zone, text: `${fam?.label}: ${fam?.hint}. Look at how "${item}" ends.` });
      playSound("wrong");
      haptic([20, 30, 20]);
      return false;
    },
    [cards, families, misses, placed, onDone],
  );

  const tray = cards.filter((c) => !placed[c.name]);
  return (
    <div data-testid="family-wall">
      <ActivityHeader label="Drug Family Wall" icon={<Shapes size={14} />} title="Drag each drug into its family" prompt="The ending gives it away. Tap a card, then a family, if dragging is awkward." />
      <DndProvider onDrop={onDrop}>
        <div className="grid grid-cols-2 gap-2.5">
          {families.map((f) => {
            const members = cards.filter((c) => placed[c.name] === f.id);
            const showSuffix = members.length > 0 || hint?.zone === f.id || done;
            return (
              <DropZone key={f.id} id={f.id} testId="family-zone" label={`${f.label} family`} className="min-h-32 rounded-2xl border-2 border-dashed p-2.5" activeClassName="scale-[1.03] border-solid ring-4 ring-brand/40">
                <div className="h-1.5 w-10 rounded-full" style={{ background: f.color }} />
                <p className="mt-1.5 text-[13px] font-extrabold leading-tight">{f.label}</p>
                <p className={cx("text-[12px] font-bold transition-opacity", showSuffix ? "opacity-100" : "opacity-0")} style={{ color: f.color }}>
                  {f.suffixes.join(" · ")}
                </p>
                <div className="mt-1.5 flex flex-col gap-1">
                  {members.map((c) => (
                    <motion.div key={c.name} layout initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-lg bg-surface px-2 py-1 text-[13px] font-bold shadow-sm" data-testid="placed-card">
                      <SuffixName name={c.name} suffix={c.suffix} />
                    </motion.div>
                  ))}
                </div>
              </DropZone>
            );
          })}
        </div>
        {hint && <Toast ok={false}>{hint.text}</Toast>}
        <div className="mt-4 flex min-h-16 flex-wrap justify-center gap-2 rounded-2xl bg-surface-2 p-3" aria-label="Cards to place">
          {tray.length === 0 && <p className="self-center text-sm font-bold text-good">All families complete ✓</p>}
          {tray.map((c) => (
            <DragItem key={c.name} id={c.name} shake={shake[c.name]} testId="drug-card" className="rounded-xl border-2 border-line bg-surface px-3.5 py-2.5 text-[15px] font-extrabold shadow-sm">
              <SuffixName name={c.name} suffix={c.suffix} show={(misses[c.name] ?? 0) >= 2} />
            </DragItem>
          ))}
        </div>
      </DndProvider>
      {done && (
        <Toast ok testId="activity-done">
          Suffix → family is pattern recognition. Each highlighted ending is the clue to look for on the exam.
        </Toast>
      )}
    </div>
  );
}
