"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, X, GraduationCap, Dumbbell, ClipboardCheck } from "lucide-react";
import { Screen, TopBar, Ring, cx, useNow } from "@/components/ui";
import { StageChips, useStage } from "@/components/library/Stage";
import { GROUPS, MODULE_ORDER, UNIT_BY_ID, groupsForModule, searchLibrary, selKey, type SearchHit, type Selection } from "@/data/library";
import { WORLD_BY_ID } from "@/data/curriculum";

const hitSel = (h: SearchHit): Selection => ({ kind: h.kind, id: h.id });

function UnitRow({ id, now }: { id: string; now: number }) {
  const u = UNIT_BY_ID[id];
  const st = useStage({ kind: "unit", id }, now);
  return (
    <Link href={`/unit?sel=${encodeURIComponent(`unit:${id}`)}`} className="flex items-center gap-3 px-4 py-3 active:bg-surface-2" data-testid={`lib-unit-${id}`}>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-xl">{u.icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-extrabold leading-tight">{u.title}</span>
        <span className="block truncate text-xs text-muted">{u.subtitle}</span>
        <StageChips st={st} className="mt-1" />
      </span>
      <ChevronRight size={18} className="shrink-0 text-muted" />
    </Link>
  );
}

function ModuleSection({ m, now }: { m: (typeof MODULE_ORDER)[number]; now: number }) {
  const w = WORLD_BY_ID[m];
  const st = useStage({ kind: "module", id: m }, now);
  const groups = groupsForModule(m);
  return (
    <section data-testid={`lib-module-${m}`}>
      <Link href={`/unit?sel=${encodeURIComponent(`module:${m}`)}`} className={cx("relative block overflow-hidden rounded-3xl bg-gradient-to-br p-5 text-white shadow-lg", w.gradient)}>
        <div className="absolute -right-6 -top-6 size-32 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-4">
          <Ring value={st.learn} size={60} stroke={6} color="#fff" track="rgba(255,255,255,0.25)">
            <span className="text-xs font-extrabold">{st.learn}%</span>
          </Ring>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-widest text-white/80">{w.module}</p>
            <h2 className="text-xl font-extrabold leading-tight">{w.title}</h2>
            <p className="truncate text-sm text-white/85">{groups.map((g) => g.title).join(" · ")}</p>
          </div>
          <ChevronRight className="shrink-0 text-white/80" />
        </div>
      </Link>
      <div className="mt-3 flex flex-col gap-3">
        {groups.map((g) => (
          <div key={g.id} className="card overflow-hidden" data-testid={`lib-group-${g.id}`}>
            <Link href={`/unit?sel=${encodeURIComponent(`group:${g.id}`)}`} className="flex items-center gap-2 border-b border-line bg-surface-2/60 px-4 py-2.5">
              <span className="text-lg">{g.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-extrabold uppercase tracking-wider">{g.title}</span>
              </span>
              <span className="shrink-0 text-[12px] font-extrabold text-brand">Study all →</span>
            </Link>
            <div className="divide-y divide-line">
              {g.units.map((u) => (
                <UnitRow key={u} id={u} now={now} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function LibraryPage() {
  const router = useRouter();
  const now = useNow();
  const [query, setQuery] = useState("");
  const hits = searchLibrary(query);
  return (
    <Screen>
      <TopBar back="/practice" title="Drug Library" />
      <p className="-mt-2 text-sm text-muted">Study by drug type — pick exactly what you want. Learn it, practice it, then test it.</p>

      <div className="sticky top-0 z-20 -mx-4 mt-3 bg-bg/90 px-4 py-2 backdrop-blur-xl">
        <label className="flex min-h-12 items-center gap-2 rounded-2xl border-2 border-line bg-surface px-3 focus-within:border-brand">
          <Search size={18} className="shrink-0 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a drug or class — heparin, ACE, -pril…"
            className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold outline-none placeholder:font-medium placeholder:text-muted"
            aria-label="Search the drug library"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            data-testid="lib-search"
          />
          {query && (
            <button aria-label="Clear search" onClick={() => setQuery("")} className="grid size-9 place-items-center rounded-full text-muted">
              <X size={18} />
            </button>
          )}
        </label>
      </div>

      {query.trim().length >= 2 ? (
        <div className="mt-2 flex flex-col gap-2" data-testid="lib-results">
          {hits.length === 0 && <p className="py-8 text-center text-sm text-muted">No match in your course drugs. Try a class name or a suffix like “-olol”.</p>}
          {hits.map((h) => {
            const key = encodeURIComponent(selKey(hitSel(h)));
            const w = WORLD_BY_ID[h.module];
            return (
              <div key={`${h.kind}-${h.id}`} className="card p-3" data-testid="lib-hit">
                <button onClick={() => router.push(`/unit?sel=${key}`)} className="flex w-full items-start gap-3 text-left">
                  <span className="min-w-0 flex-1">
                    <span className="block font-extrabold leading-tight">{h.title}</span>
                    <span className="block truncate text-xs text-muted">
                      {h.kind === "group" ? "Drug type" : h.sub} · {w.module}
                    </span>
                  </span>
                  <ChevronRight size={18} className="mt-1 shrink-0 text-muted" />
                </button>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  <Link href={`/learn?sel=${key}`} className="flex min-h-10 items-center justify-center gap-1 rounded-xl bg-brand-soft text-[12.5px] font-extrabold text-brand" data-testid="hit-learn">
                    <GraduationCap size={14} /> Learn
                  </Link>
                  <Link href={`/play?mode=practice&sel=${key}&min=10`} className="flex min-h-10 items-center justify-center gap-1 rounded-xl bg-surface-2 text-[12.5px] font-extrabold" data-testid="hit-practice">
                    <Dumbbell size={14} /> Practice
                  </Link>
                  <Link href={`/play?mode=test&sel=${key}&min=10`} className="flex min-h-10 items-center justify-center gap-1 rounded-xl bg-surface-2 text-[12.5px] font-extrabold" data-testid="hit-test">
                    <ClipboardCheck size={14} /> Test
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-8">
          {MODULE_ORDER.filter((m) => GROUPS.some((g) => g.module === m)).map((m) => (
            <ModuleSection key={m} m={m} now={now} />
          ))}
        </div>
      )}
    </Screen>
  );
}
