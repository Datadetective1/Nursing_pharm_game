"use client";

import { useStore } from "@/lib/store";

/**
 * Optional, subtle sound feedback synthesized with the Web Audio API (no audio files).
 * Muted instantly via Settings or the speaker toggle in sessions. Never required.
 */
type Kind = "correct" | "wrong" | "snap" | "achievement" | "boss" | "tap" | "level";

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(c: AudioContext, freq: number, at: number, dur: number, type: OscillatorType = "sine", gain = 0.05) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime + at);
  g.gain.setValueAtTime(0.0001, c.currentTime + at);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + at + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + at);
  o.stop(c.currentTime + at + dur + 0.02);
}

export function playSound(kind: Kind) {
  try {
    if (!useStore.getState().settings.sound) return;
  } catch {
    return;
  }
  const c = audio();
  if (!c) return;
  switch (kind) {
    case "correct":
      tone(c, 660, 0, 0.12, "sine", 0.05);
      tone(c, 990, 0.08, 0.18, "sine", 0.045);
      break;
    case "wrong":
      tone(c, 220, 0, 0.18, "triangle", 0.04);
      break;
    case "snap":
      tone(c, 880, 0, 0.06, "square", 0.015);
      break;
    case "tap":
      tone(c, 520, 0, 0.04, "sine", 0.02);
      break;
    case "achievement":
    case "level":
      [523, 659, 784, 1046].forEach((f, i) => tone(c, f, i * 0.08, 0.2, "sine", 0.04));
      break;
    case "boss":
      [392, 523, 659, 784, 1046].forEach((f, i) => tone(c, f, i * 0.11, 0.28, "triangle", 0.045));
      break;
  }
}
