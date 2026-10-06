"use client";

import type { TreeNode } from "@/data/trees";
import { cx } from "./ui";

const BADGE: Record<string, string> = {
  antidote: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  lab: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  key: "bg-surface-2 text-muted",
};

function Branch({ node, depth }: { node: TreeNode; depth: number }) {
  return (
    <li className={cx("relative", depth > 0 && "pl-4")}>
      {depth > 0 && <span aria-hidden className="absolute left-0 top-0 h-4 w-3 rounded-bl-lg border-b-2 border-l-2 border-line" />}
      <div className={cx("flex flex-wrap items-center gap-1.5 py-1", depth === 0 ? "text-[15px] font-extrabold" : "text-sm font-semibold")}>
        <span>{node.label}</span>
        {node.badges?.map((b) => (
          <span key={b.text} className={cx("rounded-md px-1.5 py-0.5 text-[10.5px] font-bold", BADGE[b.kind])}>
            {b.kind === "antidote" ? "⟲ " : b.kind === "lab" ? "◎ " : ""}
            {b.text}
          </span>
        ))}
      </div>
      {node.children && (
        <ul className={cx("relative", "ml-1.5 border-l-2 border-line")}>
          {node.children.map((c) => (
            <Branch key={c.label} node={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function FamilyTree({ roots }: { roots: TreeNode[] }) {
  return (
    <div className="card p-4" data-testid="family-tree">
      <ul className="space-y-2">
        {roots.map((r) => (
          <Branch key={r.label} node={r} depth={0} />
        ))}
      </ul>
      <p className="mt-3 flex flex-wrap gap-3 text-[11px] font-semibold text-muted">
        <span>⟲ antidote</span>
        <span>◎ lab / range</span>
      </p>
    </div>
  );
}
