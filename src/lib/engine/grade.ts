import type { Question } from "@/lib/types";

/** A learner's response, by question type. */
export type Response =
  | { type: "mcq"; choice: number }
  | { type: "sata"; choices: number[] }
  | { type: "tf"; value: boolean }
  | { type: "fill"; text: string; unit?: string }
  | { type: "match"; map: Record<string, string> } // left -> chosen right
  | { type: "order"; items: string[] };

export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[‐-―]/g, "-")
    .replace(/[^a-z0-9.\s-]/g, " ")
    .replace(/\.(?!\d)/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function parseNumber(s: string): number | null {
  const cleaned = s.replace(/,/g, "").replace(/[^0-9.\-]/g, " ").trim().split(/\s+/)[0];
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function isCorrect(q: Question, r: Response): boolean {
  switch (q.type) {
    case "mcq":
      return r.type === "mcq" && r.choice === q.answer;
    case "sata": {
      if (r.type !== "sata") return false;
      const a = new Set(q.answers);
      const b = new Set(r.choices);
      return a.size === b.size && [...a].every((x) => b.has(x));
    }
    case "tf":
      return r.type === "tf" && r.value === q.answer;
    case "fill": {
      if (r.type !== "fill") return false;
      if (q.numeric) {
        const n = parseNumber(r.text);
        if (n === null) return false;
        const tol = q.numeric.tolerance ?? 0.001;
        return Math.abs(n - q.numeric.value) <= tol + 1e-9;
      }
      const t = normalize(r.text);
      if (!t) return false;
      return q.accept.some((a) => normalize(a) === t);
    }
    case "match":
      return r.type === "match" && q.pairs.every(([l, rt]) => r.map[l] === rt);
    case "order":
      return r.type === "order" && r.items.length === q.items.length && q.items.every((x, i) => r.items[i] === x);
  }
}

/** Human-readable correct answer. */
export function correctAnswerText(q: Question): string {
  switch (q.type) {
    case "mcq":
      return q.options[q.answer];
    case "sata":
      return q.answers.map((i) => q.options[i]).join(" · ");
    case "tf":
      return q.answer ? "True" : "False";
    case "fill":
      return q.unit ? `${q.accept[0]} ${q.unit}` : q.accept[0];
    case "match":
      return q.pairs.map(([l, r]) => `${l} → ${r}`).join(" · ");
    case "order":
      return q.items.map((x, i) => `${i + 1}. ${x}`).join("  ");
  }
}

export function responseText(q: Question, r: Response | undefined): string {
  if (!r) return "—";
  switch (r.type) {
    case "mcq":
      return q.type === "mcq" ? q.options[r.choice] ?? "—" : "—";
    case "sata":
      return q.type === "sata" ? (r.choices.length ? r.choices.map((i) => q.options[i]).join(" · ") : "(none selected)") : "—";
    case "tf":
      return r.value ? "True" : "False";
    case "fill":
      return r.text.trim() ? `${r.text.trim()}${r.unit ? ` ${r.unit}` : ""}` : "(blank)";
    case "match":
      return Object.entries(r.map)
        .map(([l, rt]) => `${l} → ${rt}`)
        .join(" · ");
    case "order":
      return r.items.map((x, i) => `${i + 1}. ${x}`).join("  ");
  }
}
