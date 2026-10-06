// Rebuilds tests/fixtures/source-ranges.json from the local course files in docs/source/ (not committed).
// Every numeric range that appears anywhere in the course folder. Run after the sources change.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
const RANGE_RE = /(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)/g;
const out = new Set<string>(JSON.parse(readFileSync("tests/fixtures/source-ranges.json", "utf8")));
const dir = path.resolve("docs/source");
for (const f of readdirSync(dir).filter((f) => f.endsWith(".md") && !f.startsWith("_"))) {
  const text = readFileSync(path.join(dir, f), "utf8");
  for (const m of text.matchAll(RANGE_RE)) out.add(`${Number(m[1])}-${Number(m[2])}`);
}
writeFileSync("tests/fixtures/source-ranges.json", JSON.stringify([...out].sort()));
console.log(out.size, "ranges");
