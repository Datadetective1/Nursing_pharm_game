"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { MotionConfig } from "motion/react";
import { useStore, useToasts } from "@/lib/store";

function useHydrated() {
  return useSyncExternalStore(
    (cb) => useStore.persist.onFinishHydration(cb),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
}

function ThemeSync() {
  const theme = useStore((s) => s.settings.theme);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && mq.matches);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);
  return null;
}

function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => dismiss(toasts[0].id), 3200);
    return () => clearTimeout(t);
  }, [toasts, dismiss]);
  if (!toasts.length) return null;
  const t = toasts[0];
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-[max(env(safe-area-inset-top),12px)]">
      <button
        onClick={() => dismiss(t.id)}
        className="pointer-events-auto card animate-pop flex w-full max-w-sm items-center gap-3 px-4 py-3 text-left"
        role="status"
        data-testid="toast"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-2xl shadow-inner">{t.icon ?? "✨"}</span>
        <span className="min-w-0">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-xp">{t.kind === "achievement" ? "Achievement unlocked" : t.kind === "level" ? "Level up" : "Heads up"}</span>
          <span className="block truncate font-bold">{t.title}</span>
          {t.body && <span className="block truncate text-sm text-muted">{t.body}</span>}
        </span>
      </button>
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 1500);
    return () => clearTimeout(t);
  }, []);
  // If storage is unavailable (private mode), zustand still marks hydration finished; fallback after a delay.
  if (!hydrated && !slow) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="flex flex-col items-center gap-3 animate-pop">
          <div className="grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-brand to-brand-2 text-3xl text-white shadow-lg">💊</div>
          <p className="text-sm font-semibold text-muted">Pharm Quest</p>
        </div>
      </div>
    );
  }
  return (
    <MotionConfig reducedMotion="user">
      <ThemeSync />
      <Toaster />
      {children}
    </MotionConfig>
  );
}
