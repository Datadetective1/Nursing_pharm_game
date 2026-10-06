"use client";

import Link from "next/link";
import { Zap, Brain, Archive, FlaskConical, Lock, Shuffle, Calculator, Timer, Sparkles, Layers, BookOpen, ChevronRight } from "lucide-react";
import { Screen, cx, SectionTitle } from "@/components/ui";
import { useStore } from "@/lib/store";
import { WORLDS } from "@/data/curriculum";
import { VISUAL_LABS } from "@/data/visualLabs";

const MODES = [
  { href: "/play?mode=quick5", title: "Quick 5", sub: "Five fast retrievals", icon: Zap, tone: "from-amber-400 to-orange-500", id: "quick5" },
  { href: "/play?mode=weak", title: "Weak Spots", sub: "Fix what's shaky", icon: Brain, tone: "from-rose-500 to-pink-500", id: "weak" },
  { href: "/vault", title: "Mistake Vault", sub: "Retry your misses", icon: Archive, tone: "from-slate-600 to-slate-800", id: "vault" },
  { href: "/arena", title: "Antidote Arena", sub: "Drug → antidote, fast", icon: FlaskConical, tone: "from-emerald-500 to-teal-600", id: "arena" },
  { href: "/lab", title: "Lab Lock", sub: "Labs · ranges · action", icon: Lock, tone: "from-cyan-500 to-blue-600", id: "lab" },
  { href: "/contrast", title: "Don't Mix These Up", sub: "Look-alike drugs", icon: Shuffle, tone: "from-violet-500 to-fuchsia-500", id: "contrast" },
  { href: "/dojo", title: "Dosage Dojo", sub: "All 7 calc types", icon: Calculator, tone: "from-lime-500 to-emerald-600", id: "dojo" },
  { href: "/rapid", title: "Rapid Review", sub: "Night-before sprint", icon: Timer, tone: "from-indigo-500 to-brand", id: "rapid" },
];

export default function PracticePage() {
  const open = useStore((s) => Object.values(s.mistakes).filter((m) => !m.resolved).length);
  return (
    <Screen>
      <h1 className="text-[26px] font-extrabold tracking-tight">Practice</h1>
      <p className="text-sm text-muted">Pick a mode. Every answer feeds your mastery map.</p>

      <Link href="/library" className="card mt-4 flex items-center gap-4 p-4 transition-transform active:scale-[0.99]" data-testid="practice-library">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-2 text-white shadow-md">
          <BookOpen size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-extrabold leading-tight">Study by Drug Type</span>
          <span className="block text-xs text-muted">Pick a module, class or drug · Learn → Practice → Test</span>
        </span>
        <ChevronRight size={18} className="shrink-0 text-muted" />
      </Link>

      <Link href="/visual" className="relative mt-3 block overflow-hidden rounded-3xl bg-gradient-to-br from-[#2b1f7a] via-brand to-fuchsia-500 p-5 text-white shadow-xl" data-testid="visual-labs">
        <div className="absolute -right-8 -top-8 size-36 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 right-10 size-24 rounded-full bg-white/10" />
        <p className="text-xs font-extrabold uppercase tracking-widest text-white/80">New · {VISUAL_LABS.length} hands-on labs</p>
        <p className="mt-1 text-2xl font-extrabold leading-tight">Visual Labs</p>
        <p className="mt-1 max-w-[16rem] text-sm text-white/85">Drag, sort, trace and rescue: Clotting Lab, Antidote Rescue, RAAS, nephron, lab gauges, simulations…</p>
        <div className="mt-3 flex gap-1.5 text-xl">
          {VISUAL_LABS.slice(0, 8).map((l) => (
            <span key={l.slug} className="grid size-9 place-items-center rounded-xl bg-white/15">
              {l.icon}
            </span>
          ))}
        </div>
      </Link>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {["clot", "rescue", "family", "gauge"].map((slug) => {
          const l = VISUAL_LABS.find((x) => x.slug === slug)!;
          return (
            <Link key={slug} href={`/visual/play?lab=${slug}&back=/practice`} className="card flex flex-col items-center gap-1 p-2.5 text-center" data-testid={`quick-lab-${slug}`}>
              <span className="text-2xl">{l.icon}</span>
              <span className="text-[10.5px] font-extrabold leading-tight">{l.title}</span>
            </Link>
          );
        })}
      </div>
      <SectionTitle>Modes</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {MODES.map((m) => (
          <Link key={m.id} href={m.href} className="card relative flex min-h-36 flex-col justify-between overflow-hidden p-4 transition-transform active:scale-[0.98]" data-testid={`mode-${m.id}`}>
            <span className={cx("grid size-11 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-md", m.tone)}>
              <m.icon size={22} />
            </span>
            <span>
              <span className="block font-extrabold leading-tight">{m.title}</span>
              <span className="block text-xs text-muted">{m.id === "vault" ? `${open} open mistake${open === 1 ? "" : "s"}` : m.sub}</span>
            </span>
          </Link>
        ))}
      </div>

      <SectionTitle>Focused drills</SectionTitle>
      <Link href="/play?mode=highyield" className="card flex items-center gap-3 p-4">
        <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-amber-400 text-white">
          <Sparkles size={20} />
        </span>
        <span>
          <span className="block font-extrabold">High-Yield Sprint</span>
          <span className="block text-xs text-muted">10 exam-format questions on antidotes, holds, labs, priorities</span>
        </span>
      </Link>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {WORLDS.filter((w) => w.id !== "w1").map((w) => (
          <Link key={w.id} href={`/play?mode=world&world=${w.id}`} className={cx("relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-md", w.gradient)}>
            <Layers size={18} className="opacity-80" />
            <span className="mt-2 block text-xs font-bold uppercase tracking-wider text-white/80">World {w.num}</span>
            <span className="block font-extrabold leading-tight">{w.title}</span>
          </Link>
        ))}
      </div>
    </Screen>
  );
}
