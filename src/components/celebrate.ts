"use client";

export async function celebrate(size: "small" | "big" = "small") {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  try {
    const confetti = (await import("canvas-confetti")).default;
    const colors = ["#7c5cff", "#f46a2e", "#10b981", "#f59e0b", "#ec4899"];
    if (size === "big") {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 }, colors, disableForReducedMotion: true });
      setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0 }, colors }), 250);
      setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1 }, colors }), 400);
    } else {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 }, colors, disableForReducedMotion: true });
    }
  } catch {
    /* ignore */
  }
}
