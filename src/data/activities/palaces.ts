import type { Activity } from "@/lib/activities/types";

/**
 * Memory palaces: one room per high-yield drug. Each object encodes one course fact
 * through an intuitive association (salad → consistent vitamin K intake).
 */
export const PALACES: Activity[] = [
  {
    id: "act:palace-warfarin",
    kind: "palace",
    title: "Warfarin kitchen",
    topic: "coag",
    concepts: ["war-teach", "war-antidote", "war-lab", "war-moa", "war-ci", "war-intx"],
    source: "M7L2 Coagulation Modifiers · Slides 5–6; Memory Aid · Warfarin",
    difficulty: 1,
    data: {
      scene: "A client's kitchen, set up for life on warfarin",
      objects: [
        { id: "salad", icon: "salad", label: "Salad bowl", chunk: "teach", fact: "Keep vitamin K intake CONSISTENT — don't cut it out; tell provider if diet changes", x: 15, y: 18 },
        { id: "calendar", icon: "calendar", label: "Wall calendar", chunk: "lab", fact: "Keep regular PT/INR checks — INR 2–3 for most; hold if PT/INR above range", x: 50, y: 12 },
        { id: "k-vial", icon: "flask", label: "“K” vial", chunk: "antidote", fact: "Antidote: vitamin K (phytonadione) — warfarin is the only one it reverses", x: 85, y: 20 },
        { id: "factors", icon: "ban", label: "Crossed-out factor tiles", chunk: "moa", fact: "Antagonizes vitamin K → blocks factors VII, IX, X + prothrombin", x: 30, y: 48 },
        { id: "baby", icon: "baby", label: "Baby photo", chunk: "ci", fact: "Contraindicated in pregnancy (also allergy, acute or chronic bleeding)", x: 72, y: 50 },
        { id: "brush", icon: "brush", label: "Soft toothbrush", chunk: "teach", fact: "Soft-bristle toothbrush + electric razor to prevent bleeding", x: 14, y: 82 },
        { id: "pills", icon: "pill", label: "Pill organizer", chunk: "intx", fact: "NSAIDs, APAP, glucocorticoids ↑ effect; phenytoin, carbamazepine, OCPs ↓ it", x: 58, y: 84 },
      ],
    },
  },
  {
    id: "act:palace-heparin",
    kind: "palace",
    title: "Heparin & enoxaparin med room",
    topic: "coag",
    concepts: ["hep-lab", "hep-antidote", "hep-hit", "hep-admin", "lmwh-admin", "lmwh-lab"],
    source: "M7L2 Coagulation Modifiers · Slides 2–4; Memory Aid · Heparin, Enoxaparin",
    difficulty: 2,
    data: {
      scene: "A med room stocked for heparin and enoxaparin",
      objects: [
        { id: "scale", icon: "scale", label: "Balance scale", chunk: "lab", fact: "aPTT goal 1.5–2.5× normal ≈ 60–80 sec: low = clot risk, high = bleed risk", x: 20, y: 15 },
        { id: "clock", icon: "clock", label: "Slow-ticking clock", chunk: "antidote", fact: "Antidote protamine sulfate — give SLOWLY, ≤50 mg per 10 min (hypotension)", x: 62, y: 18 },
        { id: "alarm", icon: "alert", label: "Falling-plates alarm", chunk: "hold", fact: "Platelets drop ≥50% or <100,000 → suspect HIT: hold + notify provider", x: 88, y: 45 },
        { id: "syringe", icon: "syringe", label: "Heparin syringe", chunk: "action", fact: "SubQ in abdomen ≥2 in from umbilicus; do NOT aspirate; rotate + record", x: 45, y: 45 },
        { id: "bubble", icon: "droplet", label: "Air bubble", chunk: "action", fact: "Enoxaparin: don't expel the air bubble (unless dose adjusted); no massage", x: 12, y: 55 },
        { id: "tube", icon: "flask", label: "Lab tube", chunk: "lab", fact: "Enoxaparin: no lab measures effect — monitor CrCl, platelets, H&H", x: 30, y: 85 },
        { id: "brush", icon: "brush", label: "Soft toothbrush", chunk: "teach", fact: "Soft toothbrush + electric razor; report bruising, nosebleeds, tarry stools", x: 75, y: 82 },
      ],
    },
  },
  {
    id: "act:palace-digoxin",
    kind: "palace",
    title: "Digoxin heart room",
    topic: "hf",
    concepts: ["dig-tox", "dig-hold", "dig-lab", "dig-antidote", "dig-moa", "dig-intx"],
    source: "Memory Aid · Digoxin",
    difficulty: 2,
    data: {
      scene: "A cardiac room for a client on digoxin",
      objects: [
        { id: "heart", icon: "heart", label: "Pumping heart", chunk: "moa", fact: "Harder, stronger, slower: ↑force, ↓heart rate, ↓conduction", x: 12, y: 22 },
        { id: "stopwatch", icon: "clock", label: "Stopwatch", chunk: "hold", fact: "Count apical pulse a FULL 60 sec — hold if < 60 or any toxicity sign", x: 40, y: 12 },
        { id: "meal", icon: "salad", label: "Untouched meal", chunk: "se", fact: "Anorexia = EARLIEST toxicity sign; then N/V, abdominal pain", x: 78, y: 15 },
        { id: "eye-chart", icon: "eye", label: "Eye chart", chunk: "se", fact: "Vision changes: blurred, yellow-green or white halos", x: 55, y: 45 },
        { id: "banana", icon: "banana", label: "Banana", chunk: "intx", fact: "Loop/thiazide → low K+ → digoxin TOXICITY; check K+", x: 18, y: 62 },
        { id: "tube", icon: "droplet", label: "Blood tube", chunk: "lab", fact: "Digoxin level 0.5–0.8 ng/mL; > 2 ng/mL = toxicity (lecture slide)", x: 85, y: 60 },
        { id: "vial", icon: "flask", label: "Rescue vial", chunk: "antidote", fact: "Antidote: digoxin immune fab", x: 48, y: 85 },
      ],
    },
  },
  {
    id: "act:palace-opioids",
    kind: "palace",
    title: "Opioid recovery room",
    topic: "analgesics",
    concepts: ["op-hold", "op-antidote", "op-triad", "op-admin", "op-pca-patch", "op-se"],
    source: "Memory Aid · Opioids",
    difficulty: 2,
    data: {
      scene: "A post-op room for a client on opioids",
      objects: [
        { id: "breath", icon: "wind", label: "Breath cloud", chunk: "hold", fact: "Count RR before every dose; hold RR <12, SBP <100, HR <60 + notify", x: 25, y: 12 },
        { id: "vial", icon: "flask", label: "Rescue vial", chunk: "antidote", fact: "RR <10 → naloxone; lasts 20–30 min — repeat, monitor RR up to 2 hr", x: 70, y: 10 },
        { id: "eyes", icon: "eye", label: "Tiny-pupil mirror", chunk: "se", fact: "Triad: ↓LOC + resp depression + PINPOINT pupils = emergency", x: 90, y: 40 },
        { id: "bed", icon: "bed", label: "Bed with 2 rails", chunk: "action", fact: "2 side rails + bed alarm (4 rails = restraint)", x: 50, y: 40 },
        { id: "heat", icon: "thermometer", label: "Heating pad", chunk: "teach", fact: "Fentanyl patch: opioid-tolerant only, 72 hr, NO heat (↑absorption → OD)", x: 10, y: 45 },
        { id: "salad", icon: "salad", label: "Fiber salad", chunk: "teach", fact: "Constipation: ↑fluid/fiber/ambulation, then get a softener order", x: 28, y: 80 },
        { id: "pca", icon: "clock", label: "PCA lockout timer", chunk: "teach", fact: "PCA: lockout prevents OD; ONLY the client presses; continuous pulse ox", x: 72, y: 78 },
      ],
    },
  },
  {
    id: "act:palace-phenytoin",
    kind: "palace",
    title: "Phenytoin neuro room",
    topic: "anticonv",
    concepts: ["pht-iv", "pht-se", "pht-intx", "ac-levels"],
    source: "Memory Aid · Phenytoin; Anticonvulsants — levels",
    difficulty: 2,
    data: {
      scene: "A neuro room for a client on phenytoin",
      objects: [
        { id: "smile", icon: "smile", label: "Big gummy smile", chunk: "se", fact: "Gingival hyperplasia → brush + floss ≥2×/day, dentist 2×/year", x: 15, y: 15 },
        { id: "saline", icon: "droplet", label: "Saline bag", chunk: "hold", fact: "IV: normal saline ONLY (never dextrose); flush line with NS after", x: 55, y: 15 },
        { id: "clock", icon: "clock", label: "Wall clock", chunk: "hold", fact: "IV push no faster than 50 mg/min", x: 88, y: 28 },
        { id: "im", icon: "syringe", label: "Trashed IM needle", chunk: "hold", fact: "NEVER give IM — absorption too irregular", x: 35, y: 50 },
        { id: "eyes", icon: "eye", label: "Wobbly eyes poster", chunk: "se", fact: "CNS: nystagmus, double vision, ataxia, sedation", x: 75, y: 58 },
        { id: "gauge", icon: "thermometer", label: "Level gauge", chunk: "lab", fact: "Level 10–20 mcg/mL; above range → hold + notify", x: 12, y: 85 },
        { id: "pill-pack", icon: "pill", label: "Birth-control pack", chunk: "intx", fact: "Oral contraceptives less effective → backup birth control; ↓warfarin effect", x: 52, y: 88 },
      ],
    },
  },
];
