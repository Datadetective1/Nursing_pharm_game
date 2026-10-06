"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, Gauge } from "lucide-react";
import { useStore, type DailyMinutes, type StartConfidence } from "@/lib/store";
import { dayKey } from "@/lib/engine/progress";
import { Button, cx } from "./ui";

const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return dayKey(d);
};

export function Onboarding() {
  const router = useRouter();
  const complete = useStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const [examDate, setExamDate] = useState<string | null>(addDays(3));
  const [minutes, setMinutes] = useState<DailyMinutes>(10);
  const [conf, setConf] = useState<StartConfidence>("somewhat");

  const finish = () => {
    complete({ examDate, dailyMinutes: minutes, startConfidence: conf });
    router.push("/play?mode=mission");
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-8 pt-[max(env(safe-area-inset-top),28px)]" data-testid="onboarding">
      <div className="flex items-center gap-2">
        <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-2 text-xl text-white">💊</div>
        <div>
          <p className="text-lg font-extrabold leading-none tracking-tight">Pharm Quest</p>
          <p className="text-xs font-semibold text-muted">Master the meds. Beat the exam.</p>
        </div>
      </div>
      <div className="mt-6 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cx("h-1.5 flex-1 rounded-full transition-colors", i <= step ? "bg-brand" : "bg-line")} />
        ))}
      </div>

      <div key={step} className="mt-8 flex-1 animate-fade-up">
        {step === 0 && (
          <>
            <CalendarDays className="text-brand" size={32} />
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight">When is your exam?</h1>
            <p className="mt-1 text-muted">We&apos;ll pace your missions to the day.</p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {[
                ["Tomorrow", 1],
                ["In 2 days", 2],
                ["In 3 days", 3],
                ["In 5 days", 5],
                ["In a week", 7],
              ].map(([label, n]) => (
                <button
                  key={label}
                  onClick={() => setExamDate(addDays(n as number))}
                  className={cx("min-h-14 rounded-2xl border-2 font-bold", examDate === addDays(n as number) ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface")}
                >
                  {label}
                </button>
              ))}
              <button onClick={() => setExamDate(null)} className={cx("min-h-14 rounded-2xl border-2 font-bold", examDate === null ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface")}>
                Not sure
              </button>
            </div>
            <label className="mt-4 block text-sm font-bold text-muted">
              Or pick a date
              <input
                type="date"
                value={examDate ?? ""}
                min={dayKey()}
                onChange={(e) => setExamDate(e.target.value || null)}
                className="mt-1 block min-h-14 w-full rounded-2xl border-2 border-line bg-surface px-4 text-base font-bold text-ink"
                data-testid="exam-date"
              />
            </label>
          </>
        )}
        {step === 1 && (
          <>
            <Clock className="text-brand" size={32} />
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight">How much time can you study today?</h1>
            <p className="mt-1 text-muted">Short sessions work. Really.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {([5, 10, 20, 30] as DailyMinutes[]).map((m) => (
                <button
                  key={m}
                  data-testid={`minutes-${m}`}
                  onClick={() => setMinutes(m)}
                  className={cx("min-h-24 rounded-2xl border-2 text-left px-4", minutes === m ? "border-brand bg-brand-soft" : "border-line bg-surface")}
                >
                  <span className={cx("block text-3xl font-extrabold", minutes === m && "text-brand")}>
                    {m}
                    {m === 30 ? "+" : ""}
                  </span>
                  <span className="text-sm font-semibold text-muted">minutes</span>
                </button>
              ))}
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <Gauge className="text-brand" size={32} />
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight">How confident do you feel right now?</h1>
            <p className="mt-1 text-muted">No wrong answer — this just sets your starting point.</p>
            <div className="mt-6 flex flex-col gap-3">
              {(
                [
                  ["not", "Not ready", "😬"],
                  ["somewhat", "Somewhat ready", "🙂"],
                  ["almost", "Almost ready", "😎"],
                ] as [StartConfidence, string, string][]
              ).map(([k, label, icon]) => (
                <button
                  key={k}
                  data-testid={`conf-${k}`}
                  onClick={() => setConf(k)}
                  className={cx("flex min-h-16 items-center gap-3 rounded-2xl border-2 px-4 text-left text-lg font-bold", conf === k ? "border-brand bg-brand-soft" : "border-line bg-surface")}
                >
                  <span className="text-2xl">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-8 grid gap-2">
        {step < 2 ? (
          <Button onClick={() => setStep(step + 1)} data-testid="onboard-next">
            Next
          </Button>
        ) : (
          <Button onClick={finish} data-testid="onboard-start">
            Start my first mission
          </Button>
        )}
        {step > 0 && (
          <Button variant="ghost" size="md" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
      </div>
    </div>
  );
}
