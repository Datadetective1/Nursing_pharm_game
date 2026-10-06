"use client";

import Link from "next/link";
import { Screen, Ring, Bar, SectionTitle, cx, masteryColor, useNow } from "@/components/ui";
import { useStore, conceptLabel } from "@/lib/store";
import { readiness, dayKey, displayStreak, levelFromXp } from "@/lib/engine/progress";
import { effectiveMastery } from "@/lib/engine/mastery";
import { TOPICS, WORLDS, CONCEPTS, TOPIC_BY_ID } from "@/data/curriculum";
import { ACHIEVEMENTS } from "@/lib/engine/achievements";
import { rankWeakConcepts } from "@/lib/engine/session";
import { Heatmap, AccuracyTrend, focusHref } from "@/components/analytics/Heatmap";

export default function ProgressPage() {
  const s = useStore();
  const now = useNow();
  const today = dayKey();
  const latestExam = s.exams[0];
  const recentExamPct = latestExam && now - latestExam.at < 3 * 86_400_000 ? (latestExam.correct / latestExam.total) * 100 : undefined;
  const ready = readiness(s.concepts, now, recentExamPct);
  const lvl = levelFromXp(s.xp);
  const answered = s.counters.totalAnswered;
  const correct = Object.values(s.days).reduce((a, d) => a + d.correct, 0);
  const totalMs = Object.values(s.days).reduce((a, d) => a + d.ms, 0);
  const acc = answered ? Math.round((correct / answered) * 100) : 0;

  const seen = CONCEPTS.filter((c) => (s.concepts[c.id]?.seen ?? 0) > 0);
  const weakest = rankWeakConcepts(s.concepts, s.mistakes, now, seen).slice(0, 5);
  const strongest = [...seen].sort((a, b) => effectiveMastery(s.concepts[b.id], now) - effectiveMastery(s.concepts[a.id], now)).slice(0, 5);

  // last 7 days trend
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const k = dayKey(d);
    const st = s.days[k];
    return { k, label: d.toLocaleDateString([], { weekday: "narrow" }), answered: st?.answered ?? 0, wrong: st ? st.answered - st.correct : 0, acc: st && st.answered ? st.correct / st.answered : 0 };
  });
  const maxA = Math.max(1, ...days.map((d) => d.answered));
  const trend = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (13 - i));
    const st = s.days[dayKey(d)];
    return { label: dayKey(d), acc: st && st.answered ? Math.round((st.correct / st.answered) * 100) : null, n: st?.answered ?? 0 };
  });

  const cal = s.calib;
  const calRows = [
    { k: "confident", label: "Confident", icon: "💪" },
    { k: "unsure", label: "Unsure", icon: "🤔" },
    { k: "guess", label: "Guessing", icon: "🎲" },
  ] as const;
  const falseConf = cal.confident.n ? cal.confident.n - cal.confident.ok : 0;

  return (
    <Screen>
      <h1 className="text-[26px] font-extrabold tracking-tight">Progress</h1>

      <div className="card mt-4 flex items-center gap-4 p-5">
        <Ring value={ready.overall} size={104} stroke={10}>
          <div className="text-center">
            <div className="text-2xl font-extrabold" data-testid="progress-readiness">
              {ready.overall}%
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted">readiness</div>
          </div>
        </Ring>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-extrabold">
            Lv {lvl.level} · {lvl.title}
          </p>
          <p className="text-muted">
            {s.xp} XP · 🔥 {displayStreak(s.streak, today)}-day streak (best {s.streak.best})
          </p>
          <p className="mt-2 text-xs text-muted">Weighted by the Exam 2 blueprint. Mastery needs repeated application-level wins across sessions — easy recall alone can&apos;t max it out.{recentExamPct !== undefined ? " Includes your latest exam simulation (25%)." : ""}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Answered" value={answered} />
        <Stat label="Accuracy" value={`${acc}%`} />
        <Stat label="Study time" value={`${Math.round(totalMs / 60000)}m`} />
      </div>

      <SectionTitle>Weak-spot heatmap</SectionTitle>
      <Heatmap stats={s.concepts} now={now} />

      <SectionTitle>Module mastery</SectionTitle>
      <div className="grid grid-cols-3 gap-2" data-testid="module-rings">
        {WORLDS.map((w) => {
          const ts = TOPICS.filter((t) => t.world === w.id);
          const m = ts.length ? ts.reduce((a, t) => a + ready.byTopic[t.id] * t.examCount, 0) / ts.reduce((a, t) => a + t.examCount, 0) : 0;
          return (
            <Link key={w.id} href={`/play?mode=world&world=${w.id}`} className="card flex flex-col items-center gap-1.5 p-3 text-center active:scale-[0.98]">
              <Ring value={m} size={64} stroke={7} color={w.accent}>
                <span className="text-sm font-extrabold">{Math.round(m)}%</span>
              </Ring>
              <span className="text-[11px] font-extrabold leading-tight">{w.title}</span>
              <span className="text-[10px] font-bold text-muted">{w.module}</span>
            </Link>
          );
        })}
      </div>

      <SectionTitle>Topic mastery (blueprint weight)</SectionTitle>
      <div className="card divide-y divide-line">
        {TOPICS.map((t) => (
          <Link key={t.id} href={focusHref(CONCEPTS.filter((c) => c.topic === t.id).map((c) => c.id))} className="block px-4 py-2.5 active:bg-surface-2" data-testid="topic-row">
            <div className="flex justify-between text-sm">
              <span className="font-semibold">{t.title}</span>
              <span className="text-muted">
                {Math.round(ready.byTopic[t.id])}% · {t.min}–{t.max} Qs
              </span>
            </div>
            <Bar value={ready.byTopic[t.id]} color={masteryColor(ready.byTopic[t.id], true)} className="mt-1.5 h-1.5" />
          </Link>
        ))}
      </div>

      <SectionTitle>Knowledge map</SectionTitle>
      <div className="card p-4" data-testid="knowledge-map">
        {WORLDS.map((w) => {
          const cs = CONCEPTS.filter((c) => TOPIC_BY_ID[c.topic].world === w.id);
          return (
            <div key={w.id} className="mb-3 last:mb-0">
              <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-muted">
                W{w.num} · {w.title}
              </p>
              <div className="flex flex-wrap gap-1">
                {cs.map((c) => {
                  const st = s.concepts[c.id];
                  const e = effectiveMastery(st, now);
                  return <Link key={c.id} href={focusHref([c.id])} title={`${c.label}: ${Math.round(e)}%`} aria-label={`Practice ${c.label}`} className="size-5 rounded-[5px]" style={{ background: masteryColor(e, (st?.seen ?? 0) > 0), opacity: st?.seen ? 0.35 + (e / 100) * 0.65 : 1 }} />;
                })}
              </div>
            </div>
          );
        })}
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-semibold text-muted">
          {[
            ["var(--line)", "Unseen"],
            ["#ef4444", "Weak"],
            ["#f59e0b", "Learning"],
            ["#3b82f6", "Strong"],
            ["#10b981", "Mastered"],
          ].map(([c, l]) => (
            <span key={l} className="flex items-center gap-1">
              <span className="size-3 rounded" style={{ background: c }} /> {l}
            </span>
          ))}
        </div>
      </div>

      <SectionTitle>Last 7 days</SectionTitle>
      <div className="card p-4">
        <div className="flex h-28 items-end gap-2">
          {days.map((d) => (
            <div key={d.k} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 flex-col justify-end">
                <div className="w-full rounded-t-md bg-bad/70" style={{ height: `${(d.wrong / maxA) * 100}%` }} title={`${d.wrong} missed`} />
                <div className="w-full rounded-b-md bg-brand" style={{ height: `${((d.answered - d.wrong) / maxA) * 100}%` }} title={`${d.answered - d.wrong} correct`} />
              </div>
              <span className="text-[11px] font-bold text-muted">{d.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          <span className="font-bold text-brand">■</span> correct <span className="ml-2 font-bold text-bad">■</span> missed — the mistake trend
        </p>
      </div>

      <SectionTitle>Accuracy trend</SectionTitle>
      <AccuracyTrend points={trend} />

      <div className="mt-6 grid grid-cols-1 gap-3">
        <div className="card p-4">
          <p className="text-xs font-extrabold uppercase tracking-wider text-bad">Weakest concepts</p>
          {weakest.length === 0 && <p className="mt-2 text-sm text-muted">Answer some questions to see this.</p>}
          <ul className="mt-2 space-y-2">
            {weakest.map((w) => (
              <li key={w.concept.id}>
                <Link href={focusHref([w.concept.id])} className="flex items-center justify-between gap-2 text-sm" data-testid="weak-concept">
                  <span className="min-w-0 truncate">{w.concept.label}</span>
                  <span className="shrink-0 font-bold text-muted">{Math.round(w.mastery)}% →</span>
                </Link>
              </li>
            ))}
          </ul>
          {weakest.length > 0 && (
            <Link href="/play?mode=weak" className="mt-3 inline-block text-sm font-extrabold text-brand">
              Fix these now →
            </Link>
          )}
        </div>
        <div className="card p-4">
          <p className="text-xs font-extrabold uppercase tracking-wider text-good">Strongest concepts</p>
          <ul className="mt-2 space-y-2">
            {strongest.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate">{conceptLabel(c.id)}</span>
                <span className="shrink-0 font-bold text-muted">{Math.round(effectiveMastery(s.concepts[c.id], now))}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <SectionTitle>Confidence calibration</SectionTitle>
      <div className="card p-4">
        {calRows.map((r) => {
          const c = cal[r.k];
          const pct = c.n ? Math.round((c.ok / c.n) * 100) : 0;
          return (
            <div key={r.k} className="mb-2 flex items-center gap-3 text-sm last:mb-0">
              <span className="w-28 shrink-0 font-semibold">
                {r.icon} {r.label}
              </span>
              <Bar value={pct} className="flex-1" color={r.k === "confident" ? "var(--good)" : r.k === "unsure" ? "#f59e0b" : "var(--muted)"} />
              <span className="w-16 shrink-0 text-right text-xs font-bold text-muted">{c.n ? `${pct}% · ${c.n}` : "—"}</span>
            </div>
          );
        })}
        <p className="mt-3 text-xs text-muted">
          {falseConf > 0 ? `False confidence: ${falseConf} answer${falseConf === 1 ? "" : "s"} you were sure about were wrong — those concepts get priority in Weak Spots.` : "When you're confident and right, mastery climbs fastest. Guesses that land right count less."}
        </p>
      </div>

      <SectionTitle>Achievements</SectionTitle>
      <div className="grid grid-cols-3 gap-2" data-testid="achievements">
        {ACHIEVEMENTS.map((a) => {
          const got = !!s.achievements[a.id];
          return (
            <div key={a.id} className={cx("card flex flex-col items-center p-3 text-center", !got && "opacity-45 grayscale")} title={a.desc}>
              <span className="text-2xl">{a.icon}</span>
              <span className="mt-1 text-[11px] font-extrabold leading-tight">{a.name}</span>
              <span className="mt-0.5 text-[10px] leading-tight text-muted">{a.desc}</span>
            </div>
          );
        })}
      </div>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-3 text-center">
      <div className="text-lg font-extrabold">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}
