import type { DrugCard } from "@/lib/types";

/** Cards for the antihypertensive "Name Game" node (suffixes + the common terms used in the Memory Aid). */
export const termCards: DrugCard[] = [
  {
    id: "terms-suffix",
    name: "Suffix decoder",
    classLabel: "Identify the class from the name",
    node: "htn-names",
    topic: "antihtn",
    examples: "-pril · -sartan · -pine / -zem / -mil · -olol",
    chunks: {
      moa: [
        "-pril = ACE inhibitor: blocks Ang I → Ang II AND ↑bradykinin",
        "-sartan = ARB: blocks Ang II AT THE RECEPTOR (bradykinin untouched)",
        "-pine / -zem / -mil = calcium channel blockers (diltiazem + verapamil also ↓HR)",
        "-olol = beta-blockers (B1 = heart, B2 = lungs)",
      ],
      se: [
        "-pril: dry hacking cough, hyperkalemia, angioedema, dysgeusia, neutropenia",
        "-sartan: same as ACE incl. hyperkalemia + angioedema, much less cough",
        "-pine: more peripheral edema + reflex tachycardia",
        "-olol: bradycardia, hypotension, masks hypoglycemia",
      ],
      hold: ["ACE / ARB / CCB: hold SBP < 100 (or per parameter)", "Beta-blockers: SBP < 100 or HR < 60 (apical, full minute)"],
      teach: ["Rise slowly; never stop abruptly (rebound HTN)", "ACE/ARB: avoid salt substitutes (= KCl)"],
    },
    hook: "Say the ending, name the class: PRIL → ACE, SARTAN → ARB, PINE/ZEM/MIL → CCB, OLOL → beta-blocker.",
    source: "Blueprint (antihypertensives) + Memory Aid · Module 6",
  },
  {
    id: "terms-common",
    name: "Common terms",
    classLabel: "Vocabulary the blueprint says to review",
    node: "htn-names",
    topic: "antihtn",
    chunks: {
      se: [
        "Orthostatic hypotension: BP drop on standing → dizziness; 1st-dose ACE effect, CCBs, nitro",
        "Reflex tachycardia: fast HR in response to vasodilation (-pine CCBs, nitroglycerin)",
        "Angioedema: swollen lips/tongue/larynx — 'tongue feels thick' → AIRWAY EMERGENCY",
        "Dysgeusia: altered taste (ACE inhibitors)",
        "Peripheral edema: ankle edema, weight gain (CCBs)",
        "Neutropenia: persistent sore throat + fever, low WBC (ACE inhibitors)",
      ],
      action: [
        "Rebound hypertension: why antihypertensives are NEVER stopped abruptly",
        "Therapeutic duplication: 2 drugs from the SAME class (sotalol + metoprolol) = red flag",
        "Two DIFFERENT classes (clonidine + beta-blocker) can be intentional for stubborn HTN",
      ],
      moa: [
        "Inotropic = force · Chronotropic = rate · Dromotropic = conduction (digoxin: +, −, −)",
        "Preload: venous return — nitroglycerin dilates veins → ↓preload → ↓O2 demand",
      ],
    },
    hook: "Angioedema → Airway. Dysgeusia → Distorted taste.",
    source: "Memory Aid · Module 6 (ACE, CCB, beta-blockers, digoxin, nitroglycerin)",
  },
];
