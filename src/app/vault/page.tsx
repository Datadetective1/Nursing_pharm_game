"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, CheckCheck, Copy, ChevronDown, GraduationCap } from "lucide-react";
import { Screen, TopBar, Button, cx, Chip } from "@/components/ui";
import { useStore, conceptLabel } from "@/lib/store";
import { getQuestion } from "@/data/bank";
import { getActivity } from "@/data/activities";
import { KIND_LABEL } from "@/components/activities/ActivityView";
import { correctAnswerText } from "@/lib/engine/grade";
import { TOPIC_BY_ID } from "@/data/curriculum";
import { microLesson } from "@/data/lessons";
import { relearnConcepts } from "@/lib/engine/session";
import { CONCEPT_BY_ID } from "@/data/curriculum";

export default function VaultPage() {
  const router = useRouter();
  const mistakes = useStore((s) => s.mistakes);
  const markUnderstood = useStore((s) => s.markUnderstood);
  const [tab, setTab] = useState<"open" | "fixed">("open");
  const [expanded, setExpanded] = useState<string | null>(null);
  const list = Object.values(mistakes)
    .filter((m) => (tab === "open" ? !m.resolved : m.resolved) && (getQuestion(m.qid) || getActivity(m.qid)))
    .sort((a, b) => (tab === "open" ? b.misses - a.misses || b.at - a.at : (b.fixedAt ?? 0) - (a.fixedAt ?? 0)));
  const openCount = Object.values(mistakes).filter((m) => !m.resolved && (getQuestion(m.qid) || getActivity(m.qid))).length;
  const fixedCount = Object.values(mistakes).filter((m) => m.resolved).length;
  const stats = useStore((s) => s.concepts);
  // concepts missed repeatedly → recommend RELEARN before more questions
  const openConcepts = Array.from(new Set(Object.values(mistakes).filter((m) => !m.resolved).map((m) => m.concept)))
    .map((id) => CONCEPT_BY_ID[id])
    .filter(Boolean);
  const relearn = new Set(relearnConcepts(stats, mistakes, openConcepts).filter((c) => microLesson(c)));
  const relearnHref = (c: string) => `/learn?concept=${c}&back=${encodeURIComponent("/vault")}`;

  return (
    <Screen>
      <TopBar back="/practice" title="Mistake Vault" />
      <div className="rounded-3xl bg-gradient-to-br from-slate-700 to-slate-900 p-5 text-white">
        <p className="text-xs font-extrabold uppercase tracking-wider text-white/70">Errors are data</p>
        <p className="mt-1 text-lg font-extrabold">{openCount ? `${openCount} question${openCount === 1 ? "" : "s"} waiting for a comeback` : "Vault is clear 🎉"}</p>
        <p className="text-sm text-white/75">{fixedCount} fixed so far. A correct retry moves it to Fixed.</p>
        <Button className="mt-4 w-full" disabled={!openCount} onClick={() => router.push("/play?mode=vault")} data-testid="retry-all">
          <RotateCcw size={18} /> Retry {Math.min(openCount, 10)} mistakes
        </Button>
      </div>

      {tab === "open" && relearn.size > 0 && (
        <div className="mt-4 flex flex-col gap-2" data-testid="vault-relearn">
          {[...relearn].slice(0, 3).map((c) => (
            <div key={c} className="card flex items-center gap-3 border-brand/40 p-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                <GraduationCap size={20} />
              </span>
              <p className="min-w-0 flex-1 text-[14px] font-semibold leading-snug">
                We should review <b>{conceptLabel(c)}</b> — missed more than once.
              </p>
              <Button size="md" className="shrink-0 px-3 text-xs" onClick={() => router.push(relearnHref(c))} data-testid="vault-teach-me">
                Teach me this
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 rounded-2xl bg-surface-2 p-1 text-sm font-bold">
        {(["open", "fixed"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cx("min-h-10 rounded-xl", tab === t ? "bg-surface shadow-sm" : "text-muted")}>
            {t === "open" ? `Open (${openCount})` : `Fixed (${fixedCount})`}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {list.length === 0 && <p className="py-10 text-center text-sm text-muted">{tab === "open" ? "No open mistakes. Go earn some — that's how learning happens." : "Nothing fixed yet."}</p>}
        {list.map((m) => {
          const q = getQuestion(m.qid);
          const act = q ? undefined : getActivity(m.qid);
          const isOpen = expanded === m.qid;
          return (
            <div key={m.qid} className="card p-4" data-testid="vault-item">
              <button className="flex w-full items-start gap-2 text-left" onClick={() => setExpanded(isOpen ? null : m.qid)}>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap gap-1.5">
                    <Chip>{TOPIC_BY_ID[m.topic]?.short}</Chip>
                    {m.misses > 1 && <Chip className="bg-bad-soft text-bad">missed ×{m.misses}</Chip>}
                    {m.understood && <Chip className="bg-good-soft text-good">understood</Chip>}
                  </div>
                  <p className={cx("text-[15px] font-semibold leading-snug", !isOpen && "line-clamp-2")}>
                    {act && <span className="mr-1.5 rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-extrabold text-brand">{KIND_LABEL[act.kind]}</span>}
                    {q ? q.stem : act?.title}
                  </p>
                  <p className="mt-1 text-xs text-muted">{conceptLabel(m.concept)}</p>
                </div>
                <ChevronDown size={18} className={cx("mt-1 shrink-0 text-muted transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen && act && (
                <div className="mt-3 text-sm">
                  <p>
                    <span className="font-bold text-warn">Last attempt: </span>
                    {m.chosen}
                  </p>
                  <p className="mt-1 text-muted">Retry rebuilds the same interactive activity.</p>
                </div>
              )}
              {isOpen && q && (
                <div className="mt-3 space-y-2 text-sm">
                  <p>
                    <span className="font-bold text-bad">You chose: </span>
                    {m.chosen}
                  </p>
                  <p>
                    <span className="font-bold text-good">Correct: </span>
                    {correctAnswerText(q)}
                  </p>
                  {q.steps ? (
                    <ol className="list-decimal pl-5 text-muted">
                      {q.steps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-muted">
                      <span className="font-bold text-ink">Why: </span>
                      {q.why}
                    </p>
                  )}
                  {q.clue && (
                    <p className="text-muted">
                      <span className="font-bold text-ink">Clue: </span>
                      {q.clue}
                    </p>
                  )}
                  {q.hook && (
                    <p className="text-muted">
                      <span className="font-bold text-ink">Hook: </span>
                      {q.hook}
                    </p>
                  )}
                </div>
              )}
              {tab === "open" && (
                <>
                  {relearn.has(m.concept) && <p className="mt-3 text-[12px] font-extrabold text-brand">Missed more than once — relearn it first.</p>}
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <Button size="md" variant={relearn.has(m.concept) ? "primary" : "secondary"} disabled={!microLesson(m.concept)} className="gap-1 px-1.5 text-xs" onClick={() => router.push(relearnHref(m.concept))} data-testid="vault-relearn-btn">
                      <GraduationCap size={15} /> Relearn
                    </Button>
                    <Button size="md" variant="secondary" className="gap-1 px-1.5 text-xs" onClick={() => router.push(`/play?mode=vault&qid=${encodeURIComponent(m.qid)}`)} data-testid="vault-retry">
                      <RotateCcw size={15} /> Try again
                    </Button>
                    <Button size="md" variant="secondary" className="gap-1 px-1.5 text-xs" onClick={() => router.push(`/play?mode=similar&concept=${m.concept}&qid=${encodeURIComponent(m.qid)}`)} data-testid="vault-similar">
                      <Copy size={15} /> Similar
                    </Button>
                  </div>
                  <button onClick={() => markUnderstood(m.qid)} className="mx-auto mt-1.5 flex min-h-10 items-center gap-1 rounded-full px-3 text-[12.5px] font-bold text-muted" data-testid="vault-understand">
                    <CheckCheck size={14} /> I understand it now
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </Screen>
  );
}
