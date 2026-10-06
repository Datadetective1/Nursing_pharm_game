"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, ChevronLeft, ChevronRight, Grid3x3, Clock, GraduationCap, PlayCircle, Target } from "lucide-react";
import { Screen, TopBar, Button, cx, Bar, Ring, SectionTitle, Chip, useNow } from "@/components/ui";
import { QuestionView } from "@/components/QuestionView";
import { useStore, type ExamResult, conceptLabel } from "@/lib/store";
import { buildExam } from "@/lib/engine/exam";
import { getQuestion } from "@/data/bank";
import { isCorrect, responseText, correctAnswerText, type Response } from "@/lib/engine/grade";
import { mulberry32 } from "@/lib/rng";
import { TOPICS, TOPIC_BY_ID, WORLDS, WORLD_BY_ID, CONCEPT_BY_ID } from "@/data/curriculum";
import { readiness } from "@/lib/engine/progress";
import { effectiveMastery } from "@/lib/engine/mastery";
import { celebrate } from "@/components/celebrate";
import type { Question, QuestionType } from "@/lib/types";

const LIVE_KEY = "pq-exam-live";

interface Live {
  qids: string[];
  responses: Record<number, Response>;
  flagged: number[];
  startedAt: number;
  current: number;
}

function loadLive(): Live | null {
  try {
    const raw = localStorage.getItem(LIVE_KEY);
    return raw ? (JSON.parse(raw) as Live) : null;
  } catch {
    return null;
  }
}
function saveLive(l: Live | null) {
  try {
    if (l) localStorage.setItem(LIVE_KEY, JSON.stringify(l));
    else localStorage.removeItem(LIVE_KEY);
  } catch {
    /* ignore */
  }
}

const TYPE_NAME: Record<QuestionType, string> = { mcq: "Multiple choice", sata: "Select all that apply", fill: "Fill in the blank", tf: "True / False", match: "Match", order: "Order" };

export default function ExamPage() {
  const exams = useStore((s) => s.exams);
  const [live, setLive] = useState<Live | null>(() => loadLive());
  const [view, setView] = useState<{ kind: "intro" } | { kind: "run" } | { kind: "result"; id: string }>(() => ({ kind: "intro" }));

  const start = () => {
    const qs = buildExam(mulberry32(Math.floor(Math.random() * 2 ** 31)));
    const l: Live = { qids: qs.map((q) => q.id), responses: {}, flagged: [], startedAt: Date.now(), current: 0 };
    saveLive(l);
    setLive(l);
    setView({ kind: "run" });
  };

  if (view.kind === "run" && live) {
    return (
      <Runner
        live={live}
        onChange={(l) => {
          saveLive(l);
          setLive(l);
        }}
        onSubmit={(r) => {
          saveLive(null);
          setLive(null);
          setView({ kind: "result", id: r.id });
        }}
        onPause={() => setView({ kind: "intro" })}
      />
    );
  }
  if (view.kind === "result") {
    const r = exams.find((e) => e.id === view.id);
    if (r) return <Results r={r} onBack={() => setView({ kind: "intro" })} />;
  }

  return (
    <Screen>
      <h1 className="text-[26px] font-extrabold tracking-tight">Exam Simulator</h1>
      <p className="text-sm text-muted">A full 50-question Exam 2, built from your blueprint.</p>
      <div className="mt-4 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-950 p-5 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <GraduationCap size={34} className="text-amber-300" />
          <div>
            <p className="text-xl font-extrabold">NURS 3365 · Exam 2</p>
            <p className="text-sm text-white/75">50 questions · MCQ · SATA · fill-in · true/false</p>
          </div>
        </div>
        <ul className="mt-4 space-y-1 text-sm text-white/85">
          <li>• No answers shown until you submit — just like the real thing.</li>
          <li>• Flag questions, jump around, change answers.</li>
          <li>• Safe to close: your exam resumes where you left off.</li>
        </ul>
        {live ? (
          <div className="mt-5 grid gap-2">
            <Button onClick={() => setView({ kind: "run" })} data-testid="exam-resume">
              <PlayCircle size={18} /> Resume exam ({Object.keys(live.responses).length}/{live.qids.length} answered)
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (confirm("Discard the exam in progress and start a new one?")) start();
              }}
            >
              Start over
            </Button>
          </div>
        ) : (
          <Button className="mt-5 w-full" onClick={start} data-testid="exam-start">
            Start 50-question exam
          </Button>
        )}
      </div>

      <SectionTitle>Blueprint distribution</SectionTitle>
      <div className="card divide-y divide-line">
        {TOPICS.map((t) => (
          <div key={t.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="font-semibold">{t.title}</span>
            <span className="font-extrabold">
              {t.examCount} <span className="font-semibold text-muted">({t.min}–{t.max})</span>
            </span>
          </div>
        ))}
      </div>

      {exams.length > 0 && (
        <>
          <SectionTitle>Past attempts</SectionTitle>
          <div className="flex flex-col gap-2">
            {exams.map((e) => (
              <button key={e.id} onClick={() => setView({ kind: "result", id: e.id })} className="card flex items-center justify-between p-4 text-left" data-testid="past-exam">
                <span>
                  <span className="block font-extrabold">{Math.round((e.correct / e.total) * 100)}%</span>
                  <span className="block text-xs text-muted">
                    {new Date(e.at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · {Math.round(e.ms / 60000)} min
                  </span>
                </span>
                <ChevronRight className="text-muted" />
              </button>
            ))}
          </div>
        </>
      )}
    </Screen>
  );
}

function Runner({ live, onChange, onSubmit, onPause }: { live: Live; onChange: (l: Live) => void; onSubmit: (r: ExamResult) => void; onPause: () => void }) {
  const qs = useMemo(() => live.qids.map((id) => getQuestion(id)).filter(Boolean) as Question[], [live.qids]);
  const [grid, setGrid] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const i = Math.min(live.current, qs.length - 1);
  const q = qs[i];
  const answered = Object.keys(live.responses).length;
  const elapsed = Math.floor((now - live.startedAt) / 1000);
  const flagged = live.flagged.includes(i);

  const go = (n: number) => {
    onChange({ ...live, current: Math.max(0, Math.min(qs.length - 1, n)) });
    window.scrollTo({ top: 0 });
  };

  const submit = () => {
    const s = useStore.getState();
    const sessionId = `exam-${live.startedAt}`;
    const items = qs.map((qq, k) => {
      const r = live.responses[k];
      const ok = r ? isCorrect(qq, r) : false;
      const resp = r ? responseText(qq, r) : "(no answer)";
      s.recordAnswer({ q: qq, correct: ok, responseText: resp, ms: 0, mode: "exam", sessionId, sessionStreak: 0 });
      return { q: qq.id, ok, c: qq.concept, t: qq.topic, ty: qq.type, resp };
    });
    const correct = items.filter((x) => x.ok).length;
    const result: ExamResult = { id: `exam-${Date.now()}`, at: Date.now(), ms: Date.now() - live.startedAt, total: items.length, correct, items };
    s.recordExam(result);
    s.finishSession({ mode: "exam", correct, total: items.length });
    if (correct / items.length >= 0.8) celebrate("big");
    onSubmit(result);
  };

  if (!q) return null;
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col" data-testid="exam-runner">
      <div className="sticky top-0 z-30 bg-bg/90 px-4 pb-3 pt-[max(env(safe-area-inset-top),12px)] backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button onClick={onPause} className="-ml-2 grid size-11 place-items-center rounded-full text-muted" aria-label="Pause exam">
            <ChevronLeft size={24} />
          </button>
          <p className="flex-1 font-extrabold" data-testid="exam-position">
            Question {i + 1} <span className="text-muted">/ {qs.length}</span>
          </p>
          <span className="flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 font-mono text-sm font-bold">
            <Clock size={14} /> {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
          </span>
          <button onClick={() => setGrid(true)} className="grid size-11 place-items-center rounded-full text-muted" aria-label="Question grid" data-testid="exam-grid-btn">
            <Grid3x3 size={22} />
          </button>
        </div>
        <Bar value={(answered / qs.length) * 100} className="mt-2 h-1.5" />
      </div>

      <main className="flex-1 px-4 pb-36 pt-2">
        <QuestionView
          key={q.id + i}
          q={q}
          revealed={false}
          askConfidence={false}
          examMode
          examResponse={live.responses[i]}
          onSubmit={() => {}}
          onExamChange={(r) => {
            const responses = { ...live.responses };
            if (r) responses[i] = r;
            else delete responses[i];
            onChange({ ...live, responses });
          }}
        />
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur pb-safe">
        <div className="mx-auto grid max-w-md grid-cols-[auto_1fr_1fr] gap-2 px-4 pt-3">
          <button
            onClick={() => onChange({ ...live, flagged: flagged ? live.flagged.filter((x) => x !== i) : [...live.flagged, i] })}
            className={cx("grid size-14 place-items-center rounded-2xl border-2", flagged ? "border-amber-500 bg-warn-soft text-warn" : "border-line text-muted")}
            aria-label="Flag question"
            data-testid="exam-flag"
          >
            <Flag size={20} className={flagged ? "fill-current" : ""} />
          </button>
          <Button variant="secondary" disabled={i === 0} onClick={() => go(i - 1)} data-testid="exam-prev">
            <ChevronLeft size={18} /> Prev
          </Button>
          {i < qs.length - 1 ? (
            <Button onClick={() => go(i + 1)} data-testid="exam-next">
              Next <ChevronRight size={18} />
            </Button>
          ) : (
            <Button variant="good" onClick={() => setConfirmSubmit(true)} data-testid="exam-submit">
              Submit
            </Button>
          )}
        </div>
      </div>

      {grid && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setGrid(false)}>
          <div className="mx-auto w-full max-w-md rounded-t-3xl bg-surface p-5 pb-safe animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-extrabold">
                {answered}/{qs.length} answered · {live.flagged.length} flagged
              </p>
              <Button size="md" variant="good" onClick={() => setConfirmSubmit(true)} data-testid="exam-submit-grid">
                Submit
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-8 gap-2">
              {qs.map((_, k) => (
                <button
                  key={k}
                  onClick={() => {
                    setGrid(false);
                    go(k);
                  }}
                  className={cx(
                    "relative grid h-10 place-items-center rounded-lg text-sm font-bold",
                    k === i ? "bg-brand text-brand-ink" : live.responses[k] ? "bg-brand-soft text-brand" : "bg-surface-2 text-muted",
                  )}
                >
                  {k + 1}
                  {live.flagged.includes(k) && <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-amber-500" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {confirmSubmit && (
        <div className="fixed inset-0 z-[55] grid place-items-end bg-black/40 p-4 sm:place-items-center" onClick={() => setConfirmSubmit(false)}>
          <div className="card w-full max-w-sm animate-pop p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold">Submit your exam?</h3>
            <p className="mt-1 text-sm text-muted">{qs.length - answered > 0 ? `${qs.length - answered} unanswered question${qs.length - answered === 1 ? "" : "s"} will be marked wrong.` : "All questions answered."}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="secondary" size="md" onClick={() => setConfirmSubmit(false)}>
                Keep working
              </Button>
              <Button variant="good" size="md" onClick={submit} data-testid="exam-confirm-submit">
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function groupPct<T extends string>(items: ExamResult["items"], key: (i: ExamResult["items"][number]) => T) {
  const m = new Map<T, { ok: number; n: number }>();
  for (const it of items) {
    const k = key(it);
    const e = m.get(k) ?? { ok: 0, n: 0 };
    e.n += 1;
    if (it.ok) e.ok += 1;
    m.set(k, e);
  }
  return [...m.entries()].map(([k, v]) => ({ k, ...v, pct: Math.round((v.ok / v.n) * 100) }));
}

function Results({ r, onBack }: { r: ExamResult; onBack: () => void }) {
  const router = useRouter();
  const stats = useStore((s) => s.concepts);
  const [filter, setFilter] = useState<"missed" | "all">("missed");
  const pct = Math.round((r.correct / r.total) * 100);
  const now = useNow();
  const ready = readiness(stats, now, pct);
  const byWorld = groupPct(r.items, (i) => TOPIC_BY_ID[i.t].world);
  const byTopic = groupPct(r.items, (i) => i.t);
  const byType = groupPct(r.items, (i) => i.ty);
  const missedConcepts = Array.from(new Set(r.items.filter((i) => !i.ok).map((i) => i.c)));
  const strongConcepts = Array.from(new Set(r.items.filter((i) => i.ok).map((i) => i.c))).filter((c) => !missedConcepts.includes(c));
  const top5 = missedConcepts
    .map((c) => {
      const concept = CONCEPT_BY_ID[c];
      const weight = (TOPIC_BY_ID[concept?.topic]?.examCount ?? 3) * (concept?.highYield ? 1.5 : 1) * (1 + (100 - effectiveMastery(stats[c], now)) / 100);
      return { c, weight };
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);
  const list = r.items.map((it, k) => ({ it, k, q: getQuestion(it.q) })).filter((x) => x.q && (filter === "all" || !x.it.ok));

  return (
    <Screen>
      <TopBar onClose={onBack} title="Exam results" />
      <div className={cx("rounded-3xl p-5 text-white shadow-xl", pct >= 80 ? "bg-gradient-to-br from-emerald-500 to-teal-700" : pct >= 65 ? "bg-gradient-to-br from-brand to-brand-2" : "bg-gradient-to-br from-slate-700 to-slate-900")} data-testid="exam-result">
        <div className="flex items-center gap-4">
          <Ring value={pct} size={96} stroke={9} color="#fff" track="rgba(255,255,255,0.25)">
            <span className="text-2xl font-extrabold" data-testid="exam-score">
              {pct}%
            </span>
          </Ring>
          <div>
            <p className="text-xl font-extrabold">
              {r.correct}/{r.total} correct
            </p>
            <p className="text-sm text-white/80">
              {Math.floor(r.ms / 60000)} min {Math.round((r.ms % 60000) / 1000)} s · {new Date(r.at).toLocaleDateString()}
            </p>
            <p className="mt-1 text-sm font-bold">Readiness now: {ready.overall}%</p>
          </div>
        </div>
        <Button className="mt-5 w-full" variant="secondary" onClick={() => router.push("/play?mode=misses")} disabled={missedConcepts.length === 0} data-testid="study-misses">
          <Target size={18} /> Study My Misses ({missedConcepts.length} concepts)
        </Button>
      </div>

      <SectionTitle>Top 5 to review next</SectionTitle>
      <div className="card divide-y divide-line">
        {top5.length === 0 && <p className="p-4 text-sm text-muted">Nothing missed. Remarkable.</p>}
        {top5.map((t, k) => (
          <div key={t.c} className="flex items-center gap-3 px-4 py-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-bad-soft text-sm font-extrabold text-bad">{k + 1}</span>
            <span className="min-w-0">
              <span className="block text-sm font-bold leading-snug">{conceptLabel(t.c)}</span>
              <span className="block text-xs text-muted">{TOPIC_BY_ID[CONCEPT_BY_ID[t.c]?.topic]?.title}</span>
            </span>
          </div>
        ))}
      </div>

      <SectionTitle>By module</SectionTitle>
      <div className="card space-y-3 p-4">
        {WORLDS.filter((w) => byWorld.some((b) => b.k === w.id)).map((w) => {
          const b = byWorld.find((x) => x.k === w.id)!;
          return (
            <div key={w.id}>
              <div className="flex justify-between text-sm font-bold">
                <span>
                  {w.module} · {w.title}
                </span>
                <span>
                  {b.ok}/{b.n}
                </span>
              </div>
              <Bar value={b.pct} color={WORLD_BY_ID[w.id].accent} className="mt-1" />
            </div>
          );
        })}
      </div>

      <SectionTitle>By drug class</SectionTitle>
      <div className="card divide-y divide-line">
        {byTopic
          .sort((a, b) => a.pct - b.pct)
          .map((b) => (
            <div key={b.k} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="font-semibold">{TOPIC_BY_ID[b.k].title}</span>
              <span className={cx("font-extrabold", b.pct >= 80 ? "text-good" : b.pct < 60 ? "text-bad" : "")}>
                {b.ok}/{b.n}
              </span>
            </div>
          ))}
      </div>

      <SectionTitle>By question type</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {byType.map((b) => (
          <div key={b.k} className="card p-3">
            <p className="text-xs font-bold text-muted">{TYPE_NAME[b.k]}</p>
            <p className="text-lg font-extrabold">{b.pct}%</p>
            <p className="text-xs text-muted">
              {b.ok}/{b.n}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-xs font-extrabold uppercase tracking-wider text-bad">Weak concepts</p>
          <ul className="mt-2 space-y-1.5 text-[13px]">
            {missedConcepts.slice(0, 6).map((c) => (
              <li key={c} className="leading-snug">
                {conceptLabel(c)}
              </li>
            ))}
            {missedConcepts.length === 0 && <li className="text-muted">None</li>}
          </ul>
        </div>
        <div className="card p-4">
          <p className="text-xs font-extrabold uppercase tracking-wider text-good">Strong concepts</p>
          <ul className="mt-2 space-y-1.5 text-[13px]">
            {strongConcepts.slice(0, 6).map((c) => (
              <li key={c} className="leading-snug">
                {conceptLabel(c)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <SectionTitle
        right={
          <div className="flex gap-1">
            {(["missed", "all"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cx("rounded-full px-3 py-1 text-xs font-bold", filter === f ? "bg-brand text-brand-ink" : "bg-surface-2 text-muted")}>
                {f === "missed" ? "Missed" : "All"}
              </button>
            ))}
          </div>
        }
      >
        Question review
      </SectionTitle>
      <div className="flex flex-col gap-3">
        {list.map(({ it, k, q }) => (
          <div key={k} className={cx("card border-l-4 p-4", it.ok ? "border-l-good" : "border-l-bad")}>
            <div className="mb-1 flex flex-wrap gap-1.5">
              <Chip>Q{k + 1}</Chip>
              <Chip>{TOPIC_BY_ID[it.t].short}</Chip>
              <Chip>{TYPE_NAME[it.ty]}</Chip>
            </div>
            <p className="text-[15px] font-semibold leading-snug">{q!.stem}</p>
            {!it.ok && (
              <p className="mt-2 text-sm">
                <span className="font-bold text-bad">Your answer: </span>
                {it.resp}
              </p>
            )}
            <p className="mt-1 text-sm">
              <span className="font-bold text-good">Correct: </span>
              {correctAnswerText(q!)}
            </p>
            {q!.steps ? (
              <ol className="mt-1 list-decimal pl-5 text-sm text-muted">
                {q!.steps.map((s, j) => (
                  <li key={j}>{s}</li>
                ))}
              </ol>
            ) : (
              <p className="mt-1 text-sm text-muted">{q!.why}</p>
            )}
          </div>
        ))}
      </div>
    </Screen>
  );
}
