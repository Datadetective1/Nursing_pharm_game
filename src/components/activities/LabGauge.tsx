"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Gauge } from "lucide-react";
import type { ActivityOf, ActivityResult, GaugeData } from "@/lib/activities/types";
import { ActivityHeader, MiniQuestionView, Toast } from "@/components/interact/common";
import { cx, haptic } from "@/components/ui";
import { playSound } from "@/lib/sound";

type Band = "low" | "in" | "high";
export const bandOf = (g: Pick<GaugeData, "low" | "high" | "value">): Band => (g.value < g.low ? "low" : g.value > g.high ? "high" : "in");

const COLORS: Record<Band, string> = { low: "#f59e0b", in: "#10b981", high: "#ef4444" };
const GLYPH: Record<Band, string> = { low: "↓", in: "✓", high: "↑" };

/**
 * Horizontal lab gauge with LOW / TARGET / HIGH zones and an animated needle.
 * `interactive` lets the learner tap the zone where the value falls.
 */
export function GaugeBar({ g, showNeedle, onZone, picked, compact }: { g: Pick<GaugeData, "min" | "max" | "low" | "high" | "value" | "unit" | "zoneLabels">; showNeedle: boolean; onZone?: (b: Band) => void; picked?: Band | null; compact?: boolean }) {
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - g.min) / (g.max - g.min)) * 100));
  const lo = pct(g.low);
  const hi = pct(g.high);
  const zones: { b: Band; from: number; to: number }[] = [
    { b: "low" as const, from: 0, to: lo },
    { b: "in" as const, from: g.zoneLabels.low ? lo : 0, to: hi },
    { b: "high" as const, from: hi, to: 100 },
  ].filter((z) => z.to - z.from > 0.5 && (z.b !== "low" || g.zoneLabels.low));
  return (
    <div className={cx("relative", compact ? "pt-7" : "pt-9")} data-testid="gauge-bar">
      <div className={cx("relative flex w-full overflow-hidden rounded-full", compact ? "h-7" : "h-11")}>
        {zones.map((z) => (
          <button
            key={z.b}
            type="button"
            disabled={!onZone}
            onClick={() => onZone?.(z.b)}
            data-testid={`gauge-zone-${z.b}`}
            className={cx("relative h-full transition-all", picked === z.b && "ring-4 ring-inset ring-ink/40", onZone && "cursor-pointer active:brightness-110")}
            style={{ width: `${z.to - z.from}%`, background: COLORS[z.b], opacity: picked && picked !== z.b ? 0.45 : 0.9 }}
          >
            <span className="pointer-events-none absolute inset-0 grid place-items-center px-1 text-[10.5px] font-extrabold uppercase leading-none tracking-wide text-white drop-shadow">
              {z.to - z.from >= 28 && !compact ? g.zoneLabels[z.b] : GLYPH[z.b]}
            </span>
          </button>
        ))}
      </div>
      {/* range ticks */}
      <div className="relative mt-1 h-4 text-[10.5px] font-bold text-muted">
        {g.zoneLabels.low && <span className="absolute -translate-x-1/2" style={{ left: `${lo}%` }}>{g.low}</span>}
        <span className="absolute -translate-x-1/2" style={{ left: `${hi}%` }}>{g.high}</span>
      </div>
      {/* legend (labels never truncate inside narrow zones) */}
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold text-muted" data-testid="gauge-legend">
        {zones.map((z) => (
          <span key={z.b} className="inline-flex items-center gap-1">
            <span className="size-2.5 rounded-full" style={{ background: COLORS[z.b] }} />
            {g.zoneLabels[z.b]}
          </span>
        ))}
      </div>
      {showNeedle && (
        <motion.div className="absolute top-0 flex -translate-x-1/2 flex-col items-center" initial={{ left: "0%" }} animate={{ left: `${pct(g.value)}%` }} transition={{ type: "spring", stiffness: 60, damping: 12 }} data-testid="gauge-needle">
          <span className="rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-black text-bg shadow">
            {g.value}
            {g.unit ? ` ${g.unit}` : ""}
          </span>
          <span className={cx("w-0.5 bg-ink", compact ? "h-8" : "h-12")} />
        </motion.div>
      )}
    </div>
  );
}

export function LabGauge({ act, onDone }: { act: ActivityOf<"gauge">; onDone: (r: ActivityResult) => void }) {
  const g = act.data;
  const band = bandOf(g);
  const [picked, setPicked] = useState<Band | null>(null);
  const [zoneMiss, setZoneMiss] = useState(false);
  const [stage, setStage] = useState<"zone" | "meaning" | "action" | "done">("zone");
  const [showAction, setShowAction] = useState(false);
  const firsts = useRef<boolean[]>([]);
  const bandsAvailable: Band[] = (["low", "in", "high"] as Band[]).filter((b) => g.meaning[b]);

  const meaningQ = useMemo(() => ({ prompt: "What does this value mean?", options: bandsAvailable.map((b) => g.meaning[b]), answer: [bandsAvailable.indexOf(band)], why: `${g.lab} target ${g.low}–${g.high}${g.unit ? " " + g.unit : ""}${g.context ? ` (${g.context})` : ""}.` }), [band, bandsAvailable, g]);
  const actionQ = useMemo(() => ({ prompt: "What should the nurse do?", options: bandsAvailable.map((b) => g.action[b]), answer: [bandsAvailable.indexOf(band)], why: g.action[band] }), [band, bandsAvailable, g]);

  const finish = () => {
    const score = firsts.current.filter(Boolean).length;
    const total = firsts.current.length;
    setStage("done");
    onDone({ correct: score >= total - (total > 2 ? 1 : 0) && firsts.current[0] !== false, score, total, summary: `${g.lab} ${g.value}: ${score}/${total} steps right first time` });
  };

  const tapZone = (b: Band) => {
    if (stage !== "zone") return;
    setPicked(b);
    if (b === band) {
      firsts.current.push(!zoneMiss);
      playSound("snap");
      haptic(10);
      setStage("meaning");
    } else {
      setZoneMiss(true);
      playSound("wrong");
      haptic([20, 30, 20]);
    }
  };

  return (
    <div data-testid="lab-gauge">
      <ActivityHeader
        label="Lab gauge"
        icon={<Gauge size={14} />}
        title={`${g.drug}: ${g.lab} ${g.value}${g.unit ? " " + g.unit : ""}`}
        prompt={stage === "zone" ? (g.context ? `Client: ${g.context}. Tap the zone where this value falls.` : "Tap the zone where this value falls.") : g.context ? `Target ${g.low}–${g.high} · ${g.context}` : `Target ${g.low}–${g.high}`}
      />
      <div className="card px-4 pb-4">
        <GaugeBar g={g} showNeedle={stage !== "zone" || zoneMiss} onZone={stage === "zone" ? tapZone : undefined} picked={picked} />
      </div>
      {stage === "zone" && zoneMiss && <Toast ok={false}>Look where the needle landed relative to {g.low}–{g.high}. Tap that zone.</Toast>}
      {(stage === "meaning" || stage === "action" || stage === "done") && (
        <div className="mt-4">
          <MiniQuestionView
            q={meaningQ}
            testId="gauge-meaning"
            onDone={(ok) => {
              firsts.current.push(ok);
              if (g.action[band]) {
                setShowAction(true);
                setStage("action");
              } else finish();
            }}
          />
        </div>
      )}
      {showAction && (
        <div className="mt-4">
          <MiniQuestionView
            q={actionQ}
            testId="gauge-action"
            onDone={(ok) => {
              firsts.current.push(ok);
              finish();
            }}
          />
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted">Source: {act.source}</p>
    </div>
  );
}
