"use client";

import Link from "next/link";
import { useState } from "react";
import { FamilyTree } from "@/components/FamilyTree";
import { TREES } from "@/data/trees";
import { Swords, Lock, Crown, Network } from "lucide-react";
import { Screen, Ring, Stars, cx, masteryColor, useNow } from "@/components/ui";
import { useStore } from "@/lib/store";
import { NODES, WORLDS } from "@/data/curriculum";
import { nodeProgress, worldProgress } from "@/lib/engine/progress";
import { currentNode } from "@/lib/engine/session";

const STATE_TEXT: Record<string, string> = { unseen: "Unseen", shaky: "Shaky", learning: "Learning", strong: "Strong", mastered: "Mastered" };
const STATE_CLS: Record<string, string> = {
  unseen: "bg-surface-2 text-muted",
  shaky: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  learning: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  strong: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
  mastered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
};

export default function QuestPage() {
  const stats = useStore((s) => s.concepts);
  const bosses = useStore((s) => s.bosses);
  const now = useNow();
  const cur = currentNode(stats, now);
  const [openTree, setOpenTree] = useState<string | null>(null);

  return (
    <Screen>
      <h1 className="text-[26px] font-extrabold tracking-tight">Quest Map</h1>
      <p className="text-sm text-muted">Four worlds, one exam. Clear nodes, then face each boss.</p>

      <div className="mt-5 flex flex-col gap-8">
        {WORLDS.map((w) => {
          const wp = worldProgress(stats, w.id, now);
          const nodes = NODES.filter((n) => n.world === w.id);
          const boss = w.boss;
          const bossRec = boss ? bosses[boss.id] : undefined;
          return (
            <section key={w.id} data-testid={`world-${w.id}`}>
              <div className={cx("relative overflow-hidden rounded-3xl bg-gradient-to-br p-5 text-white shadow-lg", w.gradient)}>
                <div className="absolute -right-6 -top-6 size-32 rounded-full bg-white/10" />
                <div className="relative flex items-center gap-4">
                  <Ring value={wp.avg} size={64} stroke={6} color="#fff" track="rgba(255,255,255,0.25)">
                    <span className="text-sm font-extrabold">{Math.round(wp.avg)}%</span>
                  </Ring>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold uppercase tracking-widest text-white/80">
                      World {w.num} · {w.module}
                    </p>
                    <h2 className="text-xl font-extrabold leading-tight">{w.title}</h2>
                    <p className="truncate text-sm text-white/85">{w.subtitle}</p>
                  </div>
                </div>
              </div>

              {TREES[w.id] && (
                <div className="mt-3">
                  <button
                    onClick={() => setOpenTree(openTree === w.id ? null : w.id)}
                    className="flex min-h-11 items-center gap-2 rounded-full bg-surface-2 px-4 text-sm font-bold text-muted"
                    data-testid={`tree-${w.id}`}
                    aria-expanded={openTree === w.id}
                  >
                    <Network size={16} /> {openTree === w.id ? "Hide family tree" : "Drug family tree"}
                  </button>
                  {openTree === w.id && (
                    <div className="mt-3 animate-fade-up">
                      <FamilyTree roots={TREES[w.id]!} />
                    </div>
                  )}
                </div>
              )}

              <div className="relative mt-4 flex flex-col gap-3 pl-4">
                <div className="absolute bottom-6 left-[38px] top-6 w-1 rounded-full bg-line" aria-hidden />
                {nodes.map((n, i) => {
                  const p = nodeProgress(stats, n.id, now);
                  const isCur = cur.id === n.id;
                  return (
                    <Link key={n.id} href={`/node?id=${n.id}`} className={cx("relative flex items-center gap-3", i % 2 === 1 && "pl-6")} data-testid={`node-${n.id}`}>
                      <div className={cx("relative rounded-full bg-bg", isCur && "animate-pulse-ring")}>
                        <Ring value={p.avg} size={52} stroke={5} color={masteryColor(p.avg, p.state !== "unseen")}>
                          <span className="text-xl">{n.icon}</span>
                        </Ring>
                      </div>
                      <div className={cx("card min-w-0 flex-1 px-4 py-3", isCur && "border-brand")}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-extrabold">{n.title}</p>
                          <Stars n={p.stars} />
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <p className="truncate text-xs text-muted">{n.subtitle}</p>
                          <span className={cx("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase", isCur ? "bg-brand text-brand-ink" : STATE_CLS[p.state])}>{isCur ? "Up next" : STATE_TEXT[p.state]}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {boss && (
                  <Link href={`/play?mode=boss&world=${w.id}`} className="relative flex items-center gap-3" data-testid={`boss-${w.id}`}>
                    <div className="grid size-[52px] shrink-0 place-items-center rounded-2xl bg-[#16131d] text-white shadow-lg ring-1 ring-white/10">{bossRec?.wins ? <Crown size={24} className="text-amber-300" /> : <Swords size={24} />}</div>
                    <div className="min-w-0 flex-1 rounded-2xl bg-gradient-to-r from-[#16131d] to-[#2a1420] px-4 py-3 text-white shadow-lg ring-1 ring-white/10">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-extrabold">{boss.name}</p>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">{bossRec?.wins ? `Beaten ×${bossRec.wins}` : "Boss"}</span>
                      </div>
                      <p className="truncate text-xs text-white/70">
                        10 mixed · 3 hearts · {wp.avg < 30 ? "recommended after more practice" : boss.tagline}
                      </p>
                    </div>
                    {wp.avg < 30 && !bossRec?.wins && <Lock size={14} className="absolute right-3 top-2 text-white/40" aria-hidden />}
                  </Link>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </Screen>
  );
}
