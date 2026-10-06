import type { Activity } from "@/lib/activities/types";

/* Clinical micro-simulations (kind "sim").
   Sources: docs/source/memory-aid.md, coag-notes.md, coag-slides.md. Every threshold, action and
   distractor is taken from those files; values sit clearly on one side of a course-stated threshold. */
export const SIMS: Activity[] = [
  // ───────── Heparin ─────────
  {
    id: "act:sim-heparin",
    kind: "sim",
    title: "Heparin Drip Snapshots",
    topic: "coag",
    concepts: ["hep-lab", "hep-bleeding", "hep-antidote", "hep-hit"],
    source: "M7L2 Coagulation Modifiers · Slides 2, 4",
    difficulty: 3,
    data: {
      client: "Client, 64, on IV heparin for a DVT",
      drug: "Heparin (IV infusion)",
      intro: "Snapshots from this client's heparin therapy.",
      nodes: [
        {
          id: "aptt-low",
          rows: [
            { label: "aPTT", value: "48 sec", flag: "low" },
            { label: "Platelets", value: "250,000", flag: "ok" },
          ],
          text: "Shift 1: the first aPTT result is back.",
          prompt: "How do you interpret an aPTT of 48 sec?",
          choices: [
            { label: "Subtherapeutic: still at clot risk", correct: true, feedback: "Goal is 1.5–2.5× normal ≈ 60–80 sec. Below goal = subtherapeutic: the client is STILL at risk for clots." },
            { label: "Therapeutic: within goal", correct: false, feedback: "48 sec is below the 60–80 sec goal." },
            { label: "Supratherapeutic: bleeding risk", correct: false, feedback: "Bleeding risk is ABOVE 80 sec. 48 sec is below goal." },
          ],
        },
        {
          id: "bleeding",
          rows: [
            { label: "aPTT", value: "108 sec", flag: "critical" },
            { label: "BP", value: "↓ from baseline", flag: "low" },
            { label: "HR", value: "↑ from baseline", flag: "high" },
            { label: "Urine", value: "Blood present", flag: "high" },
          ],
          text: "Shift 2: new bruises and a nosebleed.",
          prompt: "What do these findings suggest?",
          choices: [
            { label: "Supratherapeutic: signs of bleeding", correct: true, feedback: "aPTT > 80 sec = bleeding risk. ↓BP, ↑HR, bruising, epistaxis and blood in urine are bleeding signs." },
            { label: "Subtherapeutic: clot is extending", correct: false, feedback: "Clot risk is BELOW 60 sec. 108 sec is far above goal." },
            { label: "Expected heparin effect", correct: false, feedback: "Bruising, epistaxis, ↓BP and ↑HR are bleeding signs, not an expected effect." },
          ],
        },
        {
          id: "antidote",
          text: "Same shift: the provider suspects heparin toxicity and orders the antidote.",
          prompt: "How should the antidote be given?",
          choices: [
            { label: "Protamine, ≤ 50 mg per 10 min", correct: true, feedback: "Protamine reverses heparin. Give it SLOWLY, no faster than 50 mg/10 min, because it can cause hypotension." },
            { label: "Protamine, rapid IV push", correct: false, feedback: "Too fast: protamine can cause hypotension. No faster than 50 mg/10 min." },
            { label: "Vitamin K (phytonadione)", correct: false, feedback: "Vitamin K reverses warfarin, not heparin." },
            { label: "Idarucizumab", correct: false, feedback: "Idarucizumab reverses dabigatran, not heparin." },
          ],
        },
        {
          id: "hit",
          rows: [
            { label: "Platelets, day 1", value: "250,000", flag: "ok" },
            { label: "Platelets, day 6", value: "88,000", flag: "critical" },
          ],
          text: "Later: heparin was resumed. Day-6 platelets are back.",
          prompt: "What should the nurse do?",
          choices: [
            { label: "Hold heparin + notify provider", correct: true, feedback: "A drop ≥ 50% and a count < 100,000 → suspect HIT. Hold the heparin and notify the provider." },
            { label: "Continue; recheck next week", correct: false, feedback: "Platelets < 100,000 after a > 50% drop → suspect HIT: hold + notify now." },
            { label: "Give protamine; continue heparin", correct: false, feedback: "HIT is an immune platelet drop with clotting. The action is hold heparin + notify." },
          ],
        },
      ],
      debrief: [
        "aPTT goal 60–80 sec (1.5–2.5× normal): below = clot risk; above = bleeding risk.",
        "Bleeding signs: ↓BP, ↑HR, bruising, epistaxis, blood in urine/stool, ↓H&H.",
        "Protamine reverses heparin: no faster than 50 mg/10 min (hypotension).",
        "Platelets drop ≥ 50% or < 100,000 → suspect HIT: hold + notify.",
      ],
    },
  },

  // ───────── ACE inhibitor ─────────
  {
    id: "act:sim-ace",
    kind: "sim",
    title: "First Dose of Lisinopril",
    topic: "antihtn",
    concepts: ["ace-se-other", "ace-teach", "ace-hyperk", "ace-angioedema"],
    source: "Memory Aid · ACE inhibitors",
    difficulty: 3,
    data: {
      client: "Client, 58, new HTN diagnosis",
      drug: "Lisinopril (ACE inhibitor, -pril)",
      intro: "The client received a first dose of lisinopril at 0900.",
      nodes: [
        {
          id: "first-dose",
          rows: [
            { label: "First dose", value: "0900", flag: "note" },
            { label: "Time now", value: "1030", flag: "note" },
          ],
          text: "The client wants to walk to the bathroom alone.",
          prompt: "Best nursing action?",
          choices: [
            { label: "Check BP; have client rise slowly", correct: true, feedback: "First-dose orthostatic hypotension: watch BP ~2 hr after the first dose; rise slowly in stages." },
            { label: "Let the client walk alone", correct: false, feedback: "Risk of first-dose orthostatic hypotension. Check BP and have the client rise slowly." },
            { label: "No precautions after a first dose", correct: false, feedback: "The FIRST dose is when orthostatic hypotension is the concern. Watch BP ~2 hr after it." },
          ],
        },
        {
          id: "hold",
          rows: [
            { label: "BP", value: "92/60", flag: "low" },
            { label: "HR", value: "80", flag: "ok" },
          ],
          text: "Next morning the 0900 dose is due. No other parameter is ordered.",
          prompt: "SBP is 92. What do you do?",
          choices: [
            { label: "Hold the dose (SBP < 100)", correct: true, feedback: "ACE inhibitors: hold for SBP < 100 or per the ordered parameter." },
            { label: "Give the dose as scheduled", correct: false, feedback: "SBP 92 is below 100: hold the ACE inhibitor." },
            { label: "Give half the dose", correct: false, feedback: "Don't improvise a partial dose. SBP < 100 → hold." },
          ],
        },
        {
          id: "salt",
          text: "During teaching: “I'll switch to a salt substitute to cut sodium.”",
          prompt: "Best response?",
          choices: [
            { label: "Avoid salt substitutes (they're KCl)", correct: true, feedback: "Salt substitutes = KCl. ACE inhibitors retain K+ → risk of hyperkalemia." },
            { label: "Great idea for blood pressure", correct: false, feedback: "Salt substitutes are KCl; with an ACE inhibitor (K+ retained) → hyperkalemia." },
            { label: "Fine, if used only with meals", correct: false, feedback: "Timing doesn't help: avoid salt substitutes (KCl) on ACE inhibitors." },
          ],
        },
        {
          id: "angioedema",
          rows: [
            { label: "Lips", value: "Swollen", flag: "critical" },
            { label: "Client says", value: "“My tongue feels thick.”", flag: "critical" },
          ],
          text: "That evening the client calls you in.",
          prompt: "What do you do FIRST?",
          choices: [
            { label: "Assess airway + notify immediately", correct: true, feedback: "Swollen lips/tongue = angioedema = AIRWAY EMERGENCY. Assess airway + notify the provider IMMEDIATELY." },
            { label: "Reassure: it's the expected cough effect", correct: false, feedback: "Dry cough is the bradykinin effect. Tongue/lip swelling is angioedema: an airway emergency." },
            { label: "Recheck in 1 hour", correct: false, feedback: "Angioedema threatens the airway. Assess airway + notify now." },
          ],
        },
      ],
      debrief: [
        "First dose: orthostatic hypotension. Watch BP ~2 hr; rise slowly.",
        "Hold for SBP < 100 (or per ordered parameter).",
        "Avoid salt substitutes (KCl): ACE inhibitors retain K+.",
        "“Tongue feels thick” = angioedema → airway + notify IMMEDIATELY.",
      ],
    },
  },

  // ───────── Digoxin ─────────
  {
    id: "act:sim-digoxin",
    kind: "sim",
    title: "Digoxin Morning Check",
    topic: "hf",
    concepts: ["dig-hold", "dig-tox", "dig-intx", "dig-antidote"],
    source: "Memory Aid · Digoxin; Loop diuretics",
    difficulty: 3,
    data: {
      client: "Client, 76, HF + a-fib",
      drug: "Digoxin PO daily (also on furosemide)",
      intro: "Digoxin is due at 0900. The client also takes furosemide daily.",
      nodes: [
        {
          id: "pulse",
          text: "You assess the client before giving digoxin.",
          prompt: "How do you check the pulse?",
          choices: [
            { label: "Apical pulse for a full 60 sec", correct: true, feedback: "Digoxin: count the APICAL pulse for a FULL 60 seconds before every dose." },
            { label: "Radial pulse, 30 sec × 2", correct: false, feedback: "Digoxin needs the APICAL pulse counted for a full 60 seconds." },
            { label: "Apical pulse, 15 sec × 4", correct: false, feedback: "Count for a FULL 60 seconds: no shortcuts with digoxin." },
          ],
        },
        {
          id: "hold",
          rows: [{ label: "Apical pulse (full min)", value: "54/min", flag: "low" }],
          text: "You counted the apical pulse for one full minute.",
          prompt: "Apical pulse is 54. Action?",
          choices: [
            { label: "Hold the digoxin dose", correct: true, feedback: "Hold digoxin for an apical pulse < 60 (full minute) or any sign of toxicity." },
            { label: "Give: 54 is fine on digoxin", correct: false, feedback: "Apical < 60 → hold. Digoxin slows the heart (−chronotropic)." },
            { label: "Give it with food", correct: false, feedback: "Food doesn't change the rule. Apical < 60 → hold." },
          ],
        },
        {
          id: "low-k",
          rows: [
            { label: "Apical pulse", value: "72/min", flag: "ok" },
            { label: "K+", value: "Reported LOW", flag: "low" },
            { label: "Appetite", value: "“Not hungry since yesterday”", flag: "high" },
          ],
          text: "Next day: the client skipped breakfast.",
          prompt: "What is the main concern?",
          choices: [
            { label: "Possible digoxin toxicity", correct: true, feedback: "Furosemide → low K+ → digoxin toxicity (highest-risk pairing). Anorexia is the EARLIEST toxicity sign." },
            { label: "Hyperkalemia from furosemide", correct: false, feedback: "Furosemide WASTES K+ (K+ down). Low K+ raises digoxin toxicity risk." },
            { label: "Expected HF fatigue: no concern", correct: false, feedback: "Anorexia on digoxin is the earliest toxicity sign, and low K+ adds to the risk." },
          ],
        },
        {
          id: "antidote",
          rows: [
            { label: "Digoxin level", value: "2.6 ng/mL", flag: "critical" },
            { label: "Vision", value: "Yellow-green halos", flag: "critical" },
            { label: "GI", value: "Nausea, vomiting", flag: "high" },
          ],
          text: "Toxicity is confirmed. The provider orders the antidote.",
          prompt: "Which antidote do you anticipate?",
          choices: [
            { label: "Digoxin immune fab", correct: true, feedback: "Digoxin immune fab is the digoxin antidote." },
            { label: "Naloxone", correct: false, feedback: "Naloxone reverses opioids." },
            { label: "Protamine sulfate", correct: false, feedback: "Protamine reverses heparin and enoxaparin." },
            { label: "Flumazenil", correct: false, feedback: "Flumazenil reverses benzodiazepines (IV toxicity)." },
          ],
        },
      ],
      debrief: [
        "Apical pulse for a FULL 60 sec; hold if < 60 or any toxicity sign.",
        "Toxicity order: anorexia → N/V → vision changes/halos → dysrhythmias.",
        "Loop/thiazide → low K+ → digoxin toxicity (highest-risk pairing).",
        "Antidote: digoxin immune fab.",
      ],
    },
  },

  // ───────── Opioid ─────────
  {
    id: "act:sim-opioid",
    kind: "sim",
    title: "Post-op Morphine Watch",
    topic: "analgesics",
    concepts: ["op-hold", "op-triad", "op-antidote", "op-admin"],
    source: "Memory Aid · Opioids",
    difficulty: 3,
    data: {
      client: "Client, 50, post-op day 1",
      drug: "Morphine IV PRN",
      intro: "The client asks for IV morphine for incision pain.",
      nodes: [
        {
          id: "before",
          text: "The dose is checked with a second nurse.",
          prompt: "What do you do right before giving it?",
          choices: [
            { label: "Count the respiratory rate", correct: true, feedback: "Count RR before EVERY opioid dose." },
            { label: "Raise all 4 side rails", correct: false, feedback: "4 rails = restraint. Use 2 side rails + a bed alarm." },
            { label: "Push it fast for quick relief", correct: false, feedback: "Give IV opioids slowly, over 4–5 min." },
          ],
        },
        {
          id: "sbp",
          rows: [
            { label: "RR", value: "16/min", flag: "ok" },
            { label: "BP", value: "92/60", flag: "low" },
            { label: "HR", value: "80/min", flag: "ok" },
          ],
          text: "Hours later, the next dose is requested.",
          prompt: "What should the nurse do?",
          choices: [
            { label: "Hold the dose + notify", correct: true, feedback: "Opioid hold: RR < 12, SBP < 100 or HR < 60 → hold + notify. SBP is 92." },
            { label: "Give naloxone now", correct: false, feedback: "Naloxone is for RR < 10. RR is 16; the problem is SBP < 100 → hold + notify." },
            { label: "Give it: RR is normal", correct: false, feedback: "RR isn't the only check. SBP < 100 → hold + notify." },
          ],
        },
        {
          id: "triad",
          rows: [
            { label: "RR", value: "8/min", flag: "critical" },
            { label: "LOC", value: "Hard to arouse", flag: "critical" },
            { label: "Pupils", value: "Pinpoint", flag: "critical" },
          ],
          text: "That night, after a later dose, the client won't wake up.",
          prompt: "What is this, and what do you give?",
          choices: [
            { label: "Opioid toxicity triad → naloxone", correct: true, feedback: "↓LOC + resp depression + pinpoint pupils = emergency. RR < 10 → give naloxone." },
            { label: "Benzo toxicity → flumazenil", correct: false, feedback: "Pinpoint pupils + ↓RR + ↓LOC after morphine = opioid triad. Flumazenil is for benzos." },
            { label: "Normal post-op sleep: let rest", correct: false, feedback: "This is the opioid triad: an emergency. RR < 10 → naloxone." },
          ],
        },
        {
          id: "after",
          rows: [
            { label: "RR now", value: "16/min", flag: "ok" },
            { label: "LOC", value: "Awake", flag: "ok" },
          ],
          text: "Naloxone was given. The client is awake and breathing well.",
          prompt: "What next?",
          choices: [
            { label: "Monitor RR up to 2 hr; may repeat", correct: true, feedback: "Naloxone lasts only 20–30 min. Repeat doses may be needed; monitor RR up to 2 hr." },
            { label: "Stop monitoring: one dose is enough", correct: false, feedback: "Naloxone wears off in 20–30 min, so respiratory depression can return." },
            { label: "Give flumazenil as backup", correct: false, feedback: "Flumazenil reverses benzos, not opioids. Repeat naloxone if needed." },
          ],
        },
      ],
      debrief: [
        "Count RR before every dose. Hold + notify: RR < 12, SBP < 100, HR < 60.",
        "Triad: ↓LOC + resp depression + pinpoint pupils = emergency.",
        "RR < 10 → naloxone. It lasts 20–30 min: repeat, monitor RR up to 2 hr.",
        "IV opioids slowly over 4–5 min; 2 side rails + bed alarm.",
      ],
    },
  },

  // ───────── Status epilepticus ─────────
  {
    id: "act:sim-status",
    kind: "sim",
    title: "Status Epilepticus",
    topic: "anticonv",
    concepts: ["se-steps", "se-priority", "pht-iv"],
    source: "Memory Aid · Status epilepticus; Phenytoin",
    difficulty: 3,
    data: {
      client: "Client, 34, seizure disorder",
      drug: "Lorazepam IV → phenytoin IV",
      intro: "A tonic-clonic seizure won't stop: status epilepticus, a medical emergency.",
      nodes: [
        {
          id: "first",
          rows: [
            { label: "Seizure", value: "Continuous", flag: "critical" },
            { label: "IV access", value: "In place", flag: "ok" },
          ],
          text: "Continuous seizures risk anoxic brain injury.",
          prompt: "Which drug comes FIRST?",
          choices: [
            { label: "IV lorazepam (or diazepam)", correct: true, feedback: "Step 1: IV (or rectal) benzo, lorazepam or diazepam. It stops the CURRENT seizure." },
            { label: "IV phenytoin", correct: false, feedback: "Phenytoin is step 2: it prevents FURTHER seizures. The benzo stops the current one first." },
            { label: "A tablet placed in the mouth", correct: false, feedback: "NEVER put a tablet in a seizing client's mouth." },
            { label: "High-dose phenobarbital", correct: false, feedback: "Phenobarbital comes last, if seizures continue after midazolam/propofol." },
          ],
        },
        {
          id: "phenytoin",
          rows: [
            { label: "Next order", value: "Phenytoin IV", flag: "note" },
            { label: "Maintenance IV", value: "D5W running", flag: "note" },
          ],
          text: "Lorazepam is in. Phenytoin IV is next, to prevent further seizures.",
          prompt: "How do you give IV phenytoin?",
          choices: [
            { label: "NS only, ≤ 50 mg/min, NS flush", correct: true, feedback: "Phenytoin IV: normal saline ONLY (never dextrose), push ≤ 50 mg/min, flush the line with NS after." },
            { label: "Into the D5W line, fast push", correct: false, feedback: "Never dextrose, and push no faster than 50 mg/min." },
            { label: "IM in the deltoid instead", correct: false, feedback: "NEVER IM: absorption is too irregular." },
          ],
        },
        {
          id: "airway",
          rows: [
            { label: "Seizure", value: "Stopped", flag: "ok" },
            { label: "Breathing", value: "Shallow, noisy", flag: "critical" },
          ],
          text: "The seizure has stopped. The client is drowsy.",
          prompt: "What is the priority now?",
          choices: [
            { label: "Airway + breathing", correct: true, feedback: "Priority afterward = AIRWAY + BREATHING. The client may need mechanical ventilation." },
            { label: "Draw a phenytoin level", correct: false, feedback: "Levels matter, but airway + breathing come first." },
            { label: "Teach gum care", correct: false, feedback: "Teaching can wait. Airway + breathing first." },
          ],
        },
        {
          id: "safety",
          text: "You prepare the room in case of another seizure.",
          prompt: "Which setup is correct?",
          choices: [
            { label: "Padded rails, bed low, O2 ready", correct: true, feedback: "Seizure safety: pad side rails, bed in LOW position, oxygen flow-meter in the room." },
            { label: "Bed high, rails down for access", correct: false, feedback: "Bed goes in the LOW position, with padded side rails." },
            { label: "Bed low; no O2 needed in room", correct: false, feedback: "Keep an oxygen flow-meter in the room, plus padded rails." },
          ],
        },
      ],
      debrief: [
        "1) IV/rectal lorazepam or diazepam stops the CURRENT seizure.",
        "2) IV phenytoin prevents more: NS only, ≤ 50 mg/min, flush, never IM.",
        "3) Still seizing: midazolam or propofol → high-dose phenobarbital.",
        "Afterward: airway + breathing. Never a tablet in the mouth; pad rails, bed low.",
      ],
    },
  },

  // ───────── Acetaminophen toxicity ─────────
  {
    id: "act:sim-apap",
    kind: "sim",
    title: "Acetaminophen Overdose",
    topic: "analgesics",
    concepts: ["apap-tox", "apap-lab", "apap-antidote"],
    source: "Memory Aid · Acetaminophen",
    difficulty: 2,
    data: {
      client: "Client, 19, emergency department",
      drug: "Acetaminophen (overdose)",
      intro: "The client took a large amount of acetaminophen about 2 hours ago.",
      nodes: [
        {
          id: "early",
          rows: [
            { label: "Nausea, vomiting", value: "Yes", flag: "high" },
            { label: "Sweating", value: "Yes", flag: "high" },
            { label: "Abdominal pain", value: "Yes", flag: "high" },
            { label: "Sclera", value: "White", flag: "ok" },
          ],
          text: "Initial assessment.",
          prompt: "These findings are:",
          choices: [
            { label: "Early toxicity signs", correct: true, feedback: "EARLY acetaminophen toxicity: N/V/D, sweating, abdominal pain." },
            { label: "Late signs of liver failure", correct: false, feedback: "LATE = hepatic failure, coma, death; jaundice (sclera first) + dark urine." },
            { label: "Unrelated to acetaminophen", correct: false, feedback: "N/V, sweating and abdominal pain are the EARLY toxicity signs." },
          ],
        },
        {
          id: "level",
          rows: [{ label: "APAP level", value: "240 mcg/mL", flag: "critical" }],
          text: "The level was drawn within 4 hours of ingestion.",
          prompt: "How do you interpret 240 mcg/mL?",
          choices: [
            { label: "Toxic (> 200)", correct: true, feedback: "Therapeutic 10–20 mcg/mL; toxic > 200." },
            { label: "Therapeutic (10–20)", correct: false, feedback: "Therapeutic is 10–20 mcg/mL. 240 is above the toxic cutoff of 200." },
            { label: "Below therapeutic", correct: false, feedback: "240 is far ABOVE 10–20 and above the toxic cutoff of 200." },
          ],
        },
        {
          id: "antidote",
          text: "The provider orders the antidote.",
          prompt: "Which antidote do you prepare?",
          choices: [
            { label: "Acetylcysteine", correct: true, feedback: "Acetylcysteine is the acetaminophen antidote; IV is better tolerated." },
            { label: "Naloxone", correct: false, feedback: "Naloxone reverses opioids, not acetaminophen." },
            { label: "Vitamin K (phytonadione)", correct: false, feedback: "Vitamin K reverses warfarin." },
            { label: "Flumazenil", correct: false, feedback: "Flumazenil reverses benzodiazepines." },
          ],
        },
        {
          id: "late",
          text: "The team watches for progression.",
          prompt: "Which pair would signal LATE toxicity?",
          choices: [
            { label: "Yellow sclera + dark urine", correct: true, feedback: "Jaundice shows in the SCLERA first; with dark urine = late liver damage." },
            { label: "Nausea + sweating", correct: false, feedback: "Nausea and sweating are EARLY signs." },
            { label: "Abdominal pain + vomiting", correct: false, feedback: "Abdominal pain and vomiting are EARLY signs." },
          ],
        },
      ],
      debrief: [
        "Early: N/V/D, sweating, abdominal pain. Late: hepatic failure, coma, death.",
        "Jaundice shows in the sclera first; + dark urine = late liver damage.",
        "Level 10–20 mcg/mL; toxic > 200. Draw < 4 hr; after 4 hr assume toxic + treat.",
        "Antidote: acetylcysteine (IV better tolerated).",
      ],
    },
  },

  // ───────── Warfarin ─────────
  {
    id: "act:sim-warfarin",
    kind: "sim",
    title: "Warfarin INR Visits",
    topic: "coag",
    concepts: ["war-lab", "war-antidote", "war-teach", "war-intx"],
    source: "M7L2 Coagulation Modifiers · Slides 5–6",
    difficulty: 3,
    data: {
      client: "Client, 67, mechanical heart valve",
      drug: "Warfarin PO daily",
      intro: "You review this client's INR at follow-up visits.",
      nodes: [
        {
          id: "valve",
          rows: [
            { label: "Indication", value: "Mechanical heart valve", flag: "note" },
            { label: "INR", value: "3.8", flag: "ok" },
          ],
          text: "Visit 1: no bleeding signs.",
          prompt: "INR is 3.8. Give today's warfarin?",
          choices: [
            { label: "Give: within the valve goal", correct: true, feedback: "INR goal: 2–3 most indications; 2.5–3.5 PE treatment; 3–4.5 mechanical valve/recurrent embolism." },
            { label: "Hold: above 2–3", correct: false, feedback: "2–3 is for MOST indications. The mechanical valve goal is 3–4.5." },
            { label: "Give vitamin K", correct: false, feedback: "3.8 is within the valve goal. Vitamin K is for an INR that is too high." },
          ],
        },
        {
          id: "high",
          rows: [
            { label: "INR", value: "5.4", flag: "critical" },
            { label: "Gums", value: "Bleeding when brushing", flag: "high" },
            { label: "Recent med", value: "IV cephalosporin", flag: "note" },
          ],
          text: "Visit 2: after a course of an IV cephalosporin.",
          prompt: "What do you anticipate?",
          choices: [
            { label: "Hold warfarin; vitamin K antidote", correct: true, feedback: "Above range → hold. INR too high → vitamin K (phytonadione). IV cephalosporins ↑warfarin effect." },
            { label: "Give: valve clients need high INR", correct: false, feedback: "The valve goal tops out at 4.5. 5.4 is above range → hold." },
            { label: "Hold warfarin; protamine antidote", correct: false, feedback: "Protamine reverses heparin/enoxaparin. Warfarin → vitamin K." },
          ],
        },
        {
          id: "teach",
          text: "The client says: “I'll stop eating salads so my INR stays steady.”",
          prompt: "Best response?",
          choices: [
            { label: "Keep vitamin K intake consistent", correct: true, feedback: "Teach CONSISTENT vitamin K intake, not elimination; tell the provider if the diet changes." },
            { label: "Good: avoid all leafy greens", correct: false, feedback: "Elimination isn't the goal. Keep vitamin K intake CONSISTENT week to week." },
            { label: "Eat extra greens if you bleed", correct: false, feedback: "Keep vitamin K intake CONSISTENT and report bleeding signs to the provider." },
          ],
        },
      ],
      debrief: [
        "INR 2–3 most; 2.5–3.5 PE treatment; 3–4.5 mechanical valve/recurrent embolism.",
        "Hold if PT or INR is above the therapeutic range.",
        "Antidote: vitamin K (phytonadione), not protamine.",
        "Teach CONSISTENT vitamin K intake; tell the provider about diet changes.",
      ],
    },
  },
];
