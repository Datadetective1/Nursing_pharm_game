"use client";

import Link from "next/link";
import { Zap, Brain, Archive, FlaskConical, Lock, Shuffle, Calculator, Timer, Sparkles, Layers } from "lucide-react";
import { Screen, cx, SectionTitle } from "@/components/ui";
import { useStore } from "@/lib/store";
import { WORLDS } from "@/data/curriculum";

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
      <div className="mt-5 grid grid-cols-2 gap-3">
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
