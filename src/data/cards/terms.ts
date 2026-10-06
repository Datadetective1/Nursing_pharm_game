import type { DrugCard } from "@/lib/types";

/**
 * Cards for the antihypertensive "Name Game" node: suffixes + the common terms the blueprint says to review.
 * Sources: M6L1 Antihypertensives (Slides 3–8), M6L3 (digoxin terms), Study Guide · Common terms table.
 */
export const termCards: DrugCard[] = [
  {
    id: "terms-suffix",
    name: "Suffix decoder",
    classLabel: "Identify the class from the name",
    node: "htn-names",
    topic: "antihtn",
    examples: "-pril · -sartan · -pine / -zem / -mil · -olol · clonidine",
    chunks: {
      moa: [
        "-pril = ACE inhibitor: blocks Ang I → Ang II AND ↑bradykinin",
        "-sartan = ARB: blocks the action of Ang II (bradykinin untouched)",
        "-pine / -zem / -mil = calcium channel blockers (diltiazem + verapamil also ↓HR)",
        "-olol = beta-blockers (B1 = heart, B2 = lungs)",
        "Clonidine = alpha-2 agonist: ↓sympathetic outflow from the CNS",
      ],
      se: [
        "-pril: dry hacking cough, hyperkalemia, angioedema, dysgeusia, neutropenia",
        "-sartan: like ACE but NO hyperkalemia + much less cough; angioedema possible",
        "-pine: more peripheral edema + reflex tachycardia",
        "-olol: bradycardia, hypotension, masks hypoglycemia",
        "Clonidine: drowsiness, sedation, dry mouth, rebound HTN",
      ],
      hold: ["ACE / ARB / CCB: hold SBP < 100 (or per parameter)", "Beta-blockers: SBP < 100 or HR < 60 (apical, full minute)"],
      teach: ["Rise slowly; never stop abruptly (rebound HTN)", "ACE inhibitors: avoid salt substitutes (= KCl)"],
    },
    hook: "Say the ending, name the class: PRIL → ACE, SARTAN → ARB, PINE/ZEM/MIL → CCB, OLOL → beta-blocker.",
    source: "M6L1 Antihypertensives · Slides 3–7; Blueprint (antihypertensives); Study Guide · last-name shortcut",
  },
  {
    id: "terms-common",
    name: "Common terms",
    classLabel: "Vocabulary the blueprint says to review",
    node: "htn-names",
    topic: "antihtn",
    chunks: {
      se: [
        "Orthostatic hypotension: BP drop on rising → teach to rise slowly in stages",
        "Reflex tachycardia: HR speeds up to make up for vasodilation (CCBs)",
        "Angioedema: swollen lips/tongue/larynx — 'tongue feels thick' → AIRWAY",
        "Dysgeusia: altered taste (ACE inhibitors)",
        "Neutropenia: low WBC → persistent sore throat + fever",
        "Peripheral edema: ankle edema, weight gain (CCBs)",
      ],
      action: [
        "Rebound hypertension: BP surge when an antihypertensive is stopped abruptly",
        "Therapeutic duplication: 2 drugs from the SAME class (sotalol + metoprolol) = red flag",
        "Two DIFFERENT classes (clonidine + beta-blocker) can be intentional (Memory Aid)",
      ],
      moa: [
        "Preload: blood returning to + stretching the ventricle before contraction",
        "Afterload: the resistance the ventricle pumps against (vasodilators ↓ it)",
        "Inotropic = force · Chronotropic = rate (digoxin: + force, − rate)",
        "Cardiac output = stroke volume × heart rate",
      ],
    },
    hook: "Angioedema → Airway. Dysgeusia → Distorted taste. AFTERload = what the heart pushes against AFTER it fills.",
    source: "M6L1 Antihypertensives · Slides 4–8; Study Guide · Common terms; Memory Aid · One-member exceptions",
  },
];
