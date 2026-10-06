# Pharm Quest

**Master the meds. Beat the exam.** A mobile-first, game-style study app for NURS 3365 Exam 2 (Modules 5–8 + dosage calculations).

No account needed — all progress (XP, streak, mastery, answers, mistakes, confidence, exam date, history) is stored in the browser's `localStorage` and survives refreshes. Settings → Export/Import moves progress between devices.

## What's inside

| Area | What it does |
|---|---|
| Home | Readiness %, days to exam, streak, XP/level, **Continue Quest**, **Quick 5**, Today's Mission |
| Quest | Worlds 5–8 (+ Calc Camp) as a path of topic nodes (Unseen → Shaky → Learning → Strong → Mastered) with boss battles (10 mixed questions, 3 hearts) |
| Practice | Quick 5 · Weak Spots · Mistake Vault · Antidote Arena · Lab Lock · Don't Mix These Up · Dosage Dojo · Rapid Review · High-Yield Sprint · World practice |
| Progress | Blueprint-weighted readiness, module/topic mastery, knowledge map, accuracy, study time, 7-day mistake trend, confidence calibration, achievements |
| Exam | 50-question simulated Exam 2 following the blueprint distribution (MCQ / SATA / fill-in / T-F), resumable, with full analytics and **Study My Misses** |

## Learning engine (`src/lib/engine`)

* **Mastery 0–100 per concept** (`mastery.ts`) from accuracy, difficulty, confidence (guess/unsure/confident), response time and repeated retrieval. Caps enforce mastery learning: no application-level success → max 55; < 2 application wins, < 3 correct, or < 2 sessions → max 79. Overdue concepts decay.
* **Spaced repetition**: Leitner boxes (0 → 10 min → 1 h → 6 h → 1 d → 3 d), compressed for an exam days away. Wrong answers return within the same session (re-queued 3 questions later) and reset the box.
* **Selection** (`select.ts`): 50% weak / 25% medium / 15% due-for-review / 10% mastered, weighted by blueprint emphasis; harder items as mastery grows; avoids repeats and varies question format.
* **Readiness** (`progress.ts`): blueprint-weighted topic mastery (+25% from a recent simulated exam).

## Content (`src/data`) — kept separate from UI

```
src/data/
  curriculum.ts        blueprint topics, worlds, quest nodes, concepts, drug ids
  questions/*.ts       hand-authored question banks per topic (metadata: topic, concept, drugs,
                       difficulty, cognitive level, format, type, why, clue, hook, source)
  cards/*.ts           chunked drug cards (MOA · USE · S/E · CI · INTX · LAB · HOLD · ANTIDOTE · ACTION · TEACH)
  calc.ts              dosage-calculation generators (7 blueprint types, verified by tests)
  antidotes.ts         drug → antidote pairs (course-supported only)
  labs.ts              Lab Lock scenarios
  contrasts.ts         "Don't mix these up" comparison sets
  rapid.ts             rapid-review flash cards
```

To correct or add content, edit these files and run `npm run validate && npm test`. Authoring rules are in [`docs/AUTHORING.md`](docs/AUTHORING.md). The source-of-truth course files are kept locally in `docs/source/` (not committed, since the repository is public).

## Scripts

```bash
npm run dev          # local dev server
npm run check        # lint + typecheck + content validation + unit tests
npm run build        # production build
npm run test:e2e     # Playwright end-to-end tests (phone viewport); E2E_BASE_URL=https://… to test a deployment
```

Stack: Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Zustand (persisted) · Vitest · Playwright · Vercel.
