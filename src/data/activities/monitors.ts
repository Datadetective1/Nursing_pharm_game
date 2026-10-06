import type { Activity } from "@/lib/activities/types";

/* Lab dashboards (kind "monitor"): tap every tile that needs nurse action.
   Sources: docs/source/memory-aid.md, coag-notes.md. Numeric values sit clearly on one side of a
   course-stated threshold; where the course gives no number (K+, AST, CK) the tile says HIGH/LOW. */
export const MONITORS: Activity[] = [
  // ───────── Heparin ─────────
  {
    id: "act:mon-heparin",
    kind: "monitor",
    title: "Heparin Drip Dashboard",
    topic: "coag",
    concepts: ["hep-lab", "hep-bleeding", "hep-hit"],
    source: "Coag Notes · Slides 2, 4",
    difficulty: 2,
    data: {
      client: "Client, 59, PE on IV heparin",
      meds: ["Heparin IV infusion"],
      tiles: [
        { label: "aPTT", value: "112", unit: "sec", action: true, why: "> 80 sec = supratherapeutic → bleeding risk." },
        { label: "Platelets (baseline 250,000)", value: "230,000", action: false, why: "Not < 100,000 and not a ≥ 50% drop: no HIT criteria met." },
        { label: "Nose", value: "Epistaxis", action: true, why: "Bleeding from the nares is a bleeding sign." },
        { label: "Hgb / Hct", value: "↓ from baseline", action: true, why: "Falling H&H = bleeding sign." },
        { label: "BP", value: "126/80", unit: "mmHg", action: false, why: "No ↓BP yet." },
        { label: "HR", value: "78", unit: "/min", action: false, why: "No ↑HR yet." },
      ],
    },
  },

  // ───────── Warfarin ─────────
  {
    id: "act:mon-warfarin",
    kind: "monitor",
    title: "Warfarin Clinic Board",
    topic: "coag",
    concepts: ["war-lab", "war-intx", "war-teach"],
    source: "Coag Notes · Slides 5–6",
    difficulty: 2,
    data: {
      client: "Client, 72, a-fib on warfarin (no valve)",
      meds: ["Warfarin PO daily"],
      tiles: [
        { label: "INR", value: "4.2", action: true, why: "Above 2–3 (most indications) → hold warfarin." },
        { label: "PT", value: "31", unit: "sec", action: true, why: "Above 18–24 sec (1.5–2× control) → hold." },
        { label: "New supplement", value: "Ginkgo", action: true, why: "Ginkgo ↑bleeding risk with warfarin." },
        { label: "Vitamin K foods", value: "Same as usual", action: false, why: "Correct: consistent intake, not elimination." },
        { label: "BP", value: "128/76", unit: "mmHg", action: false, why: "No ↓BP to suggest bleeding." },
        { label: "Bruising", value: "None new", action: false, why: "No new bleeding signs." },
      ],
    },
  },

  // ───────── Digoxin + furosemide ─────────
  {
    id: "act:mon-digoxin",
    kind: "monitor",
    title: "Digoxin + Furosemide Check",
    topic: "hf",
    concepts: ["dig-hold", "dig-lab", "dig-intx", "diur-teach"],
    source: "Memory Aid · Digoxin; Loop diuretics",
    difficulty: 3,
    data: {
      client: "Client, 80, HF on digoxin + furosemide",
      meds: ["Digoxin PO daily", "Furosemide PO daily"],
      tiles: [
        { label: "Apical pulse (full min)", value: "56", unit: "/min", action: true, why: "< 60 → hold digoxin." },
        { label: "Digoxin level", value: "1.0", unit: "ng/mL", action: false, why: "Within 0.5–1.5 ng/mL." },
        { label: "K+", value: "LOW", action: true, why: "Low K+ → digoxin toxicity risk; furosemide is held for low K+." },
        { label: "Weight", value: "+6 lb in 2 days", action: true, why: "Report a gain > 5 lb in 2 days." },
        { label: "BP", value: "122/74", unit: "mmHg", action: false, why: "No hypotension." },
        { label: "Appetite", value: "Normal", action: false, why: "No anorexia (the earliest digoxin toxicity sign)." },
      ],
    },
  },

  // ───────── Anticonvulsant levels ─────────
  {
    id: "act:mon-anticonv",
    kind: "monitor",
    title: "Anticonvulsant Level Board",
    topic: "anticonv",
    concepts: ["ac-levels", "lamotrigine", "carbamazepine"],
    source: "Memory Aid · Anticonvulsants (levels, rash)",
    difficulty: 3,
    data: {
      client: "Neuro unit: six clients' morning results",
      meds: ["Phenytoin", "Carbamazepine", "Valproic acid", "Phenobarbital", "Topiramate", "Lamotrigine"],
      tiles: [
        { label: "Phenytoin level", value: "26", unit: "mcg/mL", action: true, why: "Above 10–20 = toxicity → hold + notify." },
        { label: "Carbamazepine level", value: "8", unit: "mcg/mL", action: false, why: "Within 4–12 (the narrowest range)." },
        { label: "Valproic acid level", value: "30", unit: "mcg/mL", action: true, why: "Below 50–100 = subtherapeutic → seizure risk." },
        { label: "Phenobarbital level", value: "25", unit: "mcg/mL", action: false, why: "Within 10–40." },
        { label: "Topiramate level", value: "12", unit: "mcg/mL", action: false, why: "Within 5–20." },
        { label: "Lamotrigine client", value: "New rash", action: true, why: "ANY rash on lamotrigine → hold + notify (Stevens-Johnson)." },
      ],
    },
  },

  // ───────── Statin ─────────
  {
    id: "act:mon-statin",
    kind: "monitor",
    title: "Statin Follow-up Labs",
    topic: "lipids",
    concepts: ["lip-statin-se", "lip-goals", "lip-statin-intx"],
    source: "Memory Aid · Lipid-lowering agents",
    difficulty: 2,
    data: {
      client: "Client, 66, on rosuvastatin",
      meds: ["Rosuvastatin PO daily"],
      tiles: [
        { label: "Total cholesterol", value: "180", unit: "mg/dL", action: false, why: "At goal: < 200." },
        { label: "LDL", value: "85", unit: "mg/dL", action: false, why: "At goal: < 100." },
        { label: "HDL", value: "68", unit: "mg/dL", action: false, why: "At goal: > 60." },
        { label: "AST", value: "HIGH", action: true, why: "↑AST = statin hepatotoxicity sign." },
        { label: "Muscles", value: "Unexplained thigh pain", action: true, why: "Unexplained muscle pain → hold + check CK (rhabdomyolysis)." },
        { label: "Urine", value: "Dark", action: true, why: "Dark urine + muscle pain can signal rhabdomyolysis." },
        { label: "Diet", value: "Grapefruit juice daily", action: true, why: "Grapefruit ↑statin levels → toxicity." },
      ],
    },
  },

  // ───────── Opioid vitals ─────────
  {
    id: "act:mon-opioid",
    kind: "monitor",
    title: "Before the Next Morphine Dose",
    topic: "analgesics",
    concepts: ["op-hold", "op-se", "op-triad"],
    source: "Memory Aid · Opioids",
    difficulty: 2,
    data: {
      client: "Client, 55, post-op day 2, morphine PRN",
      meds: ["Morphine IV PRN"],
      tiles: [
        { label: "RR", value: "16", unit: "/min", action: false, why: "Not < 12: no RR hold." },
        { label: "BP", value: "118/74", unit: "mmHg", action: false, why: "SBP not < 100." },
        { label: "HR", value: "54", unit: "/min", action: true, why: "HR < 60 → hold + notify." },
        { label: "Pupils", value: "Normal size", action: false, why: "Not pinpoint: no toxicity triad." },
        { label: "LOC", value: "Awake, alert", action: false, why: "No ↓LOC." },
        { label: "Last BM", value: "4 days ago", action: true, why: "Constipation: ↑fluid/fiber/ambulation, then get a softener order." },
      ],
    },
  },
];
