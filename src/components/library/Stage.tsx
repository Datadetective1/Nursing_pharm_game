"use client";

import { Check, Lock } from "lucide-react";
import { useStore } from "@/lib/store";
import { resolveSelection, selKey, type Selection } from "@/data/library";
import { stageStatus, TEST_LABEL, type StageStatus } from "@/lib/engine/learning";
import { cx } from "@/components/ui";

/** Learn / Practice / Test status for any library selection. */
export function useStage(sel: Selection, now: number): StageStatus {
  const learn = useStore((s) => s.learn);
  const stats = useStore((s) => s.concepts);
  const units = useStore((s) => s.units);
  const r = resolveSelection(sel);
  return stageStatus(r.concepts, learn, stats, units[selKey(sel)], now);
}

/** Compact one-line status: Learn ✓ · Practice 72% · Test Ready */
export function StageChips({ st, className }: { st: StageStatus; className?: string }) {
  return (
    <span className={cx("flex flex-wrap items-center gap-1 text-[10.5px] font-extrabold uppercase tracking-wide", className)} data-testid="stage-chips">
      <span className={cx("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5", st.learnDone ? "bg-good-soft text-good" : st.learn > 0 ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300" : "bg-surface-2 text-muted")}>
        Learn {st.learnDone ? <Check size={11} strokeWidth={3} /> : st.learn > 0 ? `${st.learn}%` : ""}
      </span>
      <span className={cx("rounded-full px-2 py-0.5", st.practice >= 60 ? "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300" : st.practice > 0 ? "bg-brand-soft text-brand" : "bg-surface-2 text-muted")}>Practice {st.practice}%</span>
      <span className={cx("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5", st.test === "mastered" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300" : st.test === "passed" ? "bg-good-soft text-good" : st.test === "ready" ? "bg-brand text-brand-ink" : "bg-surface-2 text-muted")}>
        {st.test === "locked" && <Lock size={10} />} Test {TEST_LABEL[st.test]}
      </span>
    </span>
  );
}
