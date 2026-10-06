"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Dumbbell, ClipboardCheck, ChevronRight, Check, Lock, Zap, Calculator, ChevronDown } from "lucide-react";
import { Screen, TopBar, Button, Bar, cx, useNow, masteryColor } from "@/components/ui";
import { StageChips, useStage } from "@/components/library/Stage";
import { DrugCardView } from "@/components/DrugCardView";
import { useStore } from "@/lib/store";
import { DRUG_BY_ID, GROUP_BY_ID, UNIT_BY_ID, drugsForUnit, groupsForModule, moduleLabel, parseSelection, resolveSelection, selKey, unitsForGroup, type Selection } from "@/data/library";
import { CONCEPT_BY_ID, WORLD_BY_ID } from "@/data/curriculum";
import { CARDS } from "@/data/bank";
import { LESSON_BY_UNIT } from "@/data/lessons";
import { knowledgeState, TEST_LABEL } from "@/lib/engine/learning";
import { STATE_LABEL } from "@/lib/engine/mastery";
import type { Minutes } from "@/lib/engine/session";
import type { WorldId } from "@/lib/types";

type Action = "learn" | "practice" | "test";
const LENGTHS: { v: Minutes; label: string }[] = [
  { v: 5, label: "5 min" },
  { v: 10, label: "10 min" },
  { v: 20, label: "20 min" },
  { v: "master", label: "Master it" },
];

function crumbs(sel: Selection): { label: string; href?: string }[] {
  const link = (s: Selection) => `/unit?sel=${encodeURIComponent(selKey(s))}`;
  if (sel.kind === "module") return [{ label: WORLD_BY_ID[sel.id as WorldId]?.module ?? "" }];
  if (sel.kind === "group") {
    const g = GROUP_BY_ID[sel.id];
    return g ? [{ label: WORLD_BY_ID[g.module].module, href: link({ kind: "module", id: g.module }) }] : [];
  }
  const unit = sel.kind === "unit" ? UNIT_BY_ID[sel.id] : UNIT_BY_ID[DRUG_BY_ID[sel.id]?.unit ?? ""];
  if (!unit) return [];
  const g = GROUP_BY_ID[unit.group];
  const out = [
    { label: WORLD_BY_ID[g.module].module, href: link({ kind: "module", id: g.module }) },
    { label: g.title, href: link({ kind: "group", id: g.id }) },
  ];
  if (sel.kind === "drug") out.push({ label: unit.title, href: link({ kind: "unit", id: unit.id }) });
  return out;
}

function StageRow({ icon, label, done, value, detail, pct }: { icon: React.ReactNode; label: string; done?: boolean; value: string; detail?: string; pct: number }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className={cx("grid size-9 shrink-0 place-items-center rounded-xl", done ? "bg-good text-white" : "bg-surface-2 text-muted")}>{done ? <Check size={18} strokeWidth={3} /> : icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-extrabold">{label}</p>
          <p className={cx("text-sm font-extrabold", done ? "text-good" : "text-ink")}>{value}</p>
        </div>
        <Bar value={pct} color={done ? "var(--good)" : "var(--brand)"} className="mt-1.5 h-1.5" />
        {detail && <p className="mt-1 text-[11.5px] font-semibold text-muted">{detail}</p>}
      </div>
    </div>
  );
}

function UnitInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const sel = parseSelection(sp.get("sel"));
  const now = useNow();
  const learn = useStore((s) => s.learn);
  const stats = useStore((s) => s.concepts);
  const [action, setAction] = useState<Action | null>(null);
  const [len, setLen] = useState<Minutes>(10);
  const [showKnow, setShowKnow] = useState(false);
  const r = sel ? resolveSelection(sel) : null;
  const st = useStage(sel ?? { kind: "module", id: "w5" }, now);

  if (!sel || !r || !r.concepts.length) {
    return (
      <Screen>
        <TopBar back="/library" title="Not found" />
        <p className="text-muted">That drug type isn&apos;t in the library.</p>
      </Screen>
    );
  }

  const key = encodeURIComponent(selKey(sel));
  const unit = sel.kind === "unit" ? UNIT_BY_ID[sel.id] : sel.kind === "drug" ? UNIT_BY_ID[DRUG_BY_ID[sel.id]?.unit] : undefined;
  const icon = unit?.icon ?? (sel.kind === "group" ? GROUP_BY_ID[sel.id]?.icon : "📚");
  const isCalc = r.concepts.every((c) => CONCEPT_BY_ID[c]?.topic === "calc");
  const hasLesson = sel.kind === "group" || sel.kind === "module" ? r.units.some((u) => LESSON_BY_UNIT[u]) : !!(unit && LESSON_BY_UNIT[unit.id]);
  const recommended: Action = !st.learnDone && hasLesson ? "learn" : st.practice < 60 ? "practice" : "test";
  const chosen = action ?? recommended;
  const lessonMin = unit ? LESSON_BY_UNIT[unit.id]?.minutes : undefined;

  const start = () => {
    if (chosen === "learn") router.push(`/learn?sel=${key}`);
    else router.push(`/play?mode=${chosen}&sel=${key}&min=${len}`);
  };

  const children =
    sel.kind === "module"
      ? groupsForModule(sel.id as WorldId).map((g) => ({ sel: { kind: "group", id: g.id } as Selection, icon: g.icon, title: g.title, sub: g.subtitle }))
      : sel.kind === "group"
        ? unitsForGroup(sel.id).map((u) => ({ sel: { kind: "unit", id: u.id } as Selection, icon: u.icon, title: u.title, sub: u.subtitle }))
        : sel.kind === "unit"
          ? drugsForUnit(sel.id)
              .filter((d) => d.name.toLowerCase() !== unit?.title.toLowerCase())
              .map((d) => ({ sel: { kind: "drug", id: d.id } as Selection, icon: "💊", title: d.name, sub: unit?.title ?? "" }))
          : [];
  // drug cards for this unit's quest nodes; a single drug shows the cards that name it (else all of the unit's)
  const unitCards = unit ? CARDS.filter((c) => unit.concepts.some((cid) => CONCEPT_BY_ID[cid]?.node === c.node)) : [];
  const drugName = sel.kind === "drug" ? DRUG_BY_ID[sel.id]?.name.split(/[ (/]/)[0].toLowerCase() : undefined;
  const named = drugName ? unitCards.filter((c) => `${c.name} ${c.examples ?? ""}`.toLowerCase().includes(drugName)) : [];
  const cards = named.length ? named : unitCards;

  const ACTIONS: { id: Action; icon: React.ReactNode; title: string; sub: string; disabled?: boolean }[] = [
    { id: "learn", icon: <GraduationCap size={22} />, title: "LEARN", sub: "Teach me from the beginning", disabled: !hasLesson },
    { id: "practice", icon: <Dumbbell size={22} />, title: "PRACTICE", sub: "Help me remember it" },
    { id: "test", icon: <ClipboardCheck size={22} />, title: "TEST", sub: "See what I know" },
  ];

  return (
    <Screen>
      <TopBar back="/library" title="Drug Library" />
      <nav className="-mt-2 mb-2 flex flex-wrap items-center gap-1 text-[12px] font-bold text-muted" aria-label="Breadcrumb" data-testid="crumbs">
        {crumbs(sel).map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            {c.href ? (
              <Link href={c.href} className="text-brand">
                {c.label}
              </Link>
            ) : (
              <span>{c.label}</span>
            )}
            <ChevronRight size={12} />
          </span>
        ))}
        <span className="text-ink">{r.title}</span>
      </nav>

      <div className="flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-soft text-3xl">{icon}</span>
        <div className="min-w-0">
          <h1 className="text-[26px] font-extrabold leading-tight tracking-tight" data-testid="unit-title">
            {r.title}
          </h1>
          <p className="text-sm text-muted">{sel.kind === "module" ? moduleLabel(sel.id as WorldId) : unit && sel.kind === "drug" ? unit.title : unit?.subtitle ?? r.subtitle}</p>
        </div>
      </div>

      <div className="card mt-4 divide-y divide-line" data-testid="stage-tracker">
        <StageRow icon={<GraduationCap size={18} />} label="Learn" done={st.learnDone} value={st.learnDone ? "✓" : `${st.learn}%`} pct={st.learn} detail={!st.learnDone ? "Teaching comes before testing" : undefined} />
        <StageRow icon={<Dumbbell size={18} />} label="Practice" done={st.practice >= 100} value={`${st.practice}%`} pct={st.practice} detail="Hints fade as you show you've got it" />
        <StageRow icon={st.test === "locked" ? <Lock size={16} /> : <ClipboardCheck size={18} />} label="Test" done={st.test === "passed" || st.test === "mastered"} value={TEST_LABEL[st.test]} pct={st.test === "mastered" ? 100 : st.lastTest ?? 0} detail={st.lastTest !== undefined ? `Last test ${st.lastTest}%` : st.test === "locked" ? "Unlocks after Learn — or test yourself now anytime" : undefined} />
      </div>

      <h2 className="mb-2 mt-6 text-[13px] font-extrabold uppercase tracking-wider text-muted">What do you want to do?</h2>
      <div className="grid gap-2.5" role="radiogroup" aria-label="Choose a mode">
        {ACTIONS.map((a) => {
          const on = chosen === a.id;
          return (
            <button
              key={a.id}
              role="radio"
              aria-checked={on}
              disabled={a.disabled}
              onClick={() => setAction(a.id)}
              className={cx("flex min-h-16 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all disabled:opacity-40", on ? "border-brand bg-brand-soft" : "border-line bg-surface active:scale-[0.99]")}
              data-testid={`action-${a.id}`}
            >
              <span className={cx("grid size-11 shrink-0 place-items-center rounded-2xl", on ? "bg-brand text-brand-ink" : "bg-surface-2 text-muted")}>{a.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-extrabold tracking-wide">{a.title}</span>
                <span className="block text-sm text-muted">{a.sub}</span>
              </span>
              {recommended === a.id && <span className="shrink-0 rounded-full bg-xp/15 px-2 py-0.5 text-[10.5px] font-extrabold uppercase text-xp">Next step</span>}
            </button>
          );
        })}
      </div>

      {chosen !== "learn" ? (
        <div className="mt-3 grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Session length" data-testid="lengths">
          {LENGTHS.map((l) => (
            <button key={String(l.v)} role="radio" aria-checked={len === l.v} onClick={() => setLen(l.v)} className={cx("min-h-11 rounded-xl border-2 text-[13px] font-extrabold", len === l.v ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface text-muted")} data-testid={`len-${l.v}`}>
              {l.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-center text-[13px] font-semibold text-muted">{lessonMin ? `About ${lessonMin} minutes · one idea per screen` : "Short screens · one idea at a time"}</p>
      )}

      <Button className="mt-4 w-full" onClick={start} data-testid="unit-start">
        {chosen === "learn" ? <GraduationCap size={18} /> : chosen === "practice" ? <Dumbbell size={18} /> : <ClipboardCheck size={18} />}
        {chosen === "learn" ? "Start the lesson" : chosen === "practice" ? "Start practice" : "Start the test"}
      </Button>
      {chosen === "test" && <p className="mt-2 text-center text-[12px] font-semibold text-muted">Exam-style · no hints · no teaching before you answer</p>}

      {!st.learnDone && hasLesson && !isCalc && (
        <Link href={`/play?mode=pretest&sel=${key}`} className="mt-3 flex min-h-11 items-center justify-center gap-1.5 text-[14px] font-extrabold text-brand" data-testid="test-out">
          <Zap size={16} /> Already know this? Test out.
        </Link>
      )}
      {isCalc && (
        <Link href="/dojo" className="card mt-3 flex items-center gap-3 p-4">
          <Calculator size={20} className="text-brand" />
          <span className="font-extrabold">Open Dosage Dojo</span>
          <ChevronRight size={18} className="ml-auto text-muted" />
        </Link>
      )}

      {children.length > 0 && (
        <>
          <h2 className="mb-2 mt-7 text-[13px] font-extrabold uppercase tracking-wider text-muted">{sel.kind === "module" ? "Drug types" : sel.kind === "group" ? "Classes & drugs" : "Study one drug"}</h2>
          <div className="card divide-y divide-line">
            {children.map((c) => (
              <ChildRow key={selKey(c.sel)} sel={c.sel} icon={c.icon} title={c.title} sub={c.sub} now={now} />
            ))}
          </div>
        </>
      )}

      <button onClick={() => setShowKnow((v) => !v)} className="mt-7 flex w-full items-center justify-between text-[13px] font-extrabold uppercase tracking-wider text-muted" aria-expanded={showKnow} data-testid="know-toggle">
        What you know ({r.concepts.length} concepts)
        <ChevronDown size={18} className={cx("transition-transform", showKnow && "rotate-180")} />
      </button>
      {showKnow && (
        <div className="card mt-2 divide-y divide-line" data-testid="knowledge">
          {r.concepts.map((cid) => {
            const k = knowledgeState(learn[cid], stats[cid], now);
            return (
              <div key={cid} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold leading-snug">{CONCEPT_BY_ID[cid]?.label}</p>
                  <span className="shrink-0 text-[10px] font-extrabold uppercase text-muted">{k.exposure ? STATE_LABEL[k.masteryLabel] : "Not taught yet"}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1 text-[10.5px] font-bold text-muted">
                  <span className={cx("rounded-full px-2 py-0.5", k.lessonComplete || k.testedOut ? "bg-good-soft text-good" : "bg-surface-2")}>{k.testedOut ? "Tested out" : k.lessonComplete ? "Lesson ✓" : k.exposure ? "Seen" : "Lesson"}</span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5">Guided {k.guided ?? "–"}{k.guided !== null ? "%" : ""}</span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5">Recall {k.recall ?? "–"}{k.recall !== null ? "%" : ""}</span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5">Apply {k.application ?? "–"}{k.application !== null ? "%" : ""}</span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5">Level {k.level}/6</span>
                </div>
                <Bar value={k.mastery} color={masteryColor(k.mastery, k.exposure)} className="mt-2 h-1.5" />
              </div>
            );
          })}
        </div>
      )}

      {cards.length > 0 && (
        <>
          <h2 className="mb-2 mt-7 text-[13px] font-extrabold uppercase tracking-wider text-muted">Drug cards</h2>
          <div className="flex flex-col gap-3">
            {cards.map((c) => (
              <DrugCardView key={c.id} card={c} />
            ))}
          </div>
        </>
      )}
    </Screen>
  );
}

function ChildRow({ sel, icon, title, sub, now }: { sel: Selection; icon: string; title: string; sub: string; now: number }) {
  const st = useStage(sel, now);
  return (
    <Link href={`/unit?sel=${encodeURIComponent(selKey(sel))}`} className="flex items-center gap-3 px-4 py-3" data-testid={`child-${sel.id}`}>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-xl">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-extrabold leading-tight">{title}</span>
        <span className="block truncate text-xs text-muted">{sub}</span>
        <StageChips st={st} className="mt-1" />
      </span>
      <ChevronRight size={18} className="shrink-0 text-muted" />
    </Link>
  );
}

export default function UnitPage() {
  return (
    <Suspense fallback={null}>
      <UnitInner />
    </Suspense>
  );
}
