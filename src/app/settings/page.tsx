"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight, Download, Upload } from "lucide-react";
import { Screen, TopBar, Button, cx, SectionTitle } from "@/components/ui";
import { useStore, type DailyMinutes } from "@/lib/store";
import { dayKey } from "@/lib/engine/progress";

export default function SettingsPage() {
  const profile = useStore((s) => s.profile);
  const settings = useStore((s) => s.settings);
  const updateProfile = useStore((s) => s.updateProfile);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetAll = useStore((s) => s.resetAll);
  const router = useRouter();
  const [confirmReset, setConfirmReset] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const exportData = async () => {
    const raw = localStorage.getItem("pharm-quest-v1") ?? "";
    try {
      await navigator.clipboard.writeText(raw);
      setMsg("Progress copied to clipboard. Paste it into 'Import' on another device.");
    } catch {
      setMsg("Couldn't access the clipboard on this browser.");
    }
  };
  const importData = () => {
    const raw = prompt("Paste exported progress:");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed?.state?.profile) throw new Error("bad");
      localStorage.setItem("pharm-quest-v1", raw);
      location.reload();
    } catch {
      setMsg("That doesn't look like Pharm Quest progress.");
    }
  };

  return (
    <Screen>
      <TopBar back="/" title="Settings" />

      <SectionTitle>Exam</SectionTitle>
      <div className="card p-4">
        <label className="block text-sm font-bold">
          Exam date
          <input
            type="date"
            value={profile.examDate ?? ""}
            min={dayKey()}
            onChange={(e) => updateProfile({ examDate: e.target.value || null })}
            className="mt-1 block min-h-12 w-full rounded-xl border-2 border-line bg-surface px-3 font-bold text-ink"
            data-testid="settings-exam-date"
          />
        </label>
        <p className="mt-4 text-sm font-bold">Daily study time</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {([5, 10, 20, 30] as DailyMinutes[]).map((m) => (
            <button key={m} onClick={() => updateProfile({ dailyMinutes: m })} className={cx("min-h-11 rounded-xl border-2 text-sm font-bold", profile.dailyMinutes === m ? "border-brand bg-brand-soft text-brand" : "border-line")}>
              {m}
              {m === 30 ? "+" : ""} min
            </button>
          ))}
        </div>
      </div>

      <SectionTitle>Experience</SectionTitle>
      <div className="card divide-y divide-line">
        <div className="p-4">
          <p className="text-sm font-bold">Theme</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["system", "light", "dark"] as const).map((t) => (
              <button key={t} onClick={() => updateSettings({ theme: t })} data-testid={`theme-${t}`} className={cx("min-h-11 rounded-xl border-2 text-sm font-bold capitalize", settings.theme === t ? "border-brand bg-brand-soft text-brand" : "border-line")}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <Toggle label="Haptic feedback" sub="Light vibration on answers (Android)" on={settings.haptics} set={(v) => updateSettings({ haptics: v })} />
        <Toggle label="Confidence check-ins" sub="Sometimes ask Guessing / Unsure / Confident" on={settings.confidencePrompts} set={(v) => updateSettings({ confidencePrompts: v })} />
      </div>

      <SectionTitle>Content</SectionTitle>
      <Link href="/sources" className="card flex items-center gap-3 p-4">
        <BookOpen size={20} className="text-brand" />
        <span className="flex-1">
          <span className="block font-bold">Sources & blueprint coverage</span>
          <span className="block text-xs text-muted">What&apos;s covered, where it comes from, known gaps</span>
        </span>
        <ChevronRight className="text-muted" />
      </Link>

      <SectionTitle>Your data</SectionTitle>
      <div className="card p-4">
        <p className="text-sm text-muted">Progress is saved on this device only — no account needed.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button size="md" variant="secondary" onClick={exportData}>
            <Download size={16} /> Export
          </Button>
          <Button size="md" variant="secondary" onClick={importData}>
            <Upload size={16} /> Import
          </Button>
        </div>
        {msg && <p className="mt-2 text-xs font-semibold text-brand">{msg}</p>}
        {!confirmReset ? (
          <Button size="md" variant="ghost" className="mt-3 w-full text-bad" onClick={() => setConfirmReset(true)}>
            Reset all progress
          </Button>
        ) : (
          <div className="mt-3 rounded-xl bg-bad-soft p-3">
            <p className="text-sm font-bold text-bad">Erase all XP, mastery, mistakes and history?</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button size="md" variant="secondary" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
              <Button
                size="md"
                variant="bad"
                onClick={() => {
                  resetAll();
                  try {
                    localStorage.removeItem("pq-exam-live");
                  } catch {}
                  router.push("/");
                }}
              >
                Erase
              </Button>
            </div>
          </div>
        )}
      </div>
      <p className="mt-6 text-center text-xs text-muted">Pharm Quest · built for NURS 3365 Exam 2 · Fall 2026</p>
    </Screen>
  );
}

function Toggle({ label, sub, on, set }: { label: string; sub: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 p-4">
      <span>
        <span className="block text-sm font-bold">{label}</span>
        <span className="block text-xs text-muted">{sub}</span>
      </span>
      <button role="switch" aria-checked={on} onClick={() => set(!on)} className={cx("relative h-7 w-12 shrink-0 rounded-full transition-colors", on ? "bg-brand" : "bg-line")}>
        <span className={cx("absolute top-1 size-5 rounded-full bg-white shadow transition-all", on ? "left-6" : "left-1")} />
      </button>
    </label>
  );
}
