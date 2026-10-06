"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Play, GraduationCap, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { GROUPS, UNIT_BY_ID } from "@/data/library";
import { Screen, TopBar, Ring, Button, cx, masteryColor, Bar, useNow } from "@/components/ui";
import { useStore } from "@/lib/store";
import { NODE_BY_ID, WORLD_BY_ID, conceptsForNode } from "@/data/curriculum";
import { cardsForNode } from "@/data/bank";
import { nodeProgress } from "@/lib/engine/progress";
import { effectiveMastery, masteryState, STATE_LABEL } from "@/lib/engine/mastery";
import { DrugCardView } from "@/components/DrugCardView";

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
  // library units that teach this node's concepts (in library order)
  const nodeConcepts = new Set(concepts.map((c) => c.id));
  const lessonUnits = GROUPS.flatMap((g) => g.units).filter((u) => UNIT_BY_ID[u]?.concepts.some((c) => nodeConcepts.has(c)));

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
        {lessonUnits.length > 0 && (
          <div className="grid grid-cols-2 gap-2" data-testid="node-learn">
            <Button variant="secondary" size="md" onClick={() => router.push(`/learn?sel=${encodeURIComponent(`unit:${lessonUnits[0]}`)}`)}>
              <GraduationCap size={17} /> Learn first
            </Button>
            <Button variant="secondary" size="md" onClick={() => router.push(`/unit?sel=${encodeURIComponent(`unit:${lessonUnits[0]}`)}`)}>
              <ClipboardCheck size={17} /> Learn · Practice · Test
            </Button>
          </div>
        )}
        {lessonUnits.length > 1 && (
          <p className="text-center text-[12.5px] font-semibold text-muted">
            Lessons here:{" "}
            {lessonUnits.map((u, i) => (
              <span key={u}>
                {i > 0 && " · "}
                <Link href={`/unit?sel=${encodeURIComponent(`unit:${u}`)}`} className="font-extrabold text-brand">
                  {UNIT_BY_ID[u].title}
                </Link>
              </span>
            ))}
          </p>
        )}
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
            <DrugCardView key={c.id} card={c} />
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
