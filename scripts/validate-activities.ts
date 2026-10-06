/* Validates every activity data file in src/data/activities.
   Usage: npx tsx scripts/validate-activities.ts [fileFilter] */
import { readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Activity } from "../src/lib/activities/types";
import { validateActivities } from "../src/lib/activities/validate";

const filter = process.argv[2] ?? "";

async function main() {
  const dir = path.resolve("src/data/activities");
  let all: Activity[] = [];
  let failed = false;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".ts") && f !== "index.ts" && f !== "generated.ts" && f.includes(filter))) {
    const mod = await import(pathToFileURL(path.join(dir, f)).href);
    const acts = (Object.values(mod).filter(Array.isArray).flat() as Activity[]).filter((a) => a && typeof a === "object" && "kind" in a && "data" in a);
    const errs = validateActivities(acts);
    all = all.concat(acts);
    const kinds: Record<string, number> = {};
    for (const a of acts) kinds[a.kind] = (kinds[a.kind] ?? 0) + 1;
    console.log(`${errs.length ? "✗" : "✓"} ${f}: ${acts.length} activities ${JSON.stringify(kinds)}`);
    errs.forEach((e) => console.log("   ", e));
    if (errs.length) failed = true;
  }
  const dupes = validateActivities(all).filter((e) => e.includes("duplicate id"));
  dupes.forEach((e) => console.log("  cross-file:", e));
  if (dupes.length) failed = true;
  process.exit(failed ? 1 : 0);
}
main();
