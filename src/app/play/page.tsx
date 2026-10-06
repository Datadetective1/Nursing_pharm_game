"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SessionPlayer } from "@/components/SessionPlayer";
import { buildSession, type Mode } from "@/lib/engine/session";
import { useStore } from "@/lib/store";
import type { WorldId } from "@/lib/types";
import { nowMs } from "@/lib/time";

const MODES: Mode[] = ["mission", "continue", "quick5", "weak", "node", "world", "boss", "vault", "similar", "misses", "highyield"];

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
      now: plan.now,
    });
    // a new plan (round) forces a fresh session for "Another round"
  }, [mode, node, world, concept, qid, round, plan.now]);

  return <SessionPlayer key={round} cfg={cfg} onAgain={() => setPlan((p) => ({ round: p.round + 1, now: nowMs() }))} />;
}

export default function PlayPage() {
  return (
    <Suspense fallback={null}>
      <PlayInner />
    </Suspense>
  );
}
