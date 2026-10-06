// Validates micro-lessons: npx tsx scripts/validate-lessons.ts [unitPrefixFilter]
import { LESSONS } from "@/data/lessons";
import { validateAllLessons } from "@/lib/lessons/validate";
const filter = process.argv[2];
let errs = validateAllLessons(LESSONS);
if (filter) errs = errs.filter((e) => e.includes(filter));
for (const e of errs) console.log("✗", e);
console.log(`${LESSONS.length} lessons, ${LESSONS.reduce((a, l) => a + l.steps.length, 0)} steps — ${errs.length} problem(s)`);
process.exit(errs.length && !filter ? 1 : errs.length ? 1 : 0);
