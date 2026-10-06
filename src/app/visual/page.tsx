"use client";

import Link from "next/link";
import { Screen, TopBar, cx } from "@/components/ui";
import { VISUAL_LABS } from "@/data/visualLabs";
import { STATIC_ACTIVITIES, TEMPLATES } from "@/data/activities";

export default function VisualLabsPage() {
  const count = (kind: string) => STATIC_ACTIVITIES.filter((a) => a.kind === kind).length + TEMPLATES.filter((t) => t.kind === kind).length;
  return (
    <Screen>
      <TopBar back="/practice" title="Visual Labs" />
      <p className="-mt-2 mb-4 text-sm text-muted">Touch it, move it, sort it. Every lab feeds your mastery map.</p>
      <div className="grid grid-cols-2 gap-3">
        {VISUAL_LABS.map((l) => (
          <Link key={l.slug} href={`/visual/play?lab=${l.slug}`} className="card relative flex min-h-36 flex-col justify-between overflow-hidden p-3.5 transition-transform active:scale-[0.98]" data-testid={`lab-${l.slug}`}>
            <span className={cx("grid size-11 place-items-center rounded-2xl bg-gradient-to-br text-[22px] shadow-md", l.tone)}>{l.icon}</span>
            <span>
              <span className="block text-[15px] font-extrabold leading-tight">{l.title}</span>
              <span className="mt-0.5 block text-[11.5px] leading-snug text-muted">{l.sub}</span>
              {!l.id && <span className="mt-1 block text-[10.5px] font-bold text-brand">{count(l.kind) > 12 ? "∞" : count(l.kind)} variants</span>}
            </span>
          </Link>
        ))}
      </div>
    </Screen>
  );
}
