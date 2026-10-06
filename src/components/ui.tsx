"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, Home, Map, Dumbbell, BarChart3, GraduationCap, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";

/** Current time for render-time calculations (refreshes every minute). */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function haptic(pattern: number | number[] = 12) {
  try {
    if (useStore.getState().settings.haptics && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}

export function Screen({ children, nav = true, className }: { children: ReactNode; nav?: boolean; className?: string }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <main className={cx("flex-1 px-4 pt-[max(env(safe-area-inset-top),16px)]", nav ? "pb-28" : "pb-8", className)}>{children}</main>
      {nav && <BottomNav />}
    </div>
  );
}

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/quest", label: "Quest", icon: Map },
  { href: "/practice", label: "Practice", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/exam", label: "Exam", icon: GraduationCap },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 backdrop-blur-xl pb-safe" aria-label="Main">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cx("flex flex-col items-center gap-0.5 pt-2.5 pb-1 text-[11px] font-semibold transition-colors", active ? "text-brand" : "text-muted")}
              aria-current={active ? "page" : undefined}
            >
              <span className={cx("grid h-8 w-12 place-items-center rounded-full transition-all", active && "bg-brand-soft")}>
                <Icon size={21} strokeWidth={active ? 2.4 : 2} />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function TopBar({ title, back, right, onClose }: { title?: ReactNode; back?: string | true; right?: ReactNode; onClose?: () => void }) {
  const router = useRouter();
  return (
    <div className="mb-4 flex min-h-11 items-center gap-2">
      {back && (
        <button
          aria-label="Back"
          onClick={() => (back === true ? router.back() : router.push(back))}
          className="-ml-2 grid size-11 place-items-center rounded-full text-ink hover:bg-surface-2"
        >
          <ChevronLeft size={24} />
        </button>
      )}
      {onClose && (
        <button aria-label="Close" onClick={onClose} className="-ml-2 grid size-11 place-items-center rounded-full text-muted hover:bg-surface-2">
          <X size={22} />
        </button>
      )}
      <h1 className="min-w-0 flex-1 truncate text-lg font-extrabold tracking-tight">{title}</h1>
      {right}
    </div>
  );
}

type BtnVariant = "primary" | "secondary" | "ghost" | "good" | "bad" | "dark";

export function Button({
  children,
  variant = "primary",
  className,
  size = "lg",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "md" | "lg" }) {
  const styles: Record<BtnVariant, string> = {
    primary: "bg-brand text-brand-ink shadow-[0_6px_0_-1px_color-mix(in_srgb,var(--brand)_55%,black)] active:translate-y-[3px] active:shadow-[0_3px_0_-1px_color-mix(in_srgb,var(--brand)_55%,black)]",
    secondary: "bg-surface text-ink border border-line shadow-[0_4px_0_-1px_var(--line)] active:translate-y-[2px] active:shadow-[0_2px_0_-1px_var(--line)]",
    ghost: "text-brand hover:bg-brand-soft",
    good: "bg-good text-white shadow-[0_6px_0_-1px_color-mix(in_srgb,var(--good)_55%,black)] active:translate-y-[3px] active:shadow-none",
    bad: "bg-bad text-white shadow-[0_6px_0_-1px_color-mix(in_srgb,var(--bad)_55%,black)] active:translate-y-[3px] active:shadow-none",
    dark: "bg-ink text-bg active:translate-y-[2px]",
  };
  return (
    <button
      {...rest}
      className={cx(
        "inline-flex select-none items-center justify-center gap-2 rounded-2xl font-extrabold tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:active:translate-y-0",
        size === "lg" ? "min-h-14 px-6 text-base" : "min-h-11 px-4 text-sm",
        styles[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function LinkButton({ href, children, variant = "primary", className, size = "lg" }: { href: string; children: ReactNode; variant?: BtnVariant; className?: string; size?: "md" | "lg" }) {
  const router = useRouter();
  return (
    <Button variant={variant} size={size} className={className} onClick={() => router.push(href)}>
      {children}
    </Button>
  );
}

export function Ring({ value, size = 64, stroke = 7, color = "var(--brand)", track = "var(--line)", children }: { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * v) / 100}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function Bar({ value, color = "var(--brand)", className }: { value: number; color?: string; className?: string }) {
  return (
    <div className={cx("h-2.5 w-full overflow-hidden rounded-full bg-surface-2", className)}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-bold text-muted", className)}>{children}</span>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-2 mt-6 flex items-end justify-between">
      <h2 className="text-[13px] font-extrabold uppercase tracking-wider text-muted">{children}</h2>
      {right}
    </div>
  );
}

export function masteryColor(m: number, seen = true) {
  if (!seen) return "var(--line)";
  if (m >= 80) return "#10b981";
  if (m >= 60) return "#3b82f6";
  if (m >= 30) return "#f59e0b";
  return "#ef4444";
}

export function Stars({ n, size = 12 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < n ? "#f59e0b" : "none"} stroke={i < n ? "#f59e0b" : "var(--line)"} strokeWidth="2">
          <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
        </svg>
      ))}
    </span>
  );
}
