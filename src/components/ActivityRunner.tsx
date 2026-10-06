"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, RotateCcw } from "lucide-react";
import type { Activity, ActivityKind, ActivityResult } from "@/lib/activities/types";
import { STATIC_ACTIVITIES, TEMPLATES, getActivity } from "@/data/activities";
import { ActivityView, KIND_LABEL } from "./activities/ActivityView";
import { Button, Screen, TopBar, cx } from "./ui";
import { useStore } from "@/lib/store";

/** Random activity for a kind (static content or a fresh generated instance), avoiding `exclude`. */
export function randomActivity(kind: ActivityKind, exclude?: string, filter?: (a: Activity) => boolean): Activity | undefined {
  const statics = STATIC_ACTIVITIES.filter((a) => a.kind === kind && a.id !== exclude && (!filter || filter(a)));
  const templates = TEMPLATES.filter((t) => t.kind === kind);
  const pool: (() => Activity)[] = [...statics.map((a) => () => a), ...templates.map((t) => () => t.make(Math.floor(Math.random() * 2 ** 31)))];
  if (!pool.length) return undefined;
  for (let i = 0; i < 5; i++) {
    const a = pool[Math.floor(Math.random() * pool.length)]();
    if (a.id !== exclude && (!filter || filter(a))) return a;
  }
  return pool[0]();
}

/** Standalone runner for the Visual Labs (records results to mastery / XP / vault like any session item). */
export function ActivityRunner({ kind, initialId, back = "/visual", filter }: { kind: ActivityKind; initialId?: string; back?: string; filter?: (a: Activity) => boolean }) {
  const router = useRouter();
  const [act, setAct] = useState<Activity | undefined>(() => (initialId ? getActivity(initialId) : undefined) ?? randomActivity(kind, undefined, filter));
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<(ActivityResult & { xp: number }) | null>(null);
  const [sessionId] = useState(() => `visual-${Date.now()}`);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [streak, setStreak] = useState(0);

  const done = (r: ActivityResult) => {
    if (!act || result) return;
    const st = r.correct ? streak + 1 : 0;
    setStreak(st);
    const res = useStore.getState().recordActivity(act, r, { ms: Date.now() - startedAt, mode: `visual-${kind}`, sessionId, sessionStreak: st });
    setResult({ ...r, xp: res.xp });
  };
  const next = () => {
    setAct(randomActivity(kind, act?.id, filter));
    setResult(null);
    setRound((x) => x + 1);
    setStartedAt(Date.now());
    window.scrollTo({ top: 0 });
  };

  return (
    <Screen nav={false}>
      <TopBar back={back} title={KIND_LABEL[kind]} right={streak > 1 ? <span className="text-sm font-black text-xp">🔥 {streak}</span> : undefined} />
      {act ? (
        <div key={`${round}-${act.id}`} className="animate-fade-up" data-testid="visual-runner" data-kind={act.kind}>
          <ActivityView act={act} onDone={done} />
        </div>
      ) : (
        <p className="py-10 text-center text-muted">No activities available yet.</p>
      )}
      {result && (
        <div className={cx("sticky bottom-3 mt-4 rounded-3xl border-2 p-3 shadow-xl backdrop-blur", result.correct ? "border-good/40 bg-good-soft/95" : "border-warn/40 bg-warn-soft/95")} data-testid="runner-footer">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[14px] font-extrabold">
              {result.correct ? "Nicely done" : "Good recovery"} <span className="font-semibold text-muted">· {result.summary}</span>
            </p>
            {result.xp > 0 && <span className="font-black text-xp">+{result.xp} XP</span>}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button variant="secondary" size="md" onClick={() => router.push(back)}>
              <RotateCcw size={15} /> Labs
            </Button>
            <Button size="md" onClick={next} data-testid="runner-next">
              Another <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </Screen>
  );
}
