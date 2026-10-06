"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SessionPlayer } from "@/components/SessionPlayer";
import { buildSession, type Minutes, type Mode } from "@/lib/engine/session";
import { parseSelection } from "@/data/library";
import { useStore } from "@/lib/store";
import type { WorldId } from "@/lib/types";
import { nowMs } from "@/lib/time";

const MODES: Mode[] = ["mission", "continue", "quick5", "weak", "node", "world", "boss", "vault", "similar", "misses", "highyield", "focus", "practice", "test", "pretest"];

function PlayInner() {
  const sp = useSearchParams();
  const [plan, setPlan] = useState(() => ({ round: 0, now: Date.now() }));
  const round = plan.round;
  const modeParam = sp.get("mode") as Mode | null;
  const mode: Mode = modeParam && MODES.includes(modeParam) ? modeParam : "quick5";
  const node = sp.get("node") ?? undefined;
  const world = (sp.get("world") as WorldId | null) ?? undefined;
  const concept = sp.get("concept") ?? undefined;
  const qid = sp.get("qid") ?? undefined;
  const conceptsParam = sp.get("concepts") ?? "";
  const selParam = sp.get("sel");
  const minParam = sp.get("min");

  const cfg = useMemo(() => {
    const s = useStore.getState();
    return buildSession({
      mode,
      node,
      world,
      concept,
      qid: round === 0 ? qid : undefined,
      stats: s.concepts,
      mistakes: s.mistakes,
      exams: s.exams,
      dailyMinutes: s.profile.dailyMinutes,
      startConfidence: s.profile.startConfidence,
      concepts: conceptsParam ? conceptsParam.split(",") : undefined,
      learn: s.learn,
      sel: parseSelection(selParam) ?? undefined,
      minutes: (minParam === "master" ? "master" : minParam ? Number(minParam) : undefined) as Minutes | undefined,
      now: plan.now,
    });
    // a new plan (round) forces a fresh session for "Another round"
  }, [mode, node, world, concept, qid, round, plan.now, conceptsParam, selParam, minParam]);

  return <SessionPlayer key={round} cfg={cfg} onAgain={() => setPlan((p) => ({ round: p.round + 1, now: nowMs() }))} />;
}

export default function PlayPage() {
  return (
    <Suspense fallback={null}>
      <PlayInner />
    </Suspense>
  );
}
