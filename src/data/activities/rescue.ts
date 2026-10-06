import type { Activity } from "@/lib/activities/types";

/**
 * Antidote Rescue: a client deteriorates after a drug; drag the right rescue kit.
 * Antidote + kit names are exact ANTIDOTE_NAMES strings (src/data/antidotes.ts).
 * Vital-sign numbers sit clearly on the course-stated side of a threshold, or are shown as a
 * change from baseline where the course gives no number (bleeding = ↓BP, ↑HR).
 */
export const RESCUES: Activity[] = [
  // ───────────── ANALGESICS ─────────────
  {
    id: "act:rescue-opioid",
    kind: "rescue",
    title: "Rescue: post-op morphine",
    topic: "analgesics",
    concepts: ["op-antidote", "op-triad", "op-hold"],
    source: "Memory Aid · Opioids",
    difficulty: 1,
    data: {
      drug: "Morphine (IV)",
      story: "Post-op client on IV morphine is barely arousable.",
      vitals: [
        { label: "RR", value: "8 /min", bad: true },
        { label: "HR", value: "74" },
        { label: "BP", value: "118/72" },
      ],
      signs: ["↓LOC — barely arousable", "Pinpoint pupils", "Respiratory depression"],
      antidote: "Naloxone",
      kits: ["Flumazenil", "Naloxone", "Acetylcysteine", "Atropine"],
      note: "RR < 10 → naloxone. It lasts only 20–30 min — repeat doses, monitor RR up to 2 hr.",
    },
  },
  {
    id: "act:rescue-fentanyl",
    kind: "rescue",
    title: "Rescue: fentanyl patch + heat",
    topic: "analgesics",
    concepts: ["op-antidote", "op-pca-patch", "op-triad"],
    source: "Memory Aid · Opioids + one-member exceptions",
    difficulty: 2,
    data: {
      drug: "Fentanyl patch",
      story: "Client with a fentanyl patch slept on a heating pad; now hard to arouse.",
      vitals: [
        { label: "RR", value: "7 /min", bad: true },
        { label: "HR", value: "72" },
        { label: "BP", value: "116/70" },
      ],
      signs: ["Pinpoint pupils", "↓LOC — difficult to arouse", "Heating pad over the patch"],
      antidote: "Naloxone",
      kits: ["Atropine", "Digoxin immune fab", "Naloxone", "Flumazenil"],
      note: "Heat ↑ patch absorption → OD (fentanyl ≈100× morphine). Naloxone lasts 20–30 min — repeat, monitor RR up to 2 hr.",
    },
  },
  {
    id: "act:rescue-acetaminophen",
    kind: "rescue",
    title: "Rescue: too much acetaminophen",
    topic: "analgesics",
    concepts: ["apap-antidote", "apap-tox", "apap-lab"],
    source: "Memory Aid · Acetaminophen",
    difficulty: 2,
    data: {
      drug: "Acetaminophen",
      story: "Client took APAP tablets plus two other APAP-containing products.",
      vitals: [
        { label: "APAP level", value: "250 mcg/mL", bad: true },
        { label: "BP", value: "118/74" },
        { label: "RR", value: "18 /min" },
      ],
      signs: ["Nausea, vomiting, diarrhea", "Sweating", "Abdominal pain"],
      antidote: "Acetylcysteine",
      kits: ["Naloxone", "Acetylcysteine", "Vitamin K (phytonadione)", "Flumazenil"],
      note: "Toxic > 200 mcg/mL. Acetylcysteine (IV better tolerated). Level drawn < 4 hr; after 4 hr assume toxic + treat.",
    },
  },

  // ───────────── COAGULATION ─────────────
  {
    id: "act:rescue-heparin",
    kind: "rescue",
    title: "Rescue: bleeding on heparin drip",
    topic: "coag",
    concepts: ["hep-antidote", "hep-bleeding", "hep-lab"],
    source: "Coag Notes · Slides 2, 4",
    difficulty: 2,
    data: {
      drug: "Heparin infusion",
      story: "Client on a heparin drip has new bruises and a nosebleed.",
      vitals: [
        { label: "aPTT", value: "115 sec", bad: true },
        { label: "BP", value: "86/50 (was 128/80)", bad: true },
        { label: "HR", value: "122 (was 78)", bad: true },
      ],
      signs: ["Easy, excessive bruising", "Epistaxis (nosebleed)", "Blood in urine"],
      antidote: "Protamine sulfate",
      kits: ["Vitamin K (phytonadione)", "Protamine sulfate", "Idarucizumab", "Andexanet alfa"],
      note: "Give protamine SLOWLY — no faster than 50 mg per 10 min (causes hypotension). Avoid invasive procedures.",
    },
  },
  {
    id: "act:rescue-enoxaparin",
    kind: "rescue",
    title: "Rescue: enoxaparin overdose",
    topic: "coag",
    concepts: ["hep-antidote", "lmwh-moa", "hep-bleeding"],
    source: "Coag Notes · Slides 3–4",
    difficulty: 2,
    data: {
      drug: "Enoxaparin",
      story: "Post-op client got an extra enoxaparin dose; now passing tarry stools.",
      vitals: [
        { label: "BP", value: "90/54 (was 130/82)", bad: true },
        { label: "HR", value: "116 (was 80)", bad: true },
        { label: "H&H", value: "Dropping", bad: true },
      ],
      signs: ["Tarry stools", "Excessive bruising", "Bleeding around IV catheter"],
      antidote: "Protamine sulfate",
      kits: ["Idarucizumab", "Protamine sulfate", "Vitamin K (phytonadione)", "Aminocaproic acid"],
      note: "Same antidote as heparin: protamine sulfate, given slowly (≤50 mg/10 min). Avoid invasive procedures.",
    },
  },
  {
    id: "act:rescue-warfarin",
    kind: "rescue",
    title: "Rescue: warfarin and a high INR",
    topic: "coag",
    concepts: ["war-antidote", "war-lab", "hep-bleeding"],
    source: "Coag Notes · Slides 5–6",
    difficulty: 2,
    data: {
      drug: "Warfarin",
      story: "Client on warfarin for a-fib has bleeding gums and dark, tarry stools.",
      vitals: [
        { label: "INR", value: "6.2", bad: true },
        { label: "PT", value: "38 sec", bad: true },
        { label: "BP", value: "92/56 (was 134/84)", bad: true },
        { label: "HR", value: "112 (was 76)", bad: true },
      ],
      signs: ["Bleeding gums", "Tarry stools", "Easy bruising"],
      antidote: "Vitamin K (phytonadione)",
      kits: ["Protamine sulfate", "Idarucizumab", "Vitamin K (phytonadione)", "Andexanet alfa"],
      note: "Hold warfarin when PT or INR is above range. Vitamin K reverses warfarin only.",
    },
  },
  {
    id: "act:rescue-dabigatran",
    kind: "rescue",
    title: "Rescue: dabigatran bleed",
    topic: "coag",
    concepts: ["dti-antidote", "dti"],
    source: "Coag Notes · Slide 7; Coag Slides · Slide 7",
    difficulty: 2,
    data: {
      drug: "Dabigatran",
      story: "Client on dabigatran for a-fib has serious GI bleeding before emergency surgery.",
      vitals: [
        { label: "BP", value: "84/50 (was 128/78)", bad: true },
        { label: "HR", value: "124 (was 82)", bad: true },
      ],
      signs: ["Coffee-ground emesis", "Blood in stool", "Easy bruising"],
      antidote: "Idarucizumab",
      kits: ["Andexanet alfa", "Protamine sulfate", "Idarucizumab", "Vitamin K (phytonadione)"],
      note: "Dabigatran (direct thrombin inhibitor) is the only one reversed by idarucizumab — for serious bleeding or emergency surgery.",
    },
  },
  {
    id: "act:rescue-rivaroxaban",
    kind: "rescue",
    title: "Rescue: rivaroxaban bleed",
    topic: "coag",
    concepts: ["xa-antidote", "xa"],
    source: "Coag Slides · Slide 8; Coag Notes · Slide 8",
    difficulty: 3,
    data: {
      drug: "Rivaroxaban",
      story: "Client on rivaroxaban for a-fib has GI and GU bleeding.",
      vitals: [
        { label: "BP", value: "86/48 (was 132/80)", bad: true },
        { label: "HR", value: "120 (was 78)", bad: true },
      ],
      signs: ["Blood in stool", "Blood in urine", "Easy bruising"],
      antidote: "Andexanet alfa",
      kits: ["Idarucizumab", "Protamine sulfate", "Andexanet alfa", "Vitamin K (phytonadione)"],
      note: "Andexanet alfa reverses factor Xa inhibitors (FDA-approved 2018, per slide). Idarucizumab is for dabigatran only.",
    },
  },
  {
    id: "act:rescue-alteplase",
    kind: "rescue",
    title: "Rescue: alteplase hemorrhage",
    topic: "coag",
    concepts: ["tpa-antidote", "tpa-nursing"],
    source: "Coag Notes · Slides 12–13; Memory Aid · Alteplase",
    difficulty: 3,
    data: {
      drug: "Alteplase",
      story: "Alteplase stopped, blood products given — bleeding is still life-threatening.",
      vitals: [
        { label: "BP", value: "80/46 (was 138/86)", bad: true },
        { label: "HR", value: "128 (was 88)", bad: true },
      ],
      signs: ["Blood in stool", "Blood in urine", "Bleeding at IV sites"],
      antidote: "Aminocaproic acid",
      kits: ["Protamine sulfate", "Vitamin K (phytonadione)", "Idarucizumab", "Aminocaproic acid"],
      note: "Life-threatening bleed: stop the alteplase, give blood products, THEN aminocaproic acid if needed.",
    },
  },

  // ───────────── HEART FAILURE ─────────────
  {
    id: "act:rescue-digoxin",
    kind: "rescue",
    title: "Rescue: digoxin toxicity",
    topic: "hf",
    concepts: ["dig-antidote", "dig-tox", "dig-lab"],
    source: "Memory Aid · Digoxin",
    difficulty: 2,
    data: {
      drug: "Digoxin",
      story: "Client on digoxin + furosemide has refused meals for 2 days.",
      vitals: [
        { label: "Apical pulse (full min)", value: "48", bad: true },
        { label: "Digoxin level", value: "2.8 ng/mL", bad: true },
        { label: "K+", value: "Reported LOW", bad: true },
      ],
      signs: ["Anorexia, nausea, vomiting", "Yellow-green halos", "Irregular rhythm (dysrhythmia)"],
      antidote: "Digoxin immune fab",
      kits: ["Acetylcysteine", "Digoxin immune fab", "Naloxone", "Protamine sulfate"],
      note: "Hold digoxin: apical < 60 or any toxicity sign. Low K+ from loop/thiazide → toxicity. Anorexia = earliest sign.",
    },
  },

  // ───────────── CNS DEPRESSANTS ─────────────
  {
    id: "act:rescue-benzodiazepine",
    kind: "rescue",
    title: "Rescue: IV benzodiazepine toxicity",
    topic: "cnsdep",
    concepts: ["bz-antidote", "bz-se"],
    source: "Memory Aid · Benzodiazepines",
    difficulty: 2,
    data: {
      drug: "IV lorazepam",
      story: "After repeated IV lorazepam doses, client went drowsy → lethargic.",
      vitals: [
        { label: "Respirations", value: "Depressed", bad: true },
        { label: "LOC", value: "Now confused", bad: true },
      ],
      signs: ["Drowsiness → lethargy", "Confusion", "Respiratory depression"],
      antidote: "Flumazenil",
      kits: ["Naloxone", "Flumazenil", "Atropine", "Acetylcysteine"],
      note: "Flumazenil is for IV toxicity; oral ingestion → gastric lavage or activated charcoal. Maintain airway, monitor VS.",
    },
  },

  // ───────────── ANTIANGINAL ─────────────
  {
    id: "act:rescue-beta-blocker",
    kind: "rescue",
    title: "Rescue: beta-blocker overdose",
    topic: "angina",
    concepts: ["bb-overdose", "bb-hold"],
    source: "Memory Aid · Beta-blockers",
    difficulty: 3,
    data: {
      drug: "Metoprolol overdose",
      story: "Client took extra metoprolol doses; now symptomatic bradycardia.",
      vitals: [
        { label: "Apical HR", value: "42", bad: true },
        { label: "BP", value: "84/50", bad: true },
      ],
      signs: ["Pale", "Diaphoretic", "Lightheaded"],
      antidote: "Atropine",
      kits: ["Digoxin immune fab", "Naloxone", "Atropine", "Flumazenil"],
      note: "Withhold doses. Atropine for symptomatic bradycardia; glucagon + insulin are also part of overdose care.",
    },
  },
];
