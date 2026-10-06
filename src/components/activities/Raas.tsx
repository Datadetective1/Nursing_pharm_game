"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Workflow, Ban } from "lucide-react";
import type { ActivityOf, ActivityResult, RaasTarget } from "@/lib/activities/types";
import { ActivityHeader, MiniQuestionView, Toast } from "@/components/interact/common";
import { cx, haptic } from "@/components/ui";
import { playSound } from "@/lib/sound";

const TARGET_LABEL: Record<RaasTarget, string> = { ace: "ACE (Ang I → Ang II)", receptor: "Ang II receptor", aldosterone: "Aldosterone" };

/** What the course says happens when each point is blocked. */
export const EFFECT: Record<RaasTarget, { lines: string[]; cough?: string }> = {
  ace: { lines: ["Vasodilation", "↓ Na⁺ / H₂O retention", "K⁺ RETAINED → hyperkalemia"], cough: "↑ Bradykinin → dry hacking cough" },
  receptor: { lines: ["Vasodilation", "↓ Na⁺ / H₂O retention", "K⁺ retained → hyperkalemia"], cough: "Bradykinin untouched → much less cough" },
  aldosterone: { lines: ["Na⁺ + H₂O excreted", "K⁺ RETAINED", "Limit K⁺ foods · no salt substitutes"] },
};

function Node({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "hormone" }) {
  return <div className={cx("rounded-xl border-2 px-3 py-2 text-center text-[14px] font-extrabold", tone === "hormone" ? "border-amber-400/60 bg-amber-50 dark:bg-amber-500/10" : "border-line bg-surface")}>{children}</div>;
}

function Target({ id, blocked, onTap, pulse }: { id: RaasTarget; blocked: boolean; onTap: () => void; pulse: boolean }) {
  return (
    <button
      onClick={onTap}
      data-testid={`raas-${id}`}
      className={cx(
        "relative mx-auto flex min-h-12 items-center gap-2 rounded-full border-2 px-4 text-[13px] font-extrabold transition-all",
        blocked ? "border-bad bg-bad text-white" : "border-dashed border-brand/50 bg-brand-soft text-brand",
        pulse && !blocked && "animate-pulse-ring",
      )}
    >
      {blocked ? <Ban size={16} /> : <span className="size-2.5 rounded-full bg-brand" />}
      {TARGET_LABEL[id]}
    </button>
  );
}

/** Vessel that widens when the pathway is blocked (vasodilation). */
function Vessel({ dilated }: { dilated: boolean }) {
  return (
    <div className="relative mx-auto h-16 w-full overflow-hidden rounded-2xl bg-surface-2">
      <motion.div className="absolute inset-x-0 rounded-full bg-rose-200 dark:bg-rose-900/40" animate={{ top: dilated ? "12%" : "34%", bottom: dilated ? "12%" : "34%" }} transition={{ duration: 0.9, ease: "easeOut" }} />
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span key={i} className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-rose-500" initial={{ left: "-5%" }} animate={{ left: "105%" }} transition={{ duration: dilated ? 1.6 : 2.6, repeat: Infinity, delay: i * 0.5, ease: "linear" }} />
      ))}
      <span className="absolute right-2 top-1 text-[10px] font-extrabold uppercase tracking-wider text-muted">{dilated ? "vasodilation" : "vessel"}</span>
    </div>
  );
}

export function Raas({ act, onDone }: { act: ActivityOf<"raas">; onDone: (r: ActivityResult) => void }) {
  const ch = act.data.challenges;
  const [i, setI] = useState(0);
  const [blocked, setBlocked] = useState<RaasTarget | null>(null);
  const [miss, setMiss] = useState<string | null>(null);
  const [firstTry, setFirstTry] = useState<boolean[]>([]);
  const [tapMissed, setTapMissed] = useState(false);
  const [stage, setStage] = useState<"tap" | "follow" | "next">("tap");
  const c = ch[i];

  const tap = (t: RaasTarget) => {
    if (stage !== "tap") return;
    if (t === c.target) {
      setBlocked(t);
      setMiss(null);
      setStage("follow");
      playSound("snap");
      haptic(12);
    } else {
      setTapMissed(true);
      setMiss(`${TARGET_LABEL[t]} is ${t === "aldosterone" ? "the spironolactone site" : t === "receptor" ? "where ARBs (-sartan) act" : "where ACE inhibitors (-pril) act"}. Try again for ${c.drug.toLowerCase()}.`);
      playSound("wrong");
      haptic([20, 30, 20]);
    }
  };

  const followDone = (ok: boolean) => {
    const next = [...firstTry, ok && !tapMissed];
    setFirstTry(next);
    setStage("next");
    if (i === ch.length - 1) {
      const score = next.filter(Boolean).length;
      onDone({ correct: score >= ch.length - 1, score, total: ch.length, summary: `${score}/${ch.length} RAAS targets right first time` });
    }
  };

  const advance = () => {
    setI(i + 1);
    setBlocked(null);
    setTapMissed(false);
    setStage("tap");
  };

  const eff = blocked ? EFFECT[blocked] : null;
  return (
    <div data-testid="raas">
      <ActivityHeader label={`Mechanism · ${i + 1}/${ch.length}`} icon={<Workflow size={14} />} title={c.prompt} prompt="Tap the point in the pathway." />
      <div className="card p-4">
        <div className="flex flex-col items-stretch gap-2">
          <Node>Angiotensin I</Node>
          <div className="mx-auto h-3 w-0.5 bg-line" />
          <Target id="ace" blocked={blocked === "ace"} onTap={() => tap("ace")} pulse={stage === "tap"} />
          <div className="mx-auto h-3 w-0.5 bg-line" />
          <Node>Angiotensin II</Node>
          <div className="mx-auto h-3 w-0.5 bg-line" />
          <Target id="receptor" blocked={blocked === "receptor"} onTap={() => tap("receptor")} pulse={stage === "tap"} />
          <div className="mx-auto h-3 w-0.5 bg-line" />
          <Vessel dilated={blocked === "ace" || blocked === "receptor"} />
          <div className="my-1 border-t border-dashed border-line" />
          <Node tone="hormone">Aldosterone (hormone)</Node>
          <Target id="aldosterone" blocked={blocked === "aldosterone"} onTap={() => tap("aldosterone")} pulse={stage === "tap"} />
        </div>
        <AnimatePresence>
          {eff && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 overflow-hidden">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted">{c.drug} blocks it →</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {eff.lines.map((l, k) => (
                  <motion.span key={l} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15 * k }} className={cx("rounded-full px-2.5 py-1 text-[12.5px] font-bold", l.includes("K⁺") ? "bg-amber-100 text-amber-900 ring-2 ring-amber-400 dark:bg-amber-500/20 dark:text-amber-200" : "bg-surface-2")}>
                    {l}
                  </motion.span>
                ))}
                {eff.cough && blocked !== "aldosterone" && (
                  <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5 }} className="rounded-full bg-sky-100 px-2.5 py-1 text-[12.5px] font-bold text-sky-900 dark:bg-sky-500/20 dark:text-sky-200">
                    {eff.cough}
                  </motion.span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {miss && <Toast ok={false}>{miss}</Toast>}
      {stage !== "tap" && (
        <div className="mt-4">
          <MiniQuestionView key={i} q={c.followUp} onDone={followDone} />
        </div>
      )}
      {stage === "next" && i < ch.length - 1 && (
        <button onClick={advance} className="mt-4 min-h-12 w-full rounded-2xl bg-brand font-extrabold text-brand-ink" data-testid="raas-next">
          Next drug →
        </button>
      )}
      <p className="mt-3 text-[11px] text-muted">Source: {act.source}</p>
    </div>
  );
}
