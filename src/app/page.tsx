"use client";

import Link from "next/link";
import { VISUAL_LABS, LAB_BY_SLUG } from "@/data/visualLabs";
import { useRouter } from "next/navigation";
import { Flame, Settings, Zap, Target, ChevronRight, CheckCircle2, Swords, Trophy, Brain, AlertTriangle, BookOpen } from "lucide-react";
import { Onboarding } from "@/components/Onboarding";
import { Button, Ring, Screen, cx, SectionTitle, Bar, useNow } from "@/components/ui";
import { useStore } from "@/lib/store";
import { daysUntil, dayKey, displayStreak, levelFromXp, readiness } from "@/lib/engine/progress";
import { continuePlan, currentNode, missionPlan, rankWeakConcepts } from "@/lib/engine/session";
import { isTaught } from "@/lib/engine/learning";
import { effectiveMastery } from "@/lib/engine/mastery";
import { TOPICS, WORLD_BY_ID, CONCEPTS } from "@/data/curriculum";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

const HOME_LABS = ["clot", "rescue", "family", "gauge", "nephron", "sim", "priority", "status"];

export default function HomePage() {
  const router = useRouter();
  const s = useStore();
  const now = useNow();
  if (!s.profile.onboarded) return <Onboarding />;

  const today = dayKey();
  const latestExam = s.exams[0];
  const recentExamPct = latestExam && now - latestExam.at < 3 * 86_400_000 ? (latestExam.correct / latestExam.total) * 100 : undefined;
  const ready = readiness(s.concepts, now, recentExamPct);
  const lvl = levelFromXp(s.xp);
  const streak = displayStreak(s.streak, today);
  const dLeft = daysUntil(s.profile.examDate, today);
  const plan = missionPlan(s.profile.dailyMinutes);
  const missionDone = s.counters.missionDay === today;
  const node = currentNode(s.concepts, now);
  const world = WORLD_BY_ID[node.world];
  const mastered = CONCEPTS.filter((c) => effectiveMastery(s.concepts[c.id], now) >= 80).length;
  const correctQs = Object.values(s.qstats).filter((q) => q.correct > 0).length;
  const seenTopics = TOPICS.filter((t) => CONCEPTS.some((c) => c.topic === t.id && (s.concepts[c.id]?.seen ?? 0) > 0));
  const weakestTopic = seenTopics.length ? seenTopics.reduce((a, b) => (ready.byTopic[a.id] <= ready.byTopic[b.id] ? a : b)) : undefined;
  const weakConcept = rankWeakConcepts(s.concepts, s.mistakes, now).find((r) => r.seen > 0);
  const openMistakes = Object.values(s.mistakes).filter((m) => !m.resolved).length;
  const answeredToday = s.days[today]?.answered ?? 0;
  const smart = node.world !== "w1" ? continuePlan(node.id, node.world, s.concepts, s.learn, s.mistakes, now) : undefined;
  const taughtCount = CONCEPTS.filter((c) => isTaught(s.learn[c.id])).length;

  return (
    <Screen>
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-muted">{greeting()}</p>
          <h1 className="text-[26px] font-extrabold leading-tight tracking-tight">Ready for another round?</h1>
        </div>
        <Link href="/settings" aria-label="Settings" className="-mr-2 grid size-11 place-items-center rounded-full text-muted hover:bg-surface-2">
          <Settings size={22} />
        </Link>
      </header>

      {/* Readiness hero */}
      <section className="mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-[#3b2fb0] via-brand to-brand-2 p-5 text-white shadow-xl" data-testid="readiness-card">
        <div className="flex items-center gap-4">
          <Ring value={ready.overall} size={96} stroke={9} color="#fff" track="rgba(255,255,255,0.22)">
            <div className="text-center">
              <div className="text-2xl font-extrabold leading-none" data-testid="readiness">
                {ready.overall}%
              </div>
              <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-white/80">ready</div>
            </div>
          </Ring>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-white/75">Exam readiness</p>
            <p className="mt-0.5 text-lg font-extrabold leading-snug">
              {dLeft === null ? "Set your exam date" : dLeft > 1 ? `${dLeft} days to Exam 2` : dLeft === 1 ? "Exam 2 is tomorrow" : dLeft === 0 ? "Exam day — you've got this" : "Exam date passed"}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-bold">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1" data-testid="streak">
                <Flame size={13} className={streak ? "fill-amber-300 text-amber-300" : ""} /> {streak} day{streak === 1 ? "" : "s"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1" data-testid="xp">
                <Zap size={13} className="fill-amber-300 text-amber-300" /> {s.xp} XP
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs font-bold text-white/85">
            <span data-testid="level">
              Lv {lvl.level} · {lvl.title}
            </span>
            <span>
              {lvl.into}/{lvl.needed}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-amber-300 transition-all duration-700" style={{ width: `${lvl.progress * 100}%` }} />
          </div>
        </div>
      </section>

      {/* Primary actions */}
      <div className="mt-5 grid gap-3">
        <Button onClick={() => router.push("/play?mode=continue")} className="min-h-16 w-full justify-between text-lg" data-testid="continue-quest">
          <span className="flex flex-col items-start leading-tight">
            <span>CONTINUE QUEST</span>
            <span className="text-xs font-semibold opacity-80" data-testid="continue-plan">
              W{world.num} · {node.title}
              {smart ? (smart.plan.startsWith("Relearn") ? " · Relearn first" : " · New lesson") : ""}
            </span>
          </span>
          <ChevronRight size={26} />
        </Button>
        <Button variant="secondary" onClick={() => router.push("/play?mode=quick5")} className="w-full" data-testid="quick5">
          <Zap size={18} className="text-xp" /> QUICK 5
        </Button>
      </div>

      {/* Today's mission */}
      <button
        onClick={() => router.push("/play?mode=mission")}
        className={cx("card mt-4 flex w-full items-center gap-4 p-4 text-left transition-transform active:scale-[0.99]", missionDone && "border-good/40")}
        data-testid="mission"
      >
        <div className={cx("grid size-14 shrink-0 place-items-center rounded-2xl text-2xl", missionDone ? "bg-good-soft" : "bg-brand-soft")}>{missionDone ? <CheckCircle2 className="text-good" size={28} /> : <Target className="text-brand" size={28} />}</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Today&apos;s Mission {missionDone && "· done ✓"}</p>
          <p className="font-extrabold">
            {plan.minutes} min · {plan.questions} questions <span className="ml-1 whitespace-nowrap rounded-full bg-xp/15 px-2 py-0.5 text-xs text-xp">+{plan.xp} XP</span>
          </p>
          <p className="truncate text-sm text-muted">{missionDone ? "Bonus round? It still counts." : answeredToday ? `${answeredToday} answered today — keep it rolling` : "Adaptive mix weighted to your blueprint"}</p>
        </div>
        <ChevronRight className="text-muted" />
      </button>

      {/* Study by drug type */}
      <Link href="/library" className="card mt-3 flex w-full items-center gap-4 p-4 text-left transition-transform active:scale-[0.99]" data-testid="home-library">
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-soft">
          <BookOpen className="text-brand" size={28} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Drug Library</p>
          <p className="font-extrabold">Study by drug type</p>
          <p className="truncate text-sm text-muted">Learn → Practice → Test · {taughtCount}/{CONCEPTS.length} concepts taught</p>
        </div>
        <ChevronRight className="text-muted" />
      </Link>

      {/* Visual Labs strip */}
      <div className="mt-5 flex items-baseline justify-between">
        <h2 className="text-[13px] font-extrabold uppercase tracking-wider text-muted">Visual Labs</h2>
        <Link href="/visual" className="text-[13px] font-extrabold text-brand" data-testid="home-visual-all">
          All {VISUAL_LABS.length} →
        </Link>
      </div>
      <div className="-mx-4 mt-2 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" data-testid="home-labs">
        {HOME_LABS.map((slug) => {
          const l = LAB_BY_SLUG[slug];
          return (
            <Link key={slug} href={`/visual/play?lab=${slug}&back=/`} className={cx("flex w-28 shrink-0 snap-start flex-col justify-between gap-2 rounded-2xl bg-gradient-to-br p-3 text-white shadow-md active:scale-[0.97]", l.tone)} data-testid={`home-lab-${slug}`}>
              <span className="text-2xl">{l.icon}</span>
              <span className="text-[13px] font-extrabold leading-tight">{l.title}</span>
            </Link>
          );
        })}
      </div>

      {/* Snapshot */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Mastered</p>
          <p className="mt-1 text-2xl font-extrabold" data-testid="mastered-count">
            {mastered}
            <span className="text-base text-muted">/{CONCEPTS.length}</span>
          </p>
          <p className="text-xs text-muted">concepts · {correctQs} questions solved</p>
        </div>
        <Link href={weakConcept ? "/play?mode=weak" : "/quest"} className="card block p-4">
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Weakest topic</p>
          <p className="mt-1 truncate text-lg font-extrabold" data-testid="weakest-topic">
            {weakestTopic ? weakestTopic.short : "—"}
          </p>
          <p className="truncate text-xs text-muted">{weakestTopic ? `${Math.round(ready.byTopic[weakestTopic.id])}% · tap to fix` : "Answer a few to find out"}</p>
        </Link>
      </div>

      <SectionTitle>Jump in</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <QuickTile href="/play?mode=weak" icon={<Brain size={20} />} title="Fix weak spots" sub={weakConcept ? weakConcept.concept.label : "Ranked by your misses"} tone="bg-rose-500" />
        <QuickTile href="/vault" icon={<AlertTriangle size={20} />} title="Mistake Vault" sub={`${openMistakes} to fix`} tone="bg-amber-500" />
        <QuickTile href={`/play?mode=boss&world=${node.world === "w1" ? "w5" : node.world}`} icon={<Swords size={20} />} title="Boss battle" sub={WORLD_BY_ID[node.world === "w1" ? "w5" : node.world].boss?.name ?? ""} tone="bg-slate-800" />
        <QuickTile href="/exam" icon={<Trophy size={20} />} title="Exam simulator" sub={latestExam ? `Last: ${Math.round((latestExam.correct / latestExam.total) * 100)}%` : "50 questions"} tone="bg-brand" />
      </div>

      <SectionTitle>Blueprint focus</SectionTitle>
      <div className="card divide-y divide-line">
        {[...TOPICS]
          .sort((a, b) => b.examCount - a.examCount)
          .slice(0, 4)
          .map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex justify-between text-sm font-bold">
                  <span className="truncate">{t.title}</span>
                  <span className="text-muted">
                    {t.min}–{t.max} Qs
                  </span>
                </div>
                <Bar value={ready.byTopic[t.id]} className="mt-1.5" />
              </div>
            </div>
          ))}
      </div>
    </Screen>
  );
}

function QuickTile({ href, icon, title, sub, tone }: { href: string; icon: React.ReactNode; title: string; sub: string; tone: string }) {
  return (
    <Link href={href} className="card flex flex-col gap-2 p-4 transition-transform active:scale-[0.98]">
      <span className={cx("grid size-9 place-items-center rounded-xl text-white", tone)}>{icon}</span>
      <span className="font-extrabold leading-tight">{title}</span>
      <span className="truncate text-xs text-muted">{sub}</span>
    </Link>
  );
}
