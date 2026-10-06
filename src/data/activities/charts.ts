import type { Activity } from "@/lib/activities/types";

/* Compact client charts + one interpretation question (kind "chart").
   Sources: docs/source/memory-aid.md, coag-notes.md, coag-slides.md. Distractors are facts that belong
   to a different drug/class in the sources, or are directly contradicted by them. */
export const CHARTS: Activity[] = [
  // ───────── Analgesics ─────────
  {
    id: "act:chart-apap",
    kind: "chart",
    title: "Late APAP Presentation",
    topic: "analgesics",
    concepts: ["apap-lab", "apap-antidote", "apap-tox"],
    source: "Memory Aid · Acetaminophen",
    difficulty: 2,
    data: {
      patient: "Client, 24, ED: took many APAP tablets",
      meds: ["Acetaminophen (ingested, OTC)"],
      rows: [
        { label: "Time since ingestion", value: "~10 hr", flag: "high" },
        { label: "APAP level", value: "Not drawn yet", flag: "note" },
        { label: "Nausea, sweating", value: "Present", flag: "high" },
        { label: "Sclera", value: "White", flag: "ok" },
      ],
      question: {
        prompt: "No level was drawn within 4 hr. What does the course direct?",
        options: ["Assume toxic; treat with acetylcysteine", "Wait for a level before treating", "Give naloxone and observe", "No treatment: no jaundice yet"],
        answer: [0],
        why: "Draw the level < 4 hr; after 4 hr, assume toxic + treat. Antidote: acetylcysteine. Jaundice is a LATE sign, so white sclera ≠ safe.",
      },
    },
  },
  {
    id: "act:chart-tramadol",
    kind: "chart",
    title: "Tramadol Order Review",
    topic: "analgesics",
    concepts: ["tram-seizure", "tram-intx"],
    source: "Memory Aid · Tramadol",
    difficulty: 2,
    data: {
      patient: "Client, 45, knee pain; tramadol ordered",
      meds: ["Tramadol PO (new order)", "SSRI antidepressant daily"],
      rows: [
        { label: "History", value: "Seizure disorder", flag: "high" },
        { label: "Home med", value: "SSRI daily", flag: "high" },
        { label: "RR", value: "16/min", flag: "ok" },
        { label: "BP", value: "126/80", flag: "ok" },
        { label: "Allergies", value: "None known", flag: "ok" },
      ],
      question: {
        prompt: "Which findings raise concern with tramadol? Select all that apply.",
        options: ["Seizure disorder", "Daily SSRI", "RR 16/min", "BP 126/80", "No known allergies"],
        answer: [0, 1],
        why: "Tramadol LOWERS the seizure threshold, and with SSRIs → serotonin syndrome. RR, BP and allergies are unremarkable.",
      },
    },
  },

  // ───────── NSAIDs / gout ─────────
  {
    id: "act:chart-nsaid-gi",
    kind: "chart",
    title: "Ibuprofen + Dark Stools",
    topic: "antiinflam",
    concepts: ["nsaid-gi", "nsaid-intx"],
    source: "Memory Aid · NSAIDs",
    difficulty: 2,
    data: {
      patient: "Client, 68, osteoarthritis",
      meds: ["Ibuprofen PO TID", "Glucocorticoid PO daily"],
      rows: [
        { label: "Stool", value: "Dark, tarry", flag: "critical" },
        { label: "Emesis", value: "Coffee-ground", flag: "critical" },
        { label: "Epigastric pain", value: "Worse after eating", flag: "high" },
        { label: "Hearing", value: "No tinnitus", flag: "ok" },
        { label: "Knee pain", value: "Improved", flag: "ok" },
      ],
      question: {
        prompt: "Which findings suggest an NSAID GI bleed? Select all that apply.",
        options: ["Dark, tarry stools", "Coffee-ground emesis", "Epigastric pain after eating", "No tinnitus", "Improved knee pain"],
        answer: [0, 1, 2],
        why: "GI ulcer/bleed is the #1 NSAID adverse effect; glucocorticoids add gastric bleed risk. Tinnitus is aspirin's salicylism sign.",
      },
    },
  },
  {
    id: "act:chart-gout",
    kind: "chart",
    title: "New Probenecid Order",
    topic: "antiinflam",
    concepts: ["gout-probenecid", "gout-allopurinol", "gout-teach"],
    source: "Memory Aid · Antigout",
    difficulty: 3,
    data: {
      patient: "Client, 55, gout",
      meds: ["Probenecid PO (new order)"],
      rows: [
        { label: "Last acute attack", value: "10 days ago", flag: "high" },
        { label: "Diet", value: "Red meat most days", flag: "note" },
        { label: "Alcohol", value: "2 beers nightly", flag: "note" },
      ],
      question: {
        prompt: "Why should the nurse question this order now?",
        options: ["Attack 10 days ago: can trigger a flare", "It must be taken on an empty stomach", "It is only for acute attacks", "It increases uric acid production"],
        answer: [0],
        why: "Hold probenecid within 2–3 wk of an acute attack: it precipitates a flare. It ↑uric acid elimination (chronic use); take with food.",
      },
    },
  },

  // ───────── Antihypertensives ─────────
  {
    id: "act:chart-ccb-digoxin",
    kind: "chart",
    title: "Verapamil Meets Digoxin",
    topic: "antihtn",
    concepts: ["ccb-intx", "ccb-se", "dig-intx"],
    source: "Memory Aid · CCBs; One-member exceptions",
    difficulty: 3,
    data: {
      patient: "Client, 74, a-fib + HF",
      meds: ["Digoxin PO daily", "Verapamil PO (started last week)"],
      rows: [
        { label: "Digoxin level", value: "2.6 ng/mL", flag: "critical" },
        { label: "Appetite", value: "Poor × 2 days", flag: "high" },
        { label: "Nausea", value: "Present", flag: "high" },
        { label: "Bowels", value: "Constipated", flag: "note" },
      ],
      question: {
        prompt: "What best explains the digoxin level?",
        options: ["Verapamil ↑digoxin levels", "Verapamil causes hyperkalemia", "A missed digoxin dose", "Antacids ↑digoxin absorption"],
        answer: [0],
        why: "Verapamil specifically ↑digoxin levels. Anorexia + nausea = toxicity. Antacids ↓digoxin absorption. Verapamil → worst constipation.",
      },
    },
  },
  {
    id: "act:chart-ace-park",
    kind: "chart",
    title: "ACE Inhibitor: Check PARK",
    topic: "antihtn",
    concepts: ["ace-ci", "ace-hyperk"],
    source: "Memory Aid · ACE inhibitors (PARK)",
    difficulty: 3,
    data: {
      patient: "Client, 32, new HTN",
      meds: ["Lisinopril PO (new order)"],
      rows: [
        { label: "Pregnancy test", value: "Positive", flag: "critical" },
        { label: "K+", value: "Reported HIGH", flag: "high" },
        { label: "Asthma", value: "Yes, mild", flag: "note" },
        { label: "Gout", value: "Yes", flag: "note" },
        { label: "Renal function", value: "Normal", flag: "ok" },
      ],
      question: {
        prompt: "Which findings contraindicate lisinopril? Select all that apply.",
        options: ["Positive pregnancy test", "High K+", "Asthma", "Gout", "Normal renal function"],
        answer: [0, 1],
        why: "PARK: Pregnancy, Allergy/prior angioedema, Renal failure, hyperKalemia. Asthma is a NONSELECTIVE beta-blocker CI, not an ACE CI.",
      },
    },
  },

  // ───────── Diuretics ─────────
  {
    id: "act:chart-spiro",
    kind: "chart",
    title: "Spironolactone + KCl Order",
    topic: "diuretics",
    concepts: ["spiro-ci", "spiro-se", "spiro-teach", "k-updown"],
    source: "Memory Aid · Spironolactone; K+ up/down",
    difficulty: 3,
    data: {
      patient: "Client, 70, HF",
      meds: ["Spironolactone PO daily", "Lisinopril PO daily", "KCl PO (new order)"],
      rows: [
        { label: "K+", value: "Reported HIGH", flag: "critical" },
        { label: "Symptoms", value: "Weakness, tingling", flag: "high" },
        { label: "Diet", value: "Uses a salt substitute", flag: "high" },
      ],
      question: {
        prompt: "What is the nurse's best action?",
        options: ["Hold spironolactone; question the KCl", "Give KCl: diuretics waste K+", "Encourage bananas + orange juice", "Use more salt substitute, less salt"],
        answer: [0],
        why: "Spironolactone SPARES K+; with an ACE inhibitor or K+ supplements → (fatal) hyperK. Hold for high K+; limit K+ foods; no salt substitutes.",
      },
    },
  },

  // ───────── Heart failure ─────────
  {
    id: "act:chart-digoxin-tox",
    kind: "chart",
    title: "Digoxin: Spot the Toxicity",
    topic: "hf",
    concepts: ["dig-tox", "dig-hold", "dig-teach"],
    source: "Memory Aid · Digoxin",
    difficulty: 2,
    data: {
      patient: "Client, 78, HF + a-fib",
      meds: ["Digoxin PO daily", "Furosemide PO daily"],
      rows: [
        { label: "Apical pulse (full min)", value: "68/min", flag: "ok" },
        { label: "Appetite", value: "Poor × 2 days", flag: "high" },
        { label: "Vision", value: "Yellow-green halos", flag: "critical" },
        { label: "Nausea", value: "Present", flag: "high" },
      ],
      question: {
        prompt: "Which findings suggest digoxin toxicity? Select all that apply.",
        options: ["Poor appetite", "Yellow-green halos", "Nausea", "Apical pulse 68/min"],
        answer: [0, 1, 2],
        why: "Order: anorexia (earliest) → N/V → vision changes/halos → dysrhythmias. Pulse 68 isn't < 60, but any toxicity sign → hold.",
      },
    },
  },

  // ───────── Coagulation ─────────
  {
    id: "act:chart-alteplase",
    kind: "chart",
    title: "Alteplase for Stroke?",
    topic: "coag",
    concepts: ["tpa-ci", "tpa-nursing"],
    source: "M7L2 Coagulation Modifiers · Slides 12–13",
    difficulty: 3,
    data: {
      patient: "Client with acute ischemic stroke",
      meds: ["Alteplase IV (ordered)"],
      rows: [
        { label: "Symptom onset", value: "90 min ago", flag: "ok" },
        { label: "History", value: "Intracranial hemorrhage, 2 yr ago", flag: "critical" },
        { label: "Baseline labs", value: "CBC, aPTT, PT/INR, fibrinogen", flag: "ok" },
        { label: "IV access", value: "Adequate", flag: "ok" },
      ],
      question: {
        prompt: "Which finding must be reported before alteplase is given?",
        options: ["Prior intracranial hemorrhage", "Onset 90 min ago", "Baseline fibrinogen drawn", "Adequate IV access"],
        answer: [0],
        why: "ANY prior intracranial hemorrhage contraindicates alteplase. Within 3 hr of onset is best; baseline labs + IV access are correct prep.",
      },
    },
  },

  // ───────── Lipids ─────────
  {
    id: "act:chart-colesevelam",
    kind: "chart",
    title: "Colesevelam Med Pass",
    topic: "lipids",
    concepts: ["lip-seq"],
    source: "Memory Aid · Lipid-lowering agents",
    difficulty: 2,
    data: {
      patient: "Client, 63, hyperlipidemia + HF",
      meds: ["Colesevelam PO daily", "Digoxin PO daily"],
      rows: [
        { label: "Colesevelam", value: "Due 0800", flag: "note" },
        { label: "Digoxin", value: "Also listed for 0800", flag: "high" },
        { label: "Bowels", value: "Constipated", flag: "note" },
      ],
      question: {
        prompt: "How should digoxin be timed?",
        options: ["1 hr before or 4–6 hr after colesevelam", "At the same time as colesevelam", "15 min after colesevelam", "Mixed into the colesevelam dose"],
        answer: [0],
        why: "Sequestrants block absorption of digoxin, warfarin, phenytoin and more: give other meds 1 hr before or 4–6 hr after. They also constipate.",
      },
    },
  },

  // ───────── Angina ─────────
  {
    id: "act:chart-nitro",
    kind: "chart",
    title: "Nitro: Second Dose?",
    topic: "angina",
    concepts: ["ntg-hold", "ntg-admin", "ntg-routes"],
    source: "Memory Aid · Nitroglycerin",
    difficulty: 3,
    data: {
      patient: "Client, 66, inpatient with chest pain",
      meds: ["Nitroglycerin SL PRN"],
      rows: [
        { label: "SL nitro #1", value: "Given 5 min ago", flag: "note" },
        { label: "Chest pain", value: "Unrelieved", flag: "critical" },
        { label: "BP", value: "86/54", flag: "critical" },
        { label: "Position", value: "Sitting", flag: "ok" },
      ],
      question: {
        prompt: "Pain persists after dose 1. What should the nurse do about nitro?",
        options: ["Withhold further nitro doses", "Give the 2nd SL dose now", "Give 2 tablets at once", "Apply a nitro patch for fast relief"],
        answer: [0],
        why: "SBP < 90 → withhold further doses. Patches are prevention only. Unrelieved chest pain = MI until proven otherwise.",
      },
    },
  },

  // ───────── CNS depressants ─────────
  {
    id: "act:chart-benzo",
    kind: "chart",
    title: "Too Sleepy After Lorazepam",
    topic: "cnsdep",
    concepts: ["bz-antidote", "bz-se", "cnsdep-pop"],
    source: "Memory Aid · Benzodiazepines",
    difficulty: 2,
    data: {
      patient: "Client, 82, anxiety",
      meds: ["Lorazepam IV (given 30 min ago)"],
      rows: [
        { label: "LOC", value: "Lethargic, confused", flag: "critical" },
        { label: "Respirations", value: "Slow, shallow", flag: "critical" },
        { label: "Opioids", value: "None given", flag: "ok" },
        { label: "Age group", value: "Older adult", flag: "note" },
      ],
      question: {
        prompt: "Which antidote should the nurse anticipate?",
        options: ["Flumazenil", "Naloxone", "Acetylcysteine", "Protamine sulfate"],
        answer: [0],
        why: "IV benzo toxicity → flumazenil (oral ingestion → gastric lavage or charcoal). Maintain airway, monitor VS. Naloxone is for opioids.",
      },
    },
  },

  // ───────── CNS stimulants ─────────
  {
    id: "act:chart-stimulant",
    kind: "chart",
    title: "Methylphenidate Check-in",
    topic: "cnsstim",
    concepts: ["stim-admin", "stim-se", "stim-monitor"],
    source: "Memory Aid · CNS stimulants",
    difficulty: 2,
    data: {
      patient: "Child, 9, ADHD",
      meds: ["Methylphenidate PO 0700 + 1800"],
      rows: [
        { label: "Dose times", value: "0700 + 1800", flag: "high" },
        { label: "Sleep", value: "Can't fall asleep", flag: "high" },
        { label: "Weight", value: "↓ 4 lb since last visit", flag: "high" },
        { label: "Doses taken", value: "With meals", flag: "ok" },
        { label: "Mood", value: "Calm, engaged", flag: "ok" },
      ],
      question: {
        prompt: "Which findings need follow-up? Select all that apply.",
        options: ["Evening dose at 1800", "Trouble falling asleep", "Weight loss", "Doses taken with meals", "Calm, engaged mood"],
        answer: [0, 1, 2],
        why: "Last dose no later than 4 PM (insomnia). Report weight loss; track height + weight (growth suppression). Giving with meals is correct.",
      },
    },
  },

  // ───────── Anticonvulsants ─────────
  {
    id: "act:chart-valproic",
    kind: "chart",
    title: "Valproic Acid: Which Effect?",
    topic: "anticonv",
    concepts: ["valproic"],
    source: "Memory Aid · Anticonvulsants; One-member exceptions",
    difficulty: 3,
    data: {
      patient: "Client, 30, seizures + bipolar disorder",
      meds: ["Valproic acid PO"],
      rows: [
        { label: "Appetite", value: "Poor", flag: "high" },
        { label: "Abdominal pain", value: "Present", flag: "high" },
        { label: "Sclera", value: "Yellow", flag: "critical" },
        { label: "Liver enzymes", value: "Elevated", flag: "critical" },
      ],
      question: {
        prompt: "These findings point to which adverse effect?",
        options: ["Hepatotoxicity", "Stevens-Johnson syndrome", "Gingival hyperplasia", "Angle-closure glaucoma"],
        answer: [0],
        why: "Valproic acid = HEPATOTOXIC (anorexia, abdominal pain, jaundice). SJS: lamotrigine/carbamazepine; gums: phenytoin; glaucoma: topiramate.",
      },
    },
  },
];
