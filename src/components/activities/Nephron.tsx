"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "motion/react";
import { Droplets } from "lucide-react";
import type { ActivityOf, ActivityResult, NephronZone } from "@/lib/activities/types";
import { DndProvider, DragItem, DropZone } from "@/components/interact/dnd";
import { ActivityHeader, MiniQuestionView, Toast } from "@/components/interact/common";
import { cx, haptic } from "@/components/ui";
import { playSound } from "@/lib/sound";

type DrugId = "furosemide" | "hctz" | "spironolactone" | "mannitol";

/** Course effects per drug (Memory Aid · Diuretics). */
const EFFECT: Record<DrugId, { site: string; lost: string[]; kept?: string[]; extra: string; kTone: "lost" | "kept" | "none" }> = {
  furosemide: { site: "Loop of Henle", lost: ["Na⁺", "Cl⁻", "H₂O", "K⁺", "Mg²⁺", "Ca²⁺"], extra: "K⁺-WASTING · ototoxicity · first choice in HF", kTone: "lost" },
  hctz: { site: "Distal tubule", lost: ["Na⁺", "Cl⁻", "H₂O", "K⁺"], extra: "K⁺-WASTING · first-line essential HTN · no hearing loss", kTone: "lost" },
  spironolactone: { site: "Blocks aldosterone", lost: ["Na⁺", "H₂O"], kept: ["K⁺"], extra: "K⁺-SPARING · limit K⁺ foods · no salt substitutes", kTone: "kept" },
  mannitol: { site: "Bloodstream (↑ osmolality)", lost: [], kept: ["H₂O → vessels"], extra: "Pulls fluid back into vascular space → ↓ICP, ↓IOP", kTone: "none" },
};

const ZONE_NAME: Record<NephronZone, string> = { loop: "Loop of Henle", distal: "Distal tubule", aldosterone: "Aldosterone (hormone)", blood: "Bloodstream" };

function Particles({ items, tone, dir }: { items: string[]; tone: "lost" | "kept"; dir: "down" | "up" }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1">
      {items.map((p, i) => (
        <motion.span
          key={p}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: dir === "down" ? [0, 26, 46] : [0, -22, -38], opacity: [0, 1, 0.9] }}
          transition={{ duration: 1.4, delay: i * 0.12, repeat: 2, repeatDelay: 0.4 }}
          className={cx("rounded-md px-1 text-[10px] font-black", p.startsWith("K") ? (tone === "kept" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white") : "bg-sky-500/90 text-white")}
        >
          {p}
        </motion.span>
      ))}
    </div>
  );
}

export function Nephron({ act, onDone }: { act: ActivityOf<"nephron">; onDone: (r: ActivityResult) => void }) {
  const drugs = act.data.drugs;
  const [placed, setPlaced] = useState<Record<string, NephronZone>>({});
  const [misses, setMisses] = useState<Record<string, number>>({});
  const [shake, setShake] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [last, setLast] = useState<DrugId | null>(null);
  const [follow, setFollow] = useState(false);
  const reported = useRef(false);

  const onDrop = useCallback(
    (item: string, zone: string) => {
      const d = drugs.find((x) => x.id === item);
      if (!d || placed[item]) return false;
      if (d.zone === zone) {
        const next = { ...placed, [item]: d.zone };
        setPlaced(next);
        setLast(d.id);
        setMsg({ ok: true, text: `${d.name}: ${EFFECT[d.id].extra}` });
        playSound("snap");
        haptic(10);
        if (Object.keys(next).length === drugs.length) setFollow(true);
        return true;
      }
      setMisses((m) => ({ ...m, [item]: (m[item] ?? 0) + 1 }));
      setShake((s) => ({ ...s, [item]: (s[item] ?? 0) + 1 }));
      setMsg({ ok: false, text: `Not the ${ZONE_NAME[zone as NephronZone]} — ${d.name} works elsewhere. Try again.` });
      playSound("wrong");
      return false;
    },
    [drugs, placed],
  );

  const followDone = (ok: boolean) => {
    if (reported.current) return;
    reported.current = true;
    const first = drugs.filter((d) => !misses[d.id]).length + (ok ? 1 : 0);
    const total = drugs.length + 1;
    onDone({ correct: first / total >= 0.8, score: first, total, summary: `${first}/${total} diuretic placements right first time` });
  };

  const zoneHas = (z: NephronZone) => drugs.find((d) => placed[d.id] === z);
  const tray = drugs.filter((d) => !placed[d.id]);

  return (
    <div data-testid="nephron">
      <ActivityHeader label="Nephron map" icon={<Droplets size={14} />} title="Where does each diuretic work?" prompt="Drag (or tap, then tap) each drug onto its site. Watch what happens to K⁺." />
      <DndProvider onDrop={onDrop}>
        <div className="relative w-full overflow-hidden rounded-3xl border border-line bg-surface" style={{ aspectRatio: "34 / 30" }}>
          {/* illustration */}
          <svg viewBox="0 0 340 300" className="absolute inset-0 h-full w-full" aria-hidden>
            <rect x="0" y="8" width="340" height="40" rx="18" fill="#fecdd3" className="dark:opacity-40" />
            <circle cx="58" cy="96" r="24" fill="#fda4af" opacity="0.55" />
            <path d="M58 96 m-14 0 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0" fill="none" stroke="#e11d48" strokeWidth="3" />
            <path d="M82 96 C 100 70, 110 120, 128 100 L128 255 C128 285, 168 285, 168 255 L168 110 C 185 80, 205 120, 225 96 C 240 80, 255 110, 272 96 L272 290" fill="none" stroke="#38bdf8" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
            <text x="282" y="286" fontSize="11" fontWeight="800" fill="currentColor" opacity="0.5">urine</text>
          </svg>

          <DropZone id="blood" testId="zone-blood" label="Bloodstream" className="absolute left-[2%] right-[2%] top-[3%] h-[13%] rounded-2xl" activeClassName="ring-4 ring-rose-400/70 bg-rose-400/10">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-extrabold text-rose-700 dark:text-rose-300">Bloodstream (osmolality)</span>
            {zoneHas("blood") && <Particles items={["H₂O", "H₂O", "H₂O"]} tone="kept" dir="up" />}
          </DropZone>
          <DropZone id="loop" testId="zone-loop" label="Loop of Henle" className="absolute left-[30%] top-[36%] h-[56%] w-[24%] rounded-2xl border-2 border-dashed border-sky-400/50" activeClassName="ring-4 ring-sky-400/70 bg-sky-400/10">
            <span className="absolute -left-1 bottom-1 -rotate-90 origin-bottom-left translate-x-3 whitespace-nowrap text-[10px] font-extrabold text-sky-700 dark:text-sky-300">Loop of Henle</span>
            {zoneHas("loop") && <Particles items={EFFECT.furosemide.lost.slice(0, 4)} tone="lost" dir="down" />}
          </DropZone>
          <DropZone id="distal" testId="zone-distal" label="Distal tubule" className="absolute left-[54%] top-[22%] h-[16%] w-[30%] rounded-2xl border-2 border-dashed border-sky-400/50" activeClassName="ring-4 ring-sky-400/70 bg-sky-400/10">
            <span className="absolute -bottom-4 left-1 whitespace-nowrap text-[10px] font-extrabold text-sky-700 dark:text-sky-300">Distal tubule</span>
            {zoneHas("distal") && <Particles items={EFFECT.hctz.lost} tone="lost" dir="down" />}
          </DropZone>
          <DropZone id="aldosterone" testId="zone-aldosterone" label="Aldosterone" className="absolute left-[60%] top-[52%] h-[20%] w-[36%] rounded-2xl border-2 border-dashed border-amber-400/70 bg-amber-50/70 dark:bg-amber-500/10" activeClassName="ring-4 ring-amber-400/70">
            <span className="absolute left-2 top-1.5 text-[10.5px] font-extrabold text-amber-800 dark:text-amber-300">Aldosterone (hormone)</span>
            {zoneHas("aldosterone") && <Particles items={["Na⁺", "H₂O", "K⁺"]} tone="kept" dir="down" />}
          </DropZone>

          {/* placed drug labels */}
          {drugs
            .filter((d) => placed[d.id])
            .map((d) => {
              const pos: Record<NephronZone, string> = { blood: "left-[58%] top-[5%]", loop: "left-[24%] top-[30%]", distal: "left-[56%] top-[13%]", aldosterone: "left-[62%] top-[73%]" };
              return (
                <motion.span key={d.id} layout initial={{ scale: 0.4 }} animate={{ scale: 1 }} className={cx("absolute rounded-lg bg-ink px-2 py-0.5 text-[11px] font-extrabold text-bg shadow", pos[d.zone])}>
                  {d.name} ✓
                </motion.span>
              );
            })}
        </div>

        {msg && <Toast ok={msg.ok}>{msg.text}</Toast>}
        {last && (
          <div className="mt-3 rounded-2xl bg-surface-2 p-3" data-testid="nephron-effect">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted">{EFFECT[last].site}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px] font-bold">
              {EFFECT[last].lost.map((p) => (
                <span key={p} className={cx("rounded-md px-1.5 py-0.5", p.startsWith("K") ? "bg-rose-500 text-white" : "bg-sky-500/15 text-sky-800 dark:text-sky-200")}>
                  {p} out
                </span>
              ))}
              {EFFECT[last].kept?.map((p) => (
                <span key={p} className={cx("rounded-md px-1.5 py-0.5", p.startsWith("K") ? "bg-emerald-500 text-white" : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200")}>
                  {p.startsWith("K") ? "K⁺ kept 🛡" : p}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 flex min-h-14 flex-wrap justify-center gap-2 rounded-2xl bg-surface-2 p-3">
          {tray.length === 0 && <p className="self-center text-sm font-bold text-good">All four placed ✓</p>}
          {tray.map((d) => (
            <DragItem key={d.id} id={d.id} shake={shake[d.id]} testId="diuretic-card" className="rounded-xl border-2 border-line bg-surface px-3.5 py-2.5 text-[15px] font-extrabold shadow-sm">
              💧 {d.name}
            </DragItem>
          ))}
        </div>
      </DndProvider>

      {follow && (
        <div className="mt-4">
          <div className="mb-3 grid grid-cols-2 gap-2 text-center text-[12px] font-extrabold">
            <div className="rounded-xl bg-rose-500/10 p-2 text-rose-700 dark:text-rose-300">K⁺ WASTING<br />furosemide · HCTZ<br /><span className="font-semibold">→ eat MORE K⁺</span></div>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-300">K⁺ SPARING<br />spironolactone<br /><span className="font-semibold">→ LIMIT K⁺</span></div>
          </div>
          <MiniQuestionView q={act.data.followUp} onDone={followDone} />
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted">Source: {act.source}</p>
    </div>
  );
}
