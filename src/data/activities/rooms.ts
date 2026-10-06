import type { Activity } from "@/lib/activities/types";

/* "What's wrong with this client?" rooms (kind "room").
   Sources: docs/source/memory-aid.md, coag-notes.md. Each problem and each safe finding is a
   course-stated rule; no invented orders or protocols. */
export const ROOMS: Activity[] = [
  // ───────── Phenytoin IV ─────────
  {
    id: "act:room-phenytoin",
    kind: "room",
    title: "Phenytoin IV Safety Check",
    topic: "anticonv",
    concepts: ["pht-iv", "pht-se", "ac-levels", "pht-ci"],
    source: "Memory Aid · Phenytoin; Anticonvulsant levels",
    difficulty: 2,
    data: {
      client: "Client, 41, seizure disorder; IV phenytoin due",
      prompt: "Find every problem before the dose.",
      hotspots: [
        { id: "bag", object: "iv-bag", label: "IV bag", detail: "Phenytoin mixed in D5W", problem: true, why: "Phenytoin IV: normal saline ONLY, never dextrose." },
        { id: "pump", object: "pump", label: "Pump", detail: "Rate set to 100 mg/min", problem: true, why: "Push no faster than 50 mg/min." },
        { id: "tray", object: "tray", label: "Supply tray", detail: "IM needle set out “in case the IV fails”", problem: true, why: "NEVER give phenytoin IM: absorption is too irregular." },
        { id: "mouth", object: "mouth", label: "Gums", detail: "Overgrown gums; flosses “rarely”", problem: true, why: "Gingival hyperplasia: teach brush + floss ≥ 2×/day, dentist 2×/year." },
        { id: "labs", object: "labs", label: "Lab results", detail: "Phenytoin level 14 mcg/mL", problem: false, why: "Within the 10–20 mcg/mL range." },
        { id: "monitor", object: "monitor", label: "Cardiac monitor", detail: "Normal sinus rhythm, HR 78", problem: false, why: "No sinus bradycardia or heart block (these contraindicate IV phenytoin)." },
        { id: "vial", object: "vial", label: "Flush syringe", detail: "NS flush ready for after the dose", problem: false, why: "Correct: flush the line with NS after phenytoin." },
      ],
    },
  },

  // ───────── PCA + fentanyl patch ─────────
  {
    id: "act:room-pca-patch",
    kind: "room",
    title: "PCA + Fentanyl Patch Room",
    topic: "analgesics",
    concepts: ["op-pca-patch", "op-admin"],
    source: "Memory Aid · Opioids (PCA, patch)",
    difficulty: 2,
    data: {
      client: "Client, 58, post-op: morphine PCA + fentanyl patch",
      prompt: "Find every opioid safety problem.",
      hotspots: [
        { id: "pca", object: "pca", label: "PCA button", detail: "Daughter presses it while the client sleeps", problem: true, why: "ONLY the client presses the PCA button. The lockout prevents overdose." },
        { id: "patch", object: "patch", label: "Fentanyl patch", detail: "Heating pad placed over the patch", problem: true, why: "NO heat: it ↑absorption → overdose." },
        { id: "client", object: "patient", label: "History", detail: "Opioid-naive before surgery", problem: true, why: "Fentanyl patch is for opioid-TOLERANT clients only." },
        { id: "tray", object: "tray", label: "Supply tray", detail: "Scissors set out to trim the next patch", problem: true, why: "Never cut a fentanyl patch." },
        { id: "monitor", object: "monitor", label: "Pulse oximeter", detail: "Continuous pulse ox running", problem: false, why: "Correct: PCA needs continuous pulse oximetry." },
        { id: "bed", object: "bed", label: "Bed", detail: "2 side rails up, bed alarm on", problem: false, why: "Correct: 2 rails + bed alarm (4 rails = restraint)." },
        { id: "calendar", object: "calendar", label: "Patch log", detail: "Change every 72 hr; rotate sites", problem: false, why: "Correct: 72 hr, rotate sites; fold + flush the old patch." },
      ],
    },
  },

  // ───────── Potassium / furosemide / digoxin ─────────
  {
    id: "act:room-potassium",
    kind: "room",
    title: "Potassium, Furosemide + Digoxin",
    topic: "diuretics",
    concepts: ["k-iv", "loop-admin", "loop-intx", "diur-teach"],
    source: "Memory Aid · Potassium; Loop diuretics; Digoxin",
    difficulty: 3,
    data: {
      client: "Client, 72, HF on furosemide + digoxin",
      prompt: "Find every safety problem.",
      hotspots: [
        { id: "vial", object: "vial", label: "KCl syringe", detail: "KCl drawn up for IV push", problem: true, why: "NEVER IV push KCl: always diluted + infused with continuous cardiac monitoring." },
        { id: "pump", object: "pump", label: "IV furosemide", detail: "Set to push at 40 mg/min", problem: true, why: "IV furosemide no faster than 20 mg/min (transient hearing loss)." },
        { id: "labs", object: "labs", label: "Lab results", detail: "K+ reported LOW; digoxin due today", problem: true, why: "Low K+ → digoxin toxicity risk. Furosemide is held for low K+." },
        { id: "client", object: "patient", label: "Client says", detail: "“At home I take my water pill at bedtime.”", problem: true, why: "Give furosemide in the MORNING, not HS: nocturia + night fall risk." },
        { id: "calendar", object: "calendar", label: "Weight log", detail: "Daily, same time + scale, after voiding", problem: false, why: "Correct. Report a gain > 5 lb in 2 days." },
        { id: "tray", object: "tray", label: "Meal tray", detail: "Banana + orange juice", problem: false, why: "Correct: ↑K+ foods with a K+-wasting diuretic." },
        { id: "monitor", object: "monitor", label: "Cardiac monitor", detail: "Continuous monitoring on", problem: false, why: "Correct: IV potassium needs continuous cardiac monitoring." },
      ],
    },
  },

  // ───────── Anticoagulants ─────────
  {
    id: "act:room-anticoag",
    kind: "room",
    title: "Heparin to Warfarin Room",
    topic: "coag",
    concepts: ["hep-admin", "hep-hit", "war-teach", "hep-intx"],
    source: "M7L2 Coagulation Modifiers · Slides 4, 6",
    difficulty: 3,
    data: {
      client: "Client, 61, DVT: SubQ heparin, starting warfarin",
      prompt: "Find every anticoagulant safety problem.",
      hotspots: [
        { id: "labs", object: "labs", label: "Platelets", detail: "Day 1: 240,000 → day 6: 85,000", problem: true, why: "Drop ≥ 50% and < 100,000 → suspect HIT: hold heparin + notify." },
        { id: "vial", object: "vial", label: "Heparin syringe", detail: "Plan: aspirate before injecting", problem: true, why: "SubQ heparin: do NOT aspirate." },
        { id: "cup", object: "med-cup", label: "Home meds", detail: "Ibuprofen at bedside for back pain", problem: true, why: "NSAIDs + anticoagulants → ↑bleeding risk (interaction)." },
        { id: "tray", object: "tray", label: "Toiletries", detail: "Firm toothbrush + straight razor", problem: true, why: "Use a soft-bristle toothbrush + an electric razor." },
        { id: "skin", object: "skin", label: "Injection sites", detail: "Abdomen, ≥ 2 in from navel, rotated", problem: false, why: "Correct: abdomen, avoid 2 in around the umbilicus; rotate + record sites." },
        { id: "client", object: "patient", label: "Client says", detail: "“I eat salad 3×/week and will keep that up.”", problem: false, why: "Correct: CONSISTENT vitamin K intake, not elimination." },
        { id: "calendar", object: "calendar", label: "Follow-up", detail: "Regular PT/INR checks scheduled", problem: false, why: "Correct: keep regular PT/INR appointments." },
      ],
    },
  },

  // ───────── Mannitol ─────────
  {
    id: "act:room-mannitol",
    kind: "room",
    title: "Mannitol for ↑ICP",
    topic: "diuretics",
    concepts: ["mannitol-admin", "mannitol-moa", "mannitol-se"],
    source: "Memory Aid · Mannitol",
    difficulty: 2,
    data: {
      client: "Client, 45, head injury with ↑ICP",
      prompt: "Find every mannitol safety problem.",
      hotspots: [
        { id: "vial", object: "vial", label: "Mannitol vial", detail: "Crystals visible in the vial", problem: true, why: "Crystals → don't give; return to pharmacy to warm." },
        { id: "tray", object: "tray", label: "Draw-up supplies", detail: "Regular (non-filter) needle", problem: true, why: "Use a FILTERED needle to draw up mannitol." },
        { id: "bag", object: "iv-bag", label: "IV line", detail: "Standard tubing, no filter", problem: true, why: "Infuse mannitol through FILTERED tubing." },
        { id: "client", object: "patient", label: "Care plan", detail: "BP + I&O listed; no neuro checks", problem: true, why: "NEURO status is the priority assessment on mannitol." },
        { id: "mar", object: "mar", label: "MAR", detail: "Mannitol IV for ↑ICP", problem: false, why: "Correct: IV only. It ↑serum osmolality, pulling fluid back to ↓ICP." },
        { id: "labs", object: "labs", label: "Labs ordered", detail: "Electrolytes + strict I&O", problem: false, why: "Correct: monitor I&O + electrolytes (F&E imbalance risk)." },
      ],
    },
  },
];
