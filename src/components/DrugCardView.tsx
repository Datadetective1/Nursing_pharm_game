"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { cx } from "@/components/ui";
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

export function DrugCardView({ card }: { card: DrugCard }) {
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

