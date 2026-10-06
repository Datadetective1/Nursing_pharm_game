"use client";

import { useMemo, useState } from "react";
import { Check, X, RotateCcw } from "lucide-react";
import type { Question } from "@/lib/types";
import type { Response } from "@/lib/engine/grade";
import type { Confidence } from "@/lib/engine/mastery";
import { shuffle } from "@/lib/rng";
import { Button, cx, haptic } from "./ui";
import { UNIT_CHOICES } from "@/data/calc";

export const FORMAT_LABEL: Record<string, string> = {
  definition: "Concept check",
  antidote: "Antidote",
  lab: "Labs",
  "lab-interpretation": "Lab interpretation",
  "side-effect": "Side effects",
  contraindication: "Contraindication",
  interaction: "Interaction",
  "nursing-action": "Nursing action",
  "first-action": "Priority · First action",
  "question-order": "Question the order",
  teaching: "Patient teaching",
  case: "Clinical case",
  "class-id": "Name that class",
  contrast: "Don't mix these up",
  why: "Why?",
  calc: "Dosage calc",
};

const TYPE_LABEL: Record<string, string> = {
  mcq: "Multiple choice",
  sata: "Select all that apply",
  tf: "True or false",
  fill: "Fill in the blank",
  match: "Match",
  order: "Put in order",
};

interface Props {
  q: Question;
  revealed: boolean;
  askConfidence: boolean;
  onSubmit: (r: Response, confidence?: Confidence) => void;
  /** dojo mode: learner must also pick the unit */
  pickUnit?: boolean;
  /** exam mode: no reveal styling, controlled response */
  examMode?: boolean;
  examResponse?: Response;
  onExamChange?: (r: Response | undefined) => void;
}

export function QuestionView({ q, revealed, askConfidence, onSubmit, pickUnit, examMode, examResponse, onExamChange }: Props) {
  // stable shuffled option order per question
  const order = useMemo(() => {
    if (q.type === "mcq" || q.type === "sata") return shuffle(q.options.map((_, i) => i));
    return [];
  }, [q]);
  const rights = useMemo(() => (q.type === "match" ? shuffle(q.pairs.map((p) => p[1])) : []), [q]);
  const orderItems = useMemo(() => (q.type === "order" ? shuffle(q.items) : []), [q]);
  const unitOptions = useMemo(() => {
    if (q.type !== "fill" || !q.unit) return [];
    const others = shuffle(UNIT_CHOICES.filter((u) => u !== q.unit)).slice(0, 3);
    return shuffle([q.unit, ...others]);
  }, [q]);

  const [choice, setChoice] = useState<number | null>(examResponse?.type === "mcq" ? examResponse.choice : null);
  const [multi, setMulti] = useState<number[]>(examResponse?.type === "sata" ? examResponse.choices : []);
  const [tf, setTf] = useState<boolean | null>(examResponse?.type === "tf" ? examResponse.value : null);
  const [text, setText] = useState(examResponse?.type === "fill" ? examResponse.text : "");
  const [unit, setUnit] = useState<string | undefined>(undefined);
  const [map, setMap] = useState<Record<string, string>>({});
  const [selLeft, setSelLeft] = useState<string | null>(null);
  const [seq, setSeq] = useState<string[]>([]);

  const locked = revealed;

  const build = (): Response | null => {
    switch (q.type) {
      case "mcq":
        return choice === null ? null : { type: "mcq", choice };
      case "sata":
        return multi.length === 0 ? null : { type: "sata", choices: multi };
      case "tf":
        return tf === null ? null : { type: "tf", value: tf };
      case "fill":
        if (!text.trim()) return null;
        if (pickUnit && q.unit && !unit) return null;
        return { type: "fill", text, unit };
      case "match":
        return Object.keys(map).length === q.pairs.length ? { type: "match", map } : null;
      case "order":
        return seq.length === q.items.length ? { type: "order", items: seq } : null;
    }
  };

  const emit = (r: Response | null) => {
    if (examMode) onExamChange?.(r ?? undefined);
  };

  const ready = build() !== null;

  const submit = (conf?: Confidence) => {
    const r = build();
    if (!r) return;
    haptic(10);
    onSubmit(r, conf);
  };

  // ── option styling after reveal
  const optionState = (orig: number): "correct" | "wrong" | "missed" | "neutral" => {
    if (!revealed) return "neutral";
    if (q.type === "mcq") {
      if (orig === q.answer) return "correct";
      if (orig === choice) return "wrong";
      return "neutral";
    }
    if (q.type === "sata") {
      const isAns = q.answers.includes(orig);
      const picked = multi.includes(orig);
      if (isAns && picked) return "correct";
      if (isAns && !picked) return "missed";
      if (!isAns && picked) return "wrong";
    }
    return "neutral";
  };

  return (
    <div className="flex flex-col gap-4" data-testid="question" data-qid={q.id} data-qtype={q.type}>
      {examMode ? (
        // clean, test-like header: no topic/format hints, no difficulty — only the item type an exam would state
        <p className="text-[12px] font-semibold text-muted" data-testid="exam-item-type">
          {q.type === "sata" ? "Select all that apply." : q.type === "order" ? "Place in the correct order." : q.type === "match" ? "Match each item." : q.type === "fill" ? "Fill in the blank." : ""}
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider" data-testid="question-chips">
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-brand">{FORMAT_LABEL[q.format] ?? "Question"}</span>
          <span className="text-muted">{TYPE_LABEL[q.type]}</span>
          <span className="ml-auto flex gap-0.5" aria-label={`difficulty ${q.difficulty} of 3`}>
            {[1, 2, 3].map((d) => (
              <span key={d} className={cx("h-1.5 w-3 rounded-full", d <= q.difficulty ? "bg-xp" : "bg-line")} />
            ))}
          </span>
        </div>
      )}

      <p className="text-[19px] font-bold leading-snug tracking-tight" data-testid="stem">
        {q.type === "tf" ? <span className="mb-1 block text-sm font-extrabold uppercase tracking-wide text-muted">True or false?</span> : null}
        {pickUnit && q.type === "fill" && q.unit ? q.stem.replace(` ____ ${q.unit}`, "") : q.stem}
      </p>

      {/* MCQ */}
      {q.type === "mcq" && (
        <div className="flex flex-col gap-2.5" role="radiogroup">
          {order.map((orig, i) => {
            const st = optionState(orig);
            const sel = choice === orig;
            return (
              <button
                key={orig}
                role="radio"
                aria-checked={sel}
                disabled={locked}
                data-testid="option"
                data-correct={revealed ? String(orig === q.answer) : undefined}
                onClick={() => {
                  setChoice(orig);
                  haptic(6);
                  emit({ type: "mcq", choice: orig });
                }}
                className={cx(
                  "flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-[15px] font-semibold transition-all",
                  st === "correct" && "border-good bg-good-soft",
                  st === "wrong" && "border-warn bg-warn-soft animate-shake",
                  st === "neutral" && (sel ? "border-brand bg-brand-soft" : "border-line bg-surface"),
                  !locked && "active:scale-[0.99]",
                )}
              >
                <span className={cx("grid size-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold", st === "correct" ? "bg-good text-white" : st === "wrong" ? "bg-warn text-bg" : sel ? "bg-brand text-brand-ink" : "bg-surface-2 text-muted")}>
                  {st === "correct" ? <Check size={16} /> : st === "wrong" ? <X size={16} /> : String.fromCharCode(65 + i)}
                </span>
                <span>{q.options[orig]}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* SATA */}
      {q.type === "sata" && (
        <div className="flex flex-col gap-2.5">
          {!revealed && <p className="-mt-1 text-xs font-semibold text-muted">Tap every correct option, then check.</p>}
          {order.map((orig) => {
            const st = optionState(orig);
            const sel = multi.includes(orig);
            return (
              <button
                key={orig}
                role="checkbox"
                aria-checked={sel}
                disabled={locked}
                data-testid="option"
                data-correct={revealed ? String(q.answers.includes(orig)) : undefined}
                onClick={() => {
                  const next = sel ? multi.filter((x) => x !== orig) : [...multi, orig];
                  setMulti(next);
                  haptic(6);
                  emit(next.length ? { type: "sata", choices: next } : null);
                }}
                className={cx(
                  "flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-[15px] font-semibold transition-all",
                  st === "correct" && "border-good bg-good-soft",
                  st === "wrong" && "border-warn bg-warn-soft",
                  st === "missed" && "border-dashed border-good bg-surface",
                  st === "neutral" && (sel ? "border-brand bg-brand-soft" : "border-line bg-surface"),
                )}
              >
                <span className={cx("grid size-6 shrink-0 place-items-center rounded-md border-2", st === "correct" ? "border-good bg-good text-white" : st === "wrong" ? "border-warn bg-warn text-bg" : st === "missed" ? "border-good text-good" : sel ? "border-brand bg-brand text-brand-ink" : "border-line")}>
                  {(sel || st === "missed") && <Check size={14} strokeWidth={3} />}
                </span>
                <span className="flex-1">{q.options[orig]}</span>
                {st === "missed" && <span className="text-[11px] font-bold uppercase text-good">missed</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* TRUE / FALSE */}
      {q.type === "tf" && (
        <div className="grid grid-cols-2 gap-3">
          {[true, false].map((v) => {
            const sel = tf === v;
            const correct = revealed && q.answer === v;
            const wrong = revealed && sel && q.answer !== v;
            return (
              <button
                key={String(v)}
                disabled={locked}
                data-testid="option"
                data-correct={revealed ? String(q.answer === v) : undefined}
                onClick={() => {
                  setTf(v);
                  haptic(6);
                  emit({ type: "tf", value: v });
                }}
                className={cx(
                  "min-h-20 rounded-2xl border-2 text-lg font-extrabold transition-all",
                  correct ? "border-good bg-good-soft text-good" : wrong ? "border-warn bg-warn-soft text-warn animate-shake" : sel ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface",
                )}
              >
                {v ? "True" : "False"}
              </button>
            );
          })}
        </div>
      )}

      {/* FILL */}
      {q.type === "fill" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              data-testid="fill-input"
              value={text}
              disabled={locked}
              inputMode={q.numeric ? "decimal" : "text"}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder={q.numeric ? "Your answer" : "Type your answer"}
              onChange={(e) => {
                setText(e.target.value);
                emit(e.target.value.trim() ? { type: "fill", text: e.target.value } : null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && ready && !askConfidence && !examMode) submit();
              }}
              className={cx(
                "min-h-14 w-full flex-1 rounded-2xl border-2 bg-surface px-4 text-lg font-bold outline-none transition-colors focus:border-brand",
                revealed ? "border-line" : "border-line",
              )}
            />
            {q.unit && !pickUnit && <span className="shrink-0 text-base font-bold text-muted">{q.unit}</span>}
          </div>
          {pickUnit && q.unit && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Units</p>
              <div className="flex flex-wrap gap-2">
                {unitOptions.map((u) => (
                  <button
                    key={u}
                    disabled={locked}
                    data-testid="unit-option"
                    onClick={() => setUnit(u)}
                    className={cx(
                      "min-h-11 rounded-xl border-2 px-4 text-sm font-bold",
                      revealed && u === q.unit ? "border-good bg-good-soft" : revealed && u === unit ? "border-warn bg-warn-soft" : unit === u ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface",
                    )}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MATCH */}
      {q.type === "match" && (
        <div className="flex flex-col gap-3">
          {!revealed && <p className="-mt-1 text-xs font-semibold text-muted">Tap an item on the left, then its match on the right.</p>}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-2">
              {q.pairs.map(([l]) => {
                const matched = map[l];
                const ok = revealed && q.pairs.find((p) => p[0] === l)?.[1] === matched;
                return (
                  <button
                    key={l}
                    disabled={locked}
                    data-testid="match-left"
                    onClick={() => setSelLeft(l)}
                    className={cx(
                      "min-h-14 rounded-xl border-2 px-3 py-2 text-left text-sm font-bold",
                      revealed ? (ok ? "border-good bg-good-soft" : "border-warn bg-warn-soft") : selLeft === l ? "border-brand bg-brand-soft" : matched ? "border-brand/40 bg-surface-2" : "border-line bg-surface",
                    )}
                  >
                    {l}
                    {matched && <span className="mt-1 block text-[11px] font-semibold text-muted">→ {matched}</span>}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col gap-2">
              {rights.map((r) => {
                const usedBy = Object.entries(map).find(([, v]) => v === r)?.[0];
                return (
                  <button
                    key={r}
                    disabled={locked || !selLeft}
                    data-testid="match-right"
                    onClick={() => {
                      if (!selLeft) return;
                      const next = { ...map };
                      for (const k of Object.keys(next)) if (next[k] === r) delete next[k];
                      next[selLeft] = r;
                      setMap(next);
                      setSelLeft(null);
                      haptic(6);
                    }}
                    className={cx("min-h-14 rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold disabled:opacity-100", usedBy ? "border-brand/40 bg-surface-2 text-muted" : "border-line bg-surface", selLeft && !locked && "border-dashed border-brand")}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
          {!revealed && Object.keys(map).length > 0 && (
            <button onClick={() => setMap({})} className="flex items-center gap-1 self-start text-xs font-bold text-muted">
              <RotateCcw size={14} /> Reset pairs
            </button>
          )}
          {revealed && (
            <div className="rounded-xl bg-surface-2 p-3 text-sm">
              {q.pairs.map(([l, r]) => (
                <div key={l} className="flex gap-2 py-0.5">
                  <span className="font-bold">{l}</span>
                  <span className="text-muted">→</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ORDER */}
      {q.type === "order" && (
        <div className="flex flex-col gap-3">
          {!revealed && <p className="-mt-1 text-xs font-semibold text-muted">Tap the steps in the correct order.</p>}
          <ol className="flex flex-col gap-2">
            {seq.map((s, i) => {
              const ok = revealed && q.items[i] === s;
              return (
                <li key={s} className={cx("flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold", revealed ? (ok ? "border-good bg-good-soft" : "border-warn bg-warn-soft") : "border-brand bg-brand-soft")}>
                  <span className="grid size-6 place-items-center rounded-full bg-brand text-xs font-extrabold text-brand-ink">{i + 1}</span>
                  {s}
                </li>
              );
            })}
          </ol>
          {!revealed && (
            <div className="flex flex-col gap-2">
              {orderItems
                .filter((s) => !seq.includes(s))
                .map((s) => (
                  <button key={s} data-testid="order-item" onClick={() => setSeq([...seq, s])} className="min-h-12 rounded-xl border-2 border-dashed border-line bg-surface px-3 py-2 text-left text-sm font-semibold">
                    {s}
                  </button>
                ))}
              {seq.length > 0 && (
                <button onClick={() => setSeq(seq.slice(0, -1))} className="flex items-center gap-1 self-start text-xs font-bold text-muted">
                  <RotateCcw size={14} /> Undo
                </button>
              )}
            </div>
          )}
          {revealed && (
            <div className="rounded-xl bg-surface-2 p-3 text-sm">
              <p className="mb-1 text-xs font-bold uppercase text-muted">Correct order</p>
              {q.items.map((s, i) => (
                <div key={s}>
                  {i + 1}. {s}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COMMIT */}
      {!revealed && !examMode && (
        <div className="sticky bottom-0 -mx-4 mt-2 bg-gradient-to-t from-bg via-bg to-transparent px-4 pb-4 pt-6">
          {askConfidence ? (
            <div>
              <p className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-muted">{ready ? "How confident are you? (locks your answer)" : "Choose an answer, then rate your confidence"}</p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["guess", "Guessing", "🎲"],
                    ["unsure", "Unsure", "🤔"],
                    ["confident", "Confident", "💪"],
                  ] as [Confidence, string, string][]
                ).map(([k, label, icon]) => (
                  <Button key={k} variant="secondary" size="md" disabled={!ready} onClick={() => submit(k)} data-testid={`conf-${k}`} className="min-h-14 flex-col gap-0 text-xs">
                    <span className="text-lg leading-none">{icon}</span>
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <Button className="w-full" disabled={!ready} onClick={() => submit()} data-testid="check">
              Check
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
