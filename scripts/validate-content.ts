/* Validates every question bank + card file present in src/data.
   Usage: npx tsx scripts/validate-content.ts [fileFilter]  */
import { readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { DrugCard, Question } from "../src/lib/types";
import { validateCards, validateQuestions } from "../src/lib/validate";
import { CONCEPTS } from "../src/data/curriculum";

const filter = process.argv[2] ?? "";

async function main() {
  const qDir = path.resolve("src/data/questions");
  const cDir = path.resolve("src/data/cards");
  let all: Question[] = [];
  let failed = false;
  for (const f of readdirSync(qDir).filter((f) => f.endsWith(".ts") && f !== "index.ts" && f.includes(filter))) {
    const mod = await import(pathToFileURL(path.join(qDir, f)).href);
    const qs = Object.values(mod).find(Array.isArray) as Question[] | undefined;
    if (!qs) {
      console.log(`✗ ${f}: no exported array`);
      failed = true;
      continue;
    }
    const errs = validateQuestions(qs);
    all = all.concat(qs);
    const byType: Record<string, number> = {};
    const byCog: Record<string, number> = {};
    for (const q of qs) {
      byType[q.type] = (byType[q.type] ?? 0) + 1;
      byCog[q.cognitive] = (byCog[q.cognitive] ?? 0) + 1;
    }
    console.log(`${errs.length ? "✗" : "✓"} ${f}: ${qs.length} questions`, JSON.stringify(byType), JSON.stringify(byCog));
    errs.forEach((e) => console.log("   ", e));
    if (errs.length) failed = true;
  }
  const crossErrs = validateQuestions(all).filter((e) => e.includes("duplicate"));
  crossErrs.forEach((e) => console.log("  cross-file:", e));
  if (crossErrs.length) failed = true;

  // per-concept coverage for topics that have files
  const topics = new Set(all.map((q) => q.topic));
  for (const c of CONCEPTS.filter((c) => topics.has(c.topic))) {
    const qs = all.filter((q) => q.concept === c.id);
    const applied = qs.filter((q) => ["apply", "analyze", "evaluate"].includes(q.cognitive)).length;
    if (qs.length < 3 || applied < 1) {
      console.log(`  ⚠ concept ${c.id}: ${qs.length} questions, ${applied} application-level`);
      if (qs.length < 2) failed = true;
    }
  }

  try {
    for (const f of readdirSync(cDir).filter((f) => f.endsWith(".ts") && f !== "index.ts" && f.includes(filter))) {
      const mod = await import(pathToFileURL(path.join(cDir, f)).href);
      const cards = Object.values(mod).find(Array.isArray) as DrugCard[];
      const errs = validateCards(cards);
      console.log(`${errs.length ? "✗" : "✓"} cards/${f}: ${cards.length} cards`);
      errs.forEach((e) => console.log("   ", e));
      if (errs.length) failed = true;
    }
  } catch {
    /* no cards dir yet */
  }
  process.exit(failed ? 1 : 0);
}
main();
