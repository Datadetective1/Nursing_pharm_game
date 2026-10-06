# Pharm Quest — Interactive Activity Authoring Guide

Read `docs/AUTHORING.md` first: **the source-of-truth rule applies to every activity, every label, every distractor and every feedback line.** Sources: `docs/source/memory-aid.md`, `docs/source/coag-notes.md`, `docs/source/coag-slides.md`, `docs/source/blueprint.md`. A beautiful interaction that teaches a wrong or unsupported fact is worse than none.

Types: `src/lib/activities/types.ts`. Concept ids: `src/data/curriculum.ts` (use only existing ids; `topic` must equal the topic of the FIRST concept). Validate with `npx tsx scripts/validate-activities.ts <fileName>` and `npx tsc --noEmit -p .`.

Each file exports ONE array typed `Activity[]`, e.g.

```ts
import type { Activity } from "@/lib/activities/types";
export const SIMS: Activity[] = [ { id: "act:sim-heparin", kind: "sim", title: "…", topic: "coag", concepts: ["hep-lab", "hep-antidote"], source: "Coag Notes · Slides 2, 4", difficulty: 2, data: { … } } ];
```

## General rules

* **Text is short.** These are visual/touch interactions on an iPhone: labels ≤ ~6 words, card texts ≤ ~70 characters, feedback/why ≤ ~160 characters (one or two short sentences). No paragraphs.
* Use **"client"**, never "patient", in learner-facing text.
* Vital signs / lab numbers may be illustrative, but must fall unambiguously on the correct side of a **course-stated threshold** (e.g., RR 8 < 10 → naloxone; apical 54 < 60 → hold digoxin; SBP 86 < 90 → withhold nitro; aPTT 105 > 80 → bleeding risk; platelets 85,000 < 100,000 → hold + notify). Never use values near a threshold or where the course gives no threshold (e.g., no numeric K+ — say "K+ reported LOW").
* Digoxin levels: only 0.9/1.0/1.1 (therapeutic) or ≥ 2.4 (toxic); never 1.5–2.0.
* Antidotes: only the pairings in `src/data/antidotes.ts` (`ANTIDOTE_NAMES` exact strings for rescue kits). Never an argatroban antidote.
* Nursing actions: only actions the sources state (hold, hold + notify, give antidote, assess airway + notify, call 911 after first unrelieved SL nitro dose, return mannitol with crystals to pharmacy, etc.). Don't invent orders, doses, or protocols.
* Prefer realistic, application-level situations over definitions.
* Every activity cites `source` (e.g., `"Memory Aid · Digoxin"`, `"Coag Notes · Slide 4"`).
* `difficulty`: 1 recall, 2 application, 3 discrimination/priority.

## Kinds and how the UI uses them

### `sim` — clinical micro-simulation (30–90 s)
`data: { client, drug, intro, nodes[], debrief[] }`. The learner moves through `nodes` in order (2–4 decisions). Each node shows optional chart `rows` (label/value/flag), a short `text`, a `prompt`, and 2–4 `choices` with exactly ONE `correct`. A wrong choice shows its `feedback` and the learner retries the same node; the correct choice shows its `feedback` and advances. `debrief`: 2–4 bullet takeaways.

### `room` — "What's wrong with this patient?"
`data: { client, prompt, hotspots[] }`. An illustrated room shows objects (`object` ∈ patient, iv-bag, pump, monitor, mar, labs, tray, mouth, skin, patch, pca, vial, med-cup, bed, calendar — each object type at most once per room). The learner taps objects; each reveals `label` + `detail` (what she sees, e.g. "IV bag: phenytoin in D5W") and whether it's a `problem` with `why`. Goal: find every problem. 5–7 hotspots, 2–4 problems, the rest are fine (realistic safe findings).

### `monitor` — Lab Dashboard
`data: { client, meds[], tiles[] }`. A patient monitor shows 5–7 tiles (`label`, `value`, `unit`). The learner taps every tile that requires nurse action (`action: true`), then checks. Each tile has a short `why`.

### `chart` — Visual patient chart
`data: { patient, meds[], rows[], findings?[], question }`. Compact chart (rows with `flag` high/low/critical/ok/note) + a `MiniQuestion` (single answer → one index in `answer`; multi-select allowed with several indices — then say "Select all that apply" in the prompt).

### `priority` — Priority Zone
`data: { client, drug, findings[], answer, why, visual }`. 4 findings for a client on a drug; the learner drags the ONE requiring IMMEDIATE action into the red zone. The others must clearly be lower priority per the sources. `visual` picks the icon animation (airway, breathing, bleeding, heart, brain, skin, liver, muscle, kidney).

### `swipe` — Swipe decision deck
`data: { prompt, left, right, cards[] }` (e.g. left "HOLD", right "GIVE"). 6–10 cards, each with `side` and a short `why`. ONLY use where the course gives a clean binary rule (explicit hold parameters, K+ wasting vs sparing, stimulant vs depressant). No clinically ambiguous binaries.

### `sorter` — Medication sorter
`data: { prompt, bins[2–3], cards[6–10] }`. Cards are dragged/tapped into bins. Every card must belong to exactly one bin per the sources (no "it depends").

### `sequence` — Timeline builder
`data: { prompt, steps[3–6] (correct order), followUp? }`. ONLY sequences the sources order explicitly (status epilepticus, digoxin toxicity order, acetaminophen toxicity early→late, benzo acute toxicity progression, SL nitroglycerin steps, alteplase life-threatening bleeding steps).

### `body` — Body map
`data: { drug, acts[], effects[], quiz? }`. `acts`: where the drug acts (only if the sources state it, e.g. loop diuretic → kidneys "loop of Henle"; ACE inhibitor → vessels "vasodilation"); `effects`: course-listed adverse/toxic effects mapped to a region (brain, eyes, ears, mouth, lungs, heart, vessels, liver, gi, kidneys, blood, skin, muscle). Region mapping must be obvious (gingival hyperplasia → mouth; ototoxicity → ears; hepatotoxicity → liver; rash/SJS → skin; bleeding → blood). Texts ≤ 40 chars. Optional reverse `quiz`: "These effects light up — which drug?" with 4 options.

### `palace` — Memory palace
`data: { scene, objects[5–7] }`. An elegant room for one drug; each object (`icon`, `label` = the object, e.g. "Salad bowl") sits at `x,y` (percent, 5–95, spread out, don't overlap) and encodes one course fact (`chunk` = moa/use/se/ci/caution/intx/lab/hold/antidote/action/teach, `fact` ≤ 90 chars). The association between object and fact must be intuitive (salad → consistent vitamin K intake). Later the app hides one object and asks which fact is missing.

### `rescue` — Antidote Rescue
`data: { drug, story, vitals[], signs[], antidote, kits[4], note }`. A client is deteriorating after a drug; the learner drags the right rescue kit (`antidote`, exact `ANTIDOTE_NAMES` string) to the client. `kits`: 4 distinct ANTIDOTE_NAMES including the right one. `vitals`/`signs` must be consistent with the course (opioid triad, bleeding signs ↓BP ↑HR bruising, digoxin anorexia/halos, APAP early N/V/sweating, etc.). `note`: the course caveat (e.g., naloxone lasts 20–30 min — repeat, monitor RR up to 2 hr).
