import { QUESTIONS } from "../src/data/bank";
import { pickExplainer } from "../src/lib/explain";

const counts: Record<string, number> = {};
const gauges: string[] = [];
for (const q of QUESTIONS) {
  const e = pickExplainer(q);
  const k = e?.kind ?? "none";
  counts[k] = (counts[k] ?? 0) + 1;
  if (e?.kind === "gauge") gauges.push(`${q.id} [${e.gauge.lab} ${e.gauge.low}-${e.gauge.high}] value=${e.gauge.value} :: ${q.stem.slice(0, 110)}`);
}
console.log(QUESTIONS.length, counts);
if (process.argv.includes("--gauges")) console.log(gauges.join("\n"));
