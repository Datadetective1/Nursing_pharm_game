"use client";

import { useRef, useState } from "react";
import { Shuffle, NotebookPen, Sigma } from "lucide-react";
import { Screen, TopBar, cx, useNow } from "@/components/ui";
import { CALC_KINDS, generateCalc, type CalcKind } from "@/data/calc";
import { QuestionView } from "@/components/QuestionView";
import { Feedback } from "@/components/Feedback";
import { isCorrect, responseText, type Response } from "@/lib/engine/grade";
import { useStore } from "@/lib/store";
import { effectiveMastery } from "@/lib/engine/mastery";
import { newSeed } from "@/lib/rng";
import { nowMs } from "@/lib/time";
import type { Question } from "@/lib/types";

type Pick = CalcKind | "mixed";

function gen(kind: Pick): Question {
  const k = kind === "mixed" ? CALC_KINDS[Math.floor(Math.random() * CALC_KINDS.length)].id : kind;
  return generateCalc(k, newSeed());
}

export default function DojoPage() {
  const [kind, setKind] = useState<Pick | null>(null);
  const stats = useStore((s) => s.concepts);
  const now = useNow();
  if (kind) return <Drill kind={kind} onExit={() => setKind(null)} />;
  return (
    <Screen>
      <TopBar back="/practice" title="Dosage Dojo" />
      <div className="rounded-3xl bg-gradient-to-br from-lime-500 to-emerald-700 p-5 text-white shadow-lg">
        <p className="text-4xl">🧮</p>
        <h2 className="mt-2 text-2xl font-extrabold">2–4 calc questions on Exam 2.</h2>
        <p className="mt-1 text-white/85">Fresh numbers every time, same structure. Work it on the scratchpad, enter the number AND the unit.</p>
      </div>
      <button onClick={() => setKind("mixed")} className="card mt-4 flex w-full items-center gap-3 p-4 text-left" data-testid="dojo-mixed">
        <span className="grid size-11 place-items-center rounded-2xl bg-emerald-600 text-white">
          <Shuffle size={20} />
        </span>
        <span className="flex-1">
          <span className="block font-extrabold">Mixed drill</span>
          <span className="block text-xs text-muted">All seven blueprint types, interleaved</span>
        </span>
      </button>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {CALC_KINDS.map((k) => {
          const m = effectiveMastery(stats[k.id], now);
          return (
            <button key={k.id} onClick={() => setKind(k.id)} className="card flex flex-col items-start gap-1 p-4 text-left" data-testid={`dojo-${k.id}`}>
              <span className="text-base font-extrabold">{k.title}</span>
              <span className="text-xs text-muted">{k.blurb}</span>
              <span className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${m}%` }} />
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted">Formulas from your Memory Aid: lb ÷ 2.2 = kg · g→mg ×1000 · mg→mcg ×1000 · mL/hr = volume ÷ hours · units/hr ÷ concentration = mL/hr · gtts/min = (mL/hr × drop factor) ÷ 60, round to whole · safe dose: range first, then compare. Practice numbers only.</p>
    </Screen>
  );
}

function Drill({ kind, onExit }: { kind: Pick; onExit: () => void }) {
  const [q, setQ] = useState<Question>(() => gen(kind));
  const [n, setN] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [last, setLast] = useState<{ ok: boolean; chosen: string; xp: number } | null>(null);
  const [score, setScore] = useState({ ok: 0, total: 0, streak: 0 });
  const [pad, setPad] = useState("");
  const [showFormula, setShowFormula] = useState(false);
  const [sessionId] = useState(() => `dojo-${Date.now()}`);
  const shown = useRef(0);
  const info = CALC_KINDS.find((k) => k.id === q.concept);

  const submit = (r: Response) => {
    let ok = isCorrect(q, r);
    // in the dojo the unit must also be right
    if (q.type === "fill" && q.unit && r.type === "fill" && r.unit !== q.unit) ok = false;
    const chosen = responseText(q, r);
    const st = ok ? score.streak + 1 : 0;
    const res = useStore.getState().recordAnswer({ q, correct: ok, responseText: chosen, ms: shown.current ? nowMs() - shown.current : 0, mode: "dojo", sessionId, sessionStreak: st });
    setScore({ ok: score.ok + (ok ? 1 : 0), total: score.total + 1, streak: st });
    setLast({ ok, chosen, xp: res.xp });
    setRevealed(true);
  };

  const next = () => {
    setQ(gen(kind));
    setN((x) => x + 1);
    setRevealed(false);
    setLast(null);
    setPad("");
    setShowFormula(false);
    shown.current = nowMs();
    window.scrollTo({ top: 0 });
  };

  return (
    <Screen nav={false}>
      <TopBar
        onClose={onExit}
        title={kind === "mixed" ? "Mixed drill" : info?.title}
        right={
          <span className="text-sm font-extrabold text-good" data-testid="dojo-score">
            {score.ok}/{score.total}
          </span>
        }
      />
      <div key={n} className="animate-fade-up">
        <QuestionView q={q} revealed={revealed} askConfidence={false} onSubmit={(r) => submit(r)} pickUnit />
      </div>

      {!revealed && (
        <div className="mt-3 grid gap-3">
          <button onClick={() => setShowFormula((v) => !v)} className="flex items-center gap-2 self-start text-sm font-bold text-brand">
            <Sigma size={16} /> {showFormula ? "Hide formula" : "Need the formula? (try without first)"}
          </button>
          {showFormula && info && <p className="rounded-xl bg-brand-soft p-3 text-sm font-semibold">{info.formula}</p>}
          <label className="block">
            <span className="mb-1 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-muted">
              <NotebookPen size={14} /> Scratchpad
            </span>
            <textarea
              value={pad}
              onChange={(e) => setPad(e.target.value)}
              rows={4}
              placeholder="Work it out here…"
              className="w-full rounded-2xl border-2 border-line bg-surface p-3 font-mono text-[15px] outline-none focus:border-brand"
              data-testid="scratchpad"
            />
          </label>
        </div>
      )}

      {revealed && last && (
        <div className="mt-4">
          <Feedback q={q} correct={last.ok} chosenText={last.chosen} xp={last.xp} onNext={next} nextLabel="Next problem" />
          {pad && (
            <div className={cx("mt-3 rounded-2xl bg-surface-2 p-3")}>
              <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Your work</p>
              <pre className="mt-1 whitespace-pre-wrap font-mono text-sm">{pad}</pre>
            </div>
          )}
        </div>
      )}
    </Screen>
  );
}
