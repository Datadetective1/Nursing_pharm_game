"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, Play } from "lucide-react";
import { Screen, TopBar, Ring, Button, cx, masteryColor, Bar, useNow } from "@/components/ui";
import { useStore } from "@/lib/store";
import { NODE_BY_ID, WORLD_BY_ID, conceptsForNode } from "@/data/curriculum";
import { cardsForNode } from "@/data/bank";
import { nodeProgress } from "@/lib/engine/progress";
import { effectiveMastery, masteryState, STATE_LABEL } from "@/lib/engine/mastery";
import type { ChunkKey, DrugCard } from "@/lib/types";

const CHUNK_LABEL: Record<ChunkKey, { label: string; cls: string }> = {
  moa: { label: "MOA", cls: "bg-indigo-500" },
  use: { label: "USE", cls: "bg-sky-500" },
  se: { label: "SIDE EFFECTS", cls: "bg-amber-500" },
  ci: { label: "CONTRAINDICATED", cls: "bg-rose-600" },
  caution: { label: "CAUTION", cls: "bg-orange-500" },
  intx: { label: "INTERACTIONS", cls: "bg-fuchsia-500" },
  lab: { label: "LABS", cls: "bg-teal-500" },
  hold: { label: "HOLD", cls: "bg-red-600" },
  antidote: { label: "ANTIDOTE", cls: "bg-emerald-600" },
  action: { label: "NURSING ACTION", cls: "bg-violet-500" },
  teach: { label: "TEACHING", cls: "bg-cyan-600" },
};
const ORDER: ChunkKey[] = ["moa", "use", "se", "ci", "caution", "intx", "lab", "hold", "antidote", "action", "teach"];

function Card({ card }: { card: DrugCard }) {
  const [open, setOpen] = useState<Set<ChunkKey>>(new Set());
  const keys = ORDER.filter((k) => card.chunks[k]?.length);
  const all = open.size === keys.length;
  return (
    <div className="card p-4" data-testid="drug-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold leading-tight">{card.name}</h3>
          <p className="text-xs font-semibold text-muted">{card.classLabel}</p>
          {card.examples && <p className="mt-0.5 text-xs text-muted">{card.examples}</p>}
        </div>
        <button onClick={() => setOpen(all ? new Set() : new Set(keys))} className="shrink-0 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-bold text-muted">
          {all ? "Hide all" : "Reveal all"}
        </button>
      </div>
      <p className="mt-2 text-xs font-semibold text-muted">Predict each chunk in your head, then tap to check.</p>
      <div className="mt-3 flex flex-col gap-2">
        {keys.map((k) => {
          const isOpen = open.has(k);
          return (
            <button
              key={k}
              onClick={() => {
                const n = new Set(open);
                if (isOpen) n.delete(k);
                else n.add(k);
                setOpen(n);
              }}
              className={cx("rounded-xl border px-3 py-2.5 text-left transition-colors", isOpen ? "border-line bg-surface" : "border-dashed border-line bg-surface-2")}
              data-testid="chunk"
            >
              <span className={cx("inline-block rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider text-white", CHUNK_LABEL[k].cls)}>{CHUNK_LABEL[k].label}</span>
              {isOpen ? (
                <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[14px] leading-snug">
                  {card.chunks[k]!.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              ) : (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-muted">
                  <Eye size={13} /> tap to reveal
                </span>
              )}
            </button>
          );
        })}
      </div>
      {card.hook && (
        <div className="mt-3 rounded-xl bg-brand-soft p-3 text-sm">
          <span className="font-extrabold text-brand">Memory hook: </span>
          {card.hook}
        </div>
      )}
      <p className="mt-2 text-[11px] text-muted">Source: {card.source}</p>
    </div>
  );
}

function NodeInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const id = sp.get("id") ?? "";
  const node = NODE_BY_ID[id];
  const stats = useStore((s) => s.concepts);
  const [tab, setTab] = useState<"concepts" | "cards">("concepts");
  const now = useNow();
  if (!node) {
    return (
      <Screen>
        <TopBar back="/quest" title="Not found" />
        <p className="text-muted">That node doesn&apos;t exist.</p>
      </Screen>
    );
  }
  const world = WORLD_BY_ID[node.world];
  const p = nodeProgress(stats, node.id, now);
  const concepts = conceptsForNode(node.id);
  const cards = cardsForNode(node.id);
  const isCalc = node.id === "calc";

  return (
    <Screen>
      <TopBar back="/quest" title={`World ${world.num} · ${world.title}`} />
      <div className="flex items-center gap-4">
        <Ring value={p.avg} size={84} stroke={8} color={masteryColor(p.avg, p.state !== "unseen")}>
          <span className="text-3xl">{node.icon}</span>
        </Ring>
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight">{node.title}</h1>
          <p className="text-sm text-muted">{node.subtitle}</p>
          <p className="mt-1 text-xs font-bold text-muted">
            {Math.round(p.avg)}% mastery · {p.seen}/{p.total} concepts started
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        <Button onClick={() => router.push(isCalc ? "/dojo" : `/play?mode=node&node=${node.id}`)} data-testid="practice-node">
          <Play size={18} className="fill-current" /> {isCalc ? "Open Dosage Dojo" : "Practice this node"}
        </Button>
      </div>

      {!isCalc && (
        <div className="mt-6 grid grid-cols-2 rounded-2xl bg-surface-2 p-1 text-sm font-bold">
          {(["concepts", "cards"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cx("min-h-10 rounded-xl", tab === t ? "bg-surface shadow-sm" : "text-muted")}>
              {t === "concepts" ? "Concepts" : `Drug cards (${cards.length})`}
            </button>
          ))}
        </div>
      )}

      {(tab === "concepts" || isCalc) && (
        <div className="card mt-3 divide-y divide-line">
          {concepts.map((c) => {
            const st = stats[c.id];
            const e = effectiveMastery(st, now);
            const ms = masteryState(st, now);
            return (
              <div key={c.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold leading-snug">{c.label}</p>
                  <span className="shrink-0 text-[10px] font-extrabold uppercase text-muted">{STATE_LABEL[ms]}</span>
                </div>
                <Bar value={e} color={masteryColor(e, ms !== "unseen")} className="mt-2 h-1.5" />
              </div>
            );
          })}
        </div>
      )}

      {tab === "cards" && !isCalc && (
        <div className="mt-3 flex flex-col gap-3">
          {cards.length === 0 && <p className="text-sm text-muted">No cards for this node.</p>}
          {cards.map((c) => (
            <Card key={c.id} card={c} />
          ))}
        </div>
      )}
    </Screen>
  );
}

export default function NodePage() {
  return (
    <Suspense fallback={null}>
      <NodeInner />
    </Suspense>
  );
}
