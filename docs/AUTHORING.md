# Pharm Quest — Content Authoring Guide

This app is a study tool for **NURS 3365 Exam 2** (nursing pharmacology). Content accuracy matters more than anything else.

## Source-of-truth rule (non-negotiable)

The ONLY authorities are the course files kept locally in `docs/source/` (not committed — the repo is public):

| Priority | Files | Role |
|---|---|---|
| 1 | `M5L1 … M8L3` lecture files (instructor notes + on-slide text) | PRIMARY teaching source |
| 2 | Exam 2 Blueprint · Chapters objectives · syllabus | scope, weighting, objectives |
| 3 | Memory Aid · Study Guide · Rapid Reference | supporting review material (partly AI-made) |

* When files conflict, the most specific LECTURE source wins. Don't invent a reconciliation — teach the lecture, avoid testing the conflicting detail, and record it on the Sources page. Decided conflicts: digoxin 0.5–0.8 ng/mL (> 2 toxic) per the M6L3 slide; ARBs do NOT cause hyperkalemia (M6L1); MI oxygen cutoff (94% notes vs 90% slide) is never tested; colesevelam "1 hr before or 4–6 hr after".
* Cite the real source in `source`, e.g. `"M6L2 Diuretics · Slide 3"`; facts found only in support files cite them (`"Exam2 Memory Aid · Digoxin"`).
* Every fact in a question, option, explanation, hook, or card MUST be supported by these files.
* Do **not** "correct" the course material with outside knowledge. If outside knowledge differs, the course wins.
* Do **not** invent doses, ranges, contraindications, antidotes, labs, or nursing actions that are not in the sources.
* If a fact is not clearly supported, **leave it out**. Fewer, correct questions beat more, shaky ones.
* Distractors (wrong options) must be **clearly wrong according to the sources** — ideally a real fact belonging to a *different* drug/class from the sources (this creates useful interleaving/contrast). Never use a distractor that might actually be true in the sources.

### Specific source quirks to respect

* **Digoxin level**: lecture slide 0.5–0.8 ng/mL, > 2 = toxic (study guides say 0.5–1.5). Only use values ≤ 0.8 as therapeutic or > 2 as toxic, or state the range in the stem. Never use a value between 0.8 and 2.0 as the deciding fact.
* **Heparin aPTT** goal: 1.5–2.5 × normal ≈ 60–80 seconds. Below = subtherapeutic (still at clot risk); above = supratherapeutic (bleeding risk).
* **Warfarin**: PT 1.5–2 × control = 18–24 sec; INR 2–3 most indications; 2.5–3.5 PE treatment; 3–4.5 mechanical heart valve / recurrent systemic embolism. Hold if PT or INR above therapeutic range.
* **Antidotes (only these)**: opioids → naloxone; acetaminophen → acetylcysteine; heparin AND enoxaparin → protamine (sulfate), give slowly ≤ 50 mg/10 min; warfarin → vitamin K (phytonadione); dabigatran → idarucizumab; rivaroxaban/apixaban (Xa inhibitors) → andexanet alfa (Coag slide 8, "approved in 2018 by FDA"); alteplase → aminocaproic acid; digoxin → digoxin immune fab; benzodiazepines → flumazenil (IV toxicity; oral ingestion → gastric lavage or activated charcoal); beta-blocker overdose → withhold, atropine for symptomatic bradycardia, glucagon + insulin. **Do not ask for an argatroban antidote** (sources are ambiguous). **Do not invent antidotes for anything else.**
* **Meperidine**: the memory aid includes "toxic metabolite accumulates — avoid in renal impairment + older adults, risk of seizures" but flags it as "standard pharm, not in her notes". Use at most 2–3 questions on this, source = "Memory Aid · One-member exceptions (flagged: not in instructor notes)".
* **Not on the blueprint** (clonidine, dantrolene, celecoxib, niacin, dalteparin, apixaban, cholestyramine): may appear as distractors, contrast items, or minor items only — never as a main focus.
* Use the word **"client"** (course terminology), not "patient", in stems.

## Files you write

* Questions: `src/data/questions/<topic>.ts` exporting one array, e.g.

```ts
import type { Question } from "@/lib/types";

export const analgesicsQuestions: Question[] = [ /* ... */ ];
```

* Drug cards: `src/data/cards/<world>.ts` exporting one array, e.g. `export const w5Cards: DrugCard[] = [...]` (import type `DrugCard`).

Types are in `src/lib/types.ts`. Concept ids, topic ids, node ids, and drug ids are in `src/data/curriculum.ts` — use ONLY ids that exist there (the validator checks). Each question's `topic` must equal its concept's topic.

Validate with: `npx tsx scripts/validate-content.ts <topicFileName>` (e.g. `analgesics`). Also run `npx tsc --noEmit -p .` before finishing. Fix every ✗ and every concept warning.

## Question rules

* **Id**: topic prefix + 3-digit number, unique. Prefixes: calc `ca-`, analgesics `an-`, antiinflam `ai-`, antihtn `ht-`, diuretics `di-`, hf `hf-`, coag `co-`, lipids `li-`, angina `ag-`, cnsdep `cd-`, cnsstim `cs-`, anticonv `ac-`.
* **Coverage**: every concept of your topic gets ≥ 3 questions (high-yield concepts ≥ 5), in ≥ 2 different `type`s, with ≥ 1 application-level (`apply`/`analyze`/`evaluate`) item. Test the same concept through different contexts (different client, setting, format).
* **Type mix (approx.)**: 45% `mcq`, 20% `sata`, 15% `tf`, 12% `fill`, 8% `match`/`order`. (The real exam uses MCQ, SATA, fill-in-the-blank, and true/false only; match/order are for practice variety.)
* **Cognitive mix**: ≥ 50% `apply`/`analyze`/`evaluate`. The blueprint emphasizes application. Use realistic short clinical scenarios: "A client receiving heparin has an aPTT of 110 seconds. What should the nurse anticipate?"
* **Difficulty**: 1 = direct recall; 2 = straightforward application; 3 = discrimination between similar drugs, priority/first action, multi-fact reasoning, or "which order should the nurse question".
* **Formats** (`format` field) to include across your set: `definition`, `antidote`, `lab`, `lab-interpretation`, `side-effect`, `contraindication`, `interaction`, `nursing-action`, `first-action` ("What should the nurse do FIRST?"), `question-order` ("Which prescription should the nurse question?"), `teaching` (incl. "Which statement indicates a need for further teaching?"), `case`, `class-id` (identify class by suffix/description), `contrast` (discriminate two similar drugs), `why` ("Why is this dangerous / the priority?").
* **mcq**: exactly 4 options, exactly one unambiguously correct. No "all/none of the above". Vary the position of the correct answer (the app shuffles, but still). Don't make the correct option systematically the longest or most detailed.
* **sata**: 5 options (4–6 ok), 2–4 correct. Stem MUST contain "Select all that apply." Every option must be clearly true or clearly false per the sources.
* **tf**: `stem` is a statement. Roughly half should be false; a false statement should be a plausible mistake (e.g., swapped antidote, wrong direction of K+, wrong range).
* **fill**: stem contains `____`. `accept` lists all reasonable spellings/synonyms/abbreviations, first entry is the canonical answer (e.g. `["protamine sulfate", "protamine"]`). For numbers use `numeric: { value, tolerance? }` plus `unit`, and put the number as a string in `accept` too. Answers must be short (1–3 words or a number).
* **match**: 3–5 pairs, unique left and right sides (drug → antidote, drug → lab, drug → hallmark side effect, drug → class).
* **order**: 3–5 items, ONLY for sequences the sources explicitly order (e.g., digoxin toxicity sequence, status epilepticus treatment steps, acetaminophen toxicity early → late, benzo acute toxicity progression, SL nitro sequence). Items listed in correct order.
* **why**: 1–3 sentences explaining the reasoning using source facts.
* **clue**: the detail in the stem that should have pointed to the answer (e.g., "‘tongue feels thick’ = angioedema → airway").
* **hook** (optional): use course mnemonics where they exist (NARCS, PARK, NAOMI, "4 G" herbals, "C = Centrally / D = Direct", "THINK CAFFEINE", "THINK ALCOHOL", "harder, stronger, slower", suffixes, "wasting → eat more K+; sparing → limit K+"). New hooks are OK only if they restate the real fact (e.g. "PRO-tamine PROtects from HEParin — protamine reverses heparin and enoxaparin").
* **source**: e.g. `"Memory Aid · Opioids"`, `"Memory Aid · One-member exceptions"`, `"Memory Aid · CALC"`, `"Coag Notes · Slide 4 (nursing process)"`, `"Coag Slides · Slide 8"`.

## Drug card rules

One card per drug or tight drug group in your nodes (use node ids from `curriculum.ts`). `chunks` keys: `moa`, `use`, `se`, `ci`, `caution`, `intx`, `lab`, `hold`, `antidote`, `action`, `teach`. Each chunk is an array of SHORT bullet strings (≤ ~90 chars), taken from the sources. Include the course mnemonic in `hook` when one exists (restating the fact). `source` names the source section.

## Lessons (Learn mode)

Every leaf unit in `src/data/library.ts` has a micro-lesson in `src/data/lessons/<m5|m6|m7|m8|calc>.ts` (schema: `src/lib/lessons/types.ts`). One idea per screen, cause → effect chains, existing visuals, a key fact per concept (`keys`, used as the guided-practice hint), and a source on every step. Every concept must be taught by at least one step — that is what lets the game teach before it tests. Guided practice also needs ≥ 2 easy recognition items per concept (difficulty 1, MCQ/TF, remember/understand) with a `clue`.

Validate: `npm run validate` (questions, activities, lessons). Coverage matrix: `npm run coverage` → `docs/COVERAGE.md`.
