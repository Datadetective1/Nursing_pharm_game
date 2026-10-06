"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowDown, Lightbulb, Check, X, Sparkles } from "lucide-react";
import type { LessonStep, LessonVisual } from "@/lib/lessons/types";
import { SCALES } from "@/data/activities/generated";
import { BODY } from "@/data/activities/body";
import { CONTRASTS } from "@/data/contrasts";
import { ANTIDOTES } from "@/data/antidotes";
import { HOLD } from "@/lib/explain";
import { getActivity } from "@/data/activities";
import { AntidoteX, BodyX, ClotX, CompareX, GaugeX, HoldX, NephronX, PotassiumX, RaasX, TimelineX } from "@/components/explain/VisualExplainer";
import { SuffixName } from "@/components/activities/FamilyWall";
import { ActivityView } from "@/components/activities/ActivityView";
import { cx, haptic } from "@/components/ui";
import { playSound } from "@/lib/sound";
import type { ActivityOf } from "@/lib/activities/types";

const TAG_LABEL: Record<string, string> = { moa: "How it works", use: "Why it's given", se: "Side effects", ci: "Don't give if…", caution: "Caution", intx: "Interactions", lab: "Labs", hold: "When to hold", antidote: "Antidote", action: "Nursing action", teach: "Patient teaching" };

/** Static visual inside a lesson card (reuses the app's visual explainers). */
export function LessonVisualView({ v }: { v: LessonVisual }) {
  switch (v.kind) {
    case "raas":
      return <RaasX target={v.target} />;
    case "nephron":
      return <NephronX drug={v.drug} />;
    case "clot":
      return <ClotX highlight={v.highlight} />;
    case "gauge": {
      const s = SCALES.find((x) => x.key === v.scale);
      return s ? <GaugeX g={{ ...s, value: v.value ?? null }} interactive={false} /> : null;
    }
    case "body": {
      const b = BODY.find((x) => x.id === v.activity) as ActivityOf<"body"> | undefined;
      return b ? <BodyX acts={b.data.acts} effects={b.data.effects} drug={b.data.drug} /> : null;
    }
    case "timeline":
      return <TimelineX steps={v.steps} />;
    case "potassium":
      return <PotassiumX items={v.items} />;
    case "compare": {
      const c = CONTRASTS.find((x) => x.id === v.set);
      return c ? <CompareX columns={c.columns} rows={c.rows} interactive={false} /> : null;
    }
    case "hold":
      return HOLD[v.concept] ? <HoldX rules={HOLD[v.concept]} /> : null;
    case "antidote": {
      const pairs = ANTIDOTES.filter((a) => v.pairs.includes(a.id));
      return pairs.length ? <AntidoteX pairs={pairs} interactive={false} seed={v.pairs.join()} /> : null;
    }
    case "suffix":
      return (
        <div className="flex flex-wrap gap-2" data-testid="lv-suffix">
          {v.drugs.map((d) => (
            <span key={d.name} className="rounded-xl bg-surface-2 px-3 py-2 text-[16px] font-extrabold">
              <SuffixName name={d.name} suffix={d.suffix} />
            </span>
          ))}
        </div>
      );
    case "icons":
      return (
        <div className="grid grid-cols-3 gap-2" data-testid="lv-icons">
          {v.items.map((it) => (
            <div key={it.label} className="rounded-2xl bg-surface-2 p-2.5 text-center">
              <div className="text-2xl">{it.icon}</div>
              <p className="mt-1 text-[12.5px] font-extrabold leading-tight">{it.label}</p>
              {it.sub && <p className="text-[11px] font-semibold leading-tight text-muted">{it.sub}</p>}
            </div>
          ))}
        </div>
      );
  }
}

function Hook({ text }: { text: string }) {
  return (
    <div className="mt-3 rounded-xl bg-brand-soft p-3 text-[14.5px] leading-snug" data-testid="lesson-hook">
      <span className="font-extrabold text-brand">Memory hook: </span>
      {text}
    </div>
  );
}

/**
 * One lesson screen. `onReady(true)` fires once the learner may continue — immediately for reading
 * screens, after the interaction for tap / check / activity screens.
 */
export function LessonStepView({ step, onReady }: { step: LessonStep; onReady: (ready: boolean) => void }) {
  return (
    <div className="animate-fade-up" data-testid="lesson-step" data-kind={step.kind} data-step={step.id}>
      <h2 className="text-[24px] font-extrabold leading-tight tracking-tight" data-testid="lesson-title">
        {step.title}
      </h2>
      <StepBody step={step} onReady={onReady} />
      <p className="mt-4 text-[11px] text-muted" data-testid="lesson-source">
        Source: {step.source}
      </p>
    </div>
  );
}

function StepBody({ step, onReady }: { step: LessonStep; onReady: (ready: boolean) => void }) {
  switch (step.kind) {
    case "meet":
      return (
        <>
          <p className="mt-2 text-[16px] leading-relaxed">{step.say}</p>
          <div className="mt-4 flex flex-col gap-2">
            {step.drugs.map((d, i) => (
              <motion.div key={d.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.12 }} className="card flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-[19px] font-extrabold">{d.suffix ? <SuffixName name={d.name} suffix={d.suffix} /> : d.name}</span>
                {d.note && <span className="text-right text-[12.5px] font-semibold text-muted">{d.note}</span>}
              </motion.div>
            ))}
          </div>
          {step.hook && <Hook text={step.hook} />}
        </>
      );
    case "idea":
      return (
        <>
          {step.tag && <p className="mt-1 text-[11px] font-extrabold uppercase tracking-wider text-brand">{TAG_LABEL[step.tag] ?? step.tag}</p>}
          <p className="mt-2 text-[16px] leading-relaxed">{step.say}</p>
          {step.visual && (
            <div className="mt-3 rounded-2xl bg-surface p-3" data-testid="lesson-visual" data-visual={step.visual.kind}>
              <LessonVisualView v={step.visual} />
            </div>
          )}
          {step.points && (
            <ul className="mt-3 flex flex-col gap-2">
              {step.points.map((p, i) => (
                <motion.li key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.12 }} className="flex items-start gap-2.5 rounded-xl bg-surface-2 px-3 py-2.5 text-[15px] font-semibold leading-snug">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" />
                  {p}
                </motion.li>
              ))}
            </ul>
          )}
          {step.hook && <Hook text={step.hook} />}
        </>
      );
    case "chain":
      return (
        <>
          {step.say && <p className="mt-2 text-[16px] leading-relaxed">{step.say}</p>}
          <div className="mt-3 flex flex-col items-stretch" data-testid="lesson-chain">
            {step.links.map((l, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.35 }}>
                {i > 0 && (
                  <div className="flex justify-center py-1 text-brand">
                    <ArrowDown size={18} />
                  </div>
                )}
                <div className={cx("rounded-2xl border-2 px-4 py-3", i === step.links.length - 1 ? "border-brand/40 bg-brand-soft" : "border-line bg-surface")}>
                  <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-muted">{l.label}</p>
                  <p className="text-[15.5px] font-bold leading-snug">{l.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
          {step.hook && <Hook text={step.hook} />}
        </>
      );
    case "tap":
      return <TapStep step={step} onReady={onReady} />;
    case "numbers":
      return (
        <>
          {step.say && <p className="mt-2 text-[16px] leading-relaxed">{step.say}</p>}
          <div className={cx("mt-3 grid gap-2", step.items.length === 1 ? "grid-cols-1" : "grid-cols-2")} data-testid="lesson-numbers">
            {step.items.map((it, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.12 }}
                className={cx("rounded-2xl border-2 p-3", it.tone === "bad" ? "border-bad/40 bg-bad-soft" : it.tone === "good" ? "border-good/40 bg-good-soft" : it.tone === "warn" ? "border-warn/40 bg-warn-soft" : "border-line bg-surface", step.items.length === 3 && i === 2 && "col-span-2")}
              >
                <p className="text-[20px] font-black leading-tight">{it.value}</p>
                <p className="mt-0.5 text-[13px] font-semibold leading-snug text-muted">{it.label}</p>
              </motion.div>
            ))}
          </div>
          {step.hook && <Hook text={step.hook} />}
        </>
      );
    case "check":
      return <CheckStep step={step} onReady={onReady} />;
    case "activity":
      return <ActivityStep step={step} onReady={onReady} />;
  }
}

function TapStep({ step, onReady }: { step: Extract<LessonStep, { kind: "tap" }>; onReady: (r: boolean) => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const last = picked.length ? step.targets.find((t) => t.label === picked[picked.length - 1]) : undefined;
  const tap = (label: string) => {
    if (done || picked.includes(label)) return;
    const t = step.targets.find((x) => x.label === label)!;
    setPicked((p) => [...p, label]);
    if (t.correct) {
      setDone(true);
      onReady(true);
      playSound("correct");
      haptic(12);
    } else {
      playSound("wrong");
      haptic([20, 30, 20]);
    }
  };
  return (
    <>
      <p className="mt-2 text-[16px] leading-relaxed">{step.say}</p>
      <p className="mt-3 text-[13px] font-extrabold uppercase tracking-wider text-brand">{step.prompt}</p>
      <div className={cx("mt-2 grid gap-2", step.targets.length > 3 ? "grid-cols-2" : "grid-cols-1")} data-testid="lesson-tap">
        {step.targets.map((t) => {
          const was = picked.includes(t.label);
          const right = was && t.correct;
          const wrong = was && !t.correct;
          return (
            <motion.button
              key={t.label}
              onClick={() => tap(t.label)}
              animate={wrong ? { x: [0, -6, 6, -3, 0] } : right ? { scale: [1, 1.04, 1] } : {}}
              disabled={done && !right}
              className={cx("flex min-h-14 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-[15.5px] font-extrabold transition-colors", right ? "border-good bg-good-soft text-good" : wrong ? "border-warn/60 bg-warn-soft text-muted" : "border-line bg-surface active:scale-[0.99]")}
              data-testid="tap-target"
              data-correct={String(t.correct)}
            >
              {t.icon && <span className="text-2xl">{t.icon}</span>}
              <span className="flex-1">{t.label}</span>
              {right && <Check size={18} />}
              {wrong && <X size={18} />}
            </motion.button>
          );
        })}
      </div>
      {last && !done && (
        <p className="mt-2 rounded-xl bg-warn-soft px-3 py-2 text-[14px] font-semibold leading-snug" data-testid="tap-why">
          {last.why} Try again.
        </p>
      )}
      {done && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-2xl border-2 border-good/40 bg-good-soft p-3" data-testid="tap-reveal">
          <p className="text-[14.5px] font-semibold leading-snug">
            <span className="font-extrabold text-good">{last?.why} </span>
            {step.reveal}
          </p>
        </motion.div>
      )}
    </>
  );
}

function CheckStep({ step, onReady }: { step: Extract<LessonStep, { kind: "check" }>; onReady: (r: boolean) => void }) {
  const [wrong, setWrong] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const pick = (i: number) => {
    if (done || wrong.includes(i)) return;
    if (i === step.answer) {
      setDone(true);
      onReady(true);
      playSound("correct");
      haptic(12);
    } else {
      setWrong((w) => [...w, i]);
      playSound("wrong");
    }
  };
  const hl = useMemo(() => Object.fromEntries((step.highlight ?? []).map((h) => [h.name, h.suffix])), [step.highlight]);
  const showHl = wrong.length > 0 || done;
  return (
    <>
      <p className="mt-1 text-[11px] font-extrabold uppercase tracking-wider text-brand">Guided practice · no penalty</p>
      <p className="mt-2 text-[18px] font-bold leading-snug">{step.prompt}</p>
      <div className="mt-3 flex flex-col gap-2" data-testid="lesson-check">
        {step.options.map((o, i) => {
          const isWrong = wrong.includes(i);
          const isRight = done && i === step.answer;
          return (
            <button
              key={o}
              onClick={() => pick(i)}
              disabled={isWrong || (done && !isRight)}
              className={cx("flex min-h-14 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-[16px] font-bold", isRight ? "border-good bg-good-soft" : isWrong ? "border-dashed border-line opacity-55" : "border-line bg-surface active:scale-[0.99]")}
              data-testid="check-option"
              data-correct={String(i === step.answer)}
            >
              <span className={cx(isWrong && "line-through")}>{showHl && hl[o] ? <SuffixName name={o} suffix={hl[o]} /> : o}</span>
              {isRight && <Check size={18} className="ml-auto text-good" />}
            </button>
          );
        })}
      </div>
      {wrong.length > 0 && !done && (
        <p className="mt-2 flex items-start gap-2 rounded-xl bg-warn-soft px-3 py-2 text-[14.5px] font-semibold leading-snug" data-testid="check-hint">
          <Lightbulb size={17} className="mt-0.5 shrink-0 text-warn" /> {step.hint}
        </p>
      )}
      {done && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 flex items-start gap-2 rounded-2xl border-2 border-good/40 bg-good-soft p-3 text-[14.5px] font-semibold leading-snug" data-testid="check-why">
          <Sparkles size={17} className="mt-0.5 shrink-0 text-good" /> {step.why}
        </motion.p>
      )}
    </>
  );
}

function ActivityStep({ step, onReady }: { step: Extract<LessonStep, { kind: "activity" }>; onReady: (r: boolean) => void }) {
  const act = useMemo(() => getActivity(step.activity), [step.activity]);
  const [done, setDone] = useState(false);
  if (!act) return null;
  return (
    <>
      {step.say && <p className="mt-2 text-[16px] leading-relaxed">{step.say}</p>}
      <div className="mt-3" data-testid="lesson-activity">
        <ActivityView
          act={act}
          onDone={() => {
            setDone(true);
            onReady(true);
          }}
        />
      </div>
      {!done && (
        <button onClick={() => onReady(true)} className="mx-auto mt-3 flex min-h-11 items-center rounded-full px-4 text-[13px] font-bold text-muted" data-testid="activity-skip-lesson">
          Skip this one
        </button>
      )}
    </>
  );
}

/** Steps that require an interaction before Continue. */
export const needsInteraction = (s: LessonStep) => s.kind === "tap" || s.kind === "check" || s.kind === "activity";
