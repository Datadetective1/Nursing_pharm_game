"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Droplet } from "lucide-react";
import type { ActivityOf, ActivityResult, ClotClass } from "@/lib/activities/types";
import { DndProvider, DragItem, DropZone } from "@/components/interact/dnd";
import { ActivityHeader, Toast } from "@/components/interact/common";
import { cx, haptic } from "@/components/ui";
import { playSound } from "@/lib/sound";

type Scene = "existing-clot" | "venous-prevent" | "platelet-clump";
type Outcome = null | { cls: ClotClass; ok: boolean };

const CLASS_STYLE: Record<ClotClass, { label: string; color: string; does: string }> = {
  anticoagulant: { label: "Anticoagulant", color: "#6366f1", does: "prevents NEW clot formation — does NOT dissolve existing clots" },
  antiplatelet: { label: "Antiplatelet", color: "#0ea5e9", does: "stops platelets clumping (arteries)" },
  thrombolytic: { label: "Thrombolytic", color: "#e11d48", does: "DISSOLVES clots (plasminogen → plasmin)" },
};

const WRONG: Record<Scene, Partial<Record<ClotClass, string>>> = {
  "existing-clot": {
    anticoagulant: "The clot is still there. Anticoagulants do NOT dissolve existing clots — they only stop new clot forming.",
    antiplatelet: "The clot is still there. Antiplatelets stop platelets clumping; they don't dissolve a formed clot.",
  },
  "venous-prevent": {
    thrombolytic: "Thrombolytics dissolve existing clots (acute MI, massive PE, ischemic stroke) — not the drug for preventing new clot in a vein.",
    antiplatelet: "Antiplatelets act in high-velocity ARTERIES. Low-velocity veins (DVT, PE, a-fib) → anticoagulant.",
  },
  "platelet-clump": {
    anticoagulant: "Anticoagulants target low-velocity veins + left atrium. Platelets clumping in an artery → antiplatelet.",
    thrombolytic: "Nothing to dissolve yet — the problem is platelets clumping. That's an antiplatelet's job.",
  },
};

/** Animated vessel scene (original SVG). */
function Vessel({ scene, outcome }: { scene: Scene; outcome: Outcome }) {
  const solved = outcome?.ok;
  const dissolve = scene === "existing-clot" && solved;
  const halted = (scene === "venous-prevent" && solved) || (scene === "platelet-clump" && solved);
  const flowFast = dissolve;
  return (
    <svg viewBox="0 0 340 170" className="h-auto w-full" role="img" aria-label="Blood vessel scene">
      <defs>
        <linearGradient id="vwall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fda4af" />
          <stop offset="1" stopColor="#fb7185" />
        </linearGradient>
      </defs>
      <rect x="0" y="18" width="340" height="16" rx="8" fill="url(#vwall)" />
      <rect x="0" y="136" width="340" height="16" rx="8" fill="url(#vwall)" />
      <rect x="0" y="34" width="340" height="102" fill="#fff1f2" className="dark:opacity-10" />
      {/* flowing red cells */}
      {Array.from({ length: 9 }).map((_, i) => (
        <motion.ellipse
          key={i}
          cy={50 + ((i * 37) % 76)}
          rx="9"
          ry="5.5"
          fill="#dc2626"
          opacity="0.85"
          initial={{ cx: -20 }}
          animate={{ cx: scene === "existing-clot" && !dissolve ? [-20, 150] : [-20, 360] }}
          transition={{ duration: flowFast ? 2.2 : 4.2, repeat: Infinity, delay: i * 0.45, ease: "linear" }}
        />
      ))}
      {scene === "existing-clot" && (
        <motion.g animate={{ opacity: dissolve ? 0 : 1, scale: dissolve ? 0.6 : 1 }} transition={{ duration: 1.6 }} style={{ transformOrigin: "200px 85px" }}>
          <rect x="165" y="34" width="70" height="102" rx="14" fill="#7f1d1d" opacity="0.85" />
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={i} x1={168 + i * 9} y1="38" x2={230 - i * 7} y2="132" stroke="#fde68a" strokeWidth="1.6" opacity="0.8" />
          ))}
          <text x="200" y="90" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">CLOT</text>
        </motion.g>
      )}
      {scene === "venous-prevent" && (
        <g>
          <rect x="150" y="104" width="48" height="32" rx="10" fill="#991b1b" opacity="0.7" />
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.line
              key={i}
              x1={150 + i * 8}
              y1={104}
              x2={162 + i * 7}
              y2={halted ? 98 : 64}
              stroke="#fbbf24"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: halted ? 0.15 : [0, 1] }}
              transition={{ duration: 1.8, repeat: halted ? 0 : Infinity, delay: i * 0.2 }}
            />
          ))}
          <text x="174" y="152" textAnchor="middle" fontSize="10" fontWeight="800" fill="#7f1d1d" opacity="0.8">
            {halted ? "no new fibrin" : "fibrin forming"}
          </text>
        </g>
      )}
      {scene === "platelet-clump" && (
        <g>
          <rect x="150" y="34" width="50" height="6" fill="#be123c" />
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.circle
              key={i}
              r="6"
              fill="#a855f7"
              initial={{ cx: 20 + i * 14, cy: 70 + (i % 3) * 18 }}
              animate={halted ? { cx: [20 + i * 14, 360], cy: 70 + (i % 3) * 18 } : { cx: 160 + (i % 5) * 8, cy: 44 + Math.floor(i / 5) * 10 }}
              transition={halted ? { duration: 3, repeat: Infinity, delay: i * 0.25, ease: "linear" } : { duration: 1.4, delay: i * 0.12 }}
            />
          ))}
          <text x="175" y="160" textAnchor="middle" fontSize="10" fontWeight="800" fill="#7e22ce">
            {halted ? "platelets no longer clump" : "platelets clumping at injury"}
          </text>
        </g>
      )}
    </svg>
  );
}

export function ClottingLab({ act, onDone }: { act: ActivityOf<"clot-lab">; onDone: (r: ActivityResult) => void }) {
  const scenarios = act.data.scenarios;
  const [i, setI] = useState(0);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [missed, setMissed] = useState<boolean[]>([]);
  const [missThis, setMissThis] = useState(false);
  const [shake, setShake] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const s = scenarios[i];

  const onDrop = useCallback(
    (item: string, zone: string) => {
      if (zone !== "scene" || outcome?.ok) return false;
      const card = s.cards.find((c) => c.name === item);
      if (!card) return false;
      const ok = card.cls === s.answer;
      setOutcome({ cls: card.cls, ok });
      if (ok) {
        playSound("correct");
        haptic(15);
        return true;
      }
      setMissThis(true);
      setShake((x) => ({ ...x, [item]: (x[item] ?? 0) + 1 }));
      playSound("wrong");
      haptic([20, 30, 20]);
      return false;
    },
    [outcome, s],
  );

  const next = () => {
    const m = [...missed, missThis];
    setMissed(m);
    if (i === scenarios.length - 1) {
      const score = m.filter((x) => !x).length;
      setDone(true);
      onDone({ correct: score >= scenarios.length - 1, score, total: scenarios.length, summary: `${score}/${scenarios.length} clot scenarios right first time` });
      return;
    }
    setI(i + 1);
    setOutcome(null);
    setMissThis(false);
  };

  return (
    <div data-testid="clot-lab">
      <ActivityHeader label={`Clotting Lab · ${i + 1}/${scenarios.length}`} icon={<Droplet size={14} />} title={s.prompt} prompt="Drag the right drug onto the vessel." />
      <DndProvider onDrop={onDrop}>
        <DropZone id="scene" testId="clot-scene" label="Vessel" className="overflow-hidden rounded-3xl border-2 border-line bg-surface p-1" activeClassName="ring-4 ring-brand/50">
          <Vessel scene={s.scene} outcome={outcome} />
        </DropZone>
        <AnimatePresence mode="wait">
          {outcome && (
            <Toast ok={outcome.ok} testId="clot-outcome">
              <b style={{ color: CLASS_STYLE[outcome.cls].color }}>{CLASS_STYLE[outcome.cls].label}</b> {CLASS_STYLE[outcome.cls].does}.{" "}
              {outcome.ok ? s.why : WRONG[s.scene][outcome.cls] ?? "Try another card."}
            </Toast>
          )}
        </AnimatePresence>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {s.cards.map((c) => (
            <DragItem key={`${i}-${c.name}`} id={c.name} shake={shake[c.name]} disabled={!!outcome?.ok} testId="clot-card" className={cx("rounded-2xl border-2 bg-surface px-2 py-3 text-center shadow-sm")}>
              <span className="block text-[14px] font-extrabold">{c.name}</span>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wide text-muted">{outcome?.ok || missThis ? CLASS_STYLE[c.cls].label : "?"}</span>
            </DragItem>
          ))}
        </div>
      </DndProvider>
      {outcome?.ok && !done && (
        <button onClick={next} className="mt-4 min-h-12 w-full rounded-2xl bg-brand font-extrabold text-brand-ink" data-testid="clot-next">
          {i === scenarios.length - 1 ? "Finish" : "Next scenario →"}
        </button>
      )}
      <div className="mt-4 grid grid-cols-3 gap-1.5 text-center text-[10.5px] font-bold leading-tight">
        {(Object.keys(CLASS_STYLE) as ClotClass[]).map((k) => (
          <div key={k} className="rounded-xl bg-surface-2 p-2">
            <span className="block font-extrabold" style={{ color: CLASS_STYLE[k].color }}>
              {CLASS_STYLE[k].label}
            </span>
            {k === "anticoagulant" ? "prevents · veins + LA" : k === "antiplatelet" ? "no clumping · arteries" : "dissolves"}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted">Source: {act.source}</p>
    </div>
  );
}
