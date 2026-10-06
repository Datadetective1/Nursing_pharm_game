import type { Activity } from "@/lib/activities/types";

/**
 * Timeline builders — ONLY sequences the sources order explicitly. Steps are listed in the correct order.
 */
export const SEQUENCES: Activity[] = [
  {
    id: "act:seq-status-epilepticus",
    kind: "sequence",
    title: "Status epilepticus steps",
    topic: "anticonv",
    concepts: ["se-steps", "se-priority"],
    source: "Memory Aid · Anticonvulsant Nursing + Status Epilepticus (MO8.8)",
    difficulty: 2,
    data: {
      prompt: "Status epilepticus: put the drug steps in order.",
      steps: [
        { text: "IV (or rectal) lorazepam or diazepam", detail: "Benzo stops the CURRENT seizure only" },
        { text: "IV phenytoin", detail: "Prevents further seizures" },
        { text: "Still seizing: midazolam or propofol", detail: "If seizures continue" },
        { text: "High-dose phenobarbital", detail: "After midazolam/propofol" },
      ],
      followUp: {
        prompt: "The seizures stop. What is the priority now?",
        options: ["Airway + breathing", "Pad the side rails", "Check the drug level", "Teach same-time daily dosing"],
        answer: [0],
        why: "Priority afterward = airway + breathing; the client may need mechanical ventilation.",
      },
    },
  },
  {
    id: "act:seq-digoxin-tox",
    kind: "sequence",
    title: "Digoxin toxicity timeline",
    topic: "hf",
    concepts: ["dig-tox", "dig-hold"],
    source: "Memory Aid · Digoxin (toxicity in order)",
    difficulty: 2,
    data: {
      prompt: "Digoxin toxicity: earliest sign → latest.",
      steps: [
        { text: "Anorexia", detail: "EARLIEST sign" },
        { text: "Nausea, vomiting, abdominal pain" },
        { text: "Fatigue, weakness, vision changes", detail: "Blurred; yellow-green or white halos" },
        { text: "Dysrhythmias", detail: "Late + worst (cardiotoxicity)" },
      ],
      followUp: {
        prompt: "A client on digoxin reports new anorexia. Best action?",
        options: ["Hold digoxin + report it", "Give it with an antacid", "Give it — anorexia is expected", "Recheck in one week"],
        answer: [0],
        why: "Anorexia is the earliest toxicity sign; hold for ANY sign of toxicity. Antacids ↓digoxin absorption.",
      },
    },
  },
  {
    id: "act:seq-apap-tox",
    kind: "sequence",
    title: "Acetaminophen toxicity timeline",
    topic: "analgesics",
    concepts: ["apap-tox", "apap-antidote"],
    source: "Memory Aid · Acetaminophen",
    difficulty: 2,
    data: {
      prompt: "Acetaminophen toxicity: early → late.",
      steps: [
        { text: "N/V/D, sweating, abdominal pain", detail: "EARLY signs" },
        { text: "Hepatic failure", detail: "LATE" },
        { text: "Coma" },
        { text: "Death" },
      ],
      followUp: {
        prompt: "Where does jaundice appear FIRST?",
        options: ["Sclera", "Palms", "Trunk", "Nail beds"],
        answer: [0],
        why: "Jaundice shows in the sclera first; jaundice + dark urine = late liver damage. Antidote: acetylcysteine.",
      },
    },
  },
  {
    id: "act:seq-benzo-tox",
    kind: "sequence",
    title: "Benzo toxicity progression",
    topic: "cnsdep",
    concepts: ["bz-se", "bz-antidote"],
    source: "Memory Aid · Benzodiazepines (acute toxicity)",
    difficulty: 2,
    data: {
      prompt: "Benzodiazepine acute toxicity: put it in order.",
      steps: [
        { text: "Drowsiness" },
        { text: "Lethargy" },
        { text: "Confusion" },
        { text: "Respiratory depression", detail: "→ cardiac arrest, profound hypotension" },
      ],
      followUp: {
        prompt: "This followed IV lorazepam. Which antidote?",
        options: ["Flumazenil", "Naloxone", "Protamine sulfate", "Acetylcysteine"],
        answer: [0],
        why: "Flumazenil reverses IV benzo toxicity. Also maintain airway, monitor VS, give fluids for BP.",
      },
    },
  },
  {
    id: "act:seq-sl-nitro",
    kind: "sequence",
    title: "SL nitro: unrelieved chest pain",
    topic: "angina",
    concepts: ["ntg-admin", "ntg-hold", "ntg-routes"],
    source: "Memory Aid · Nitroglycerin (DO/TEACH)",
    difficulty: 2,
    data: {
      prompt: "Chest pain at home: order the SL nitro steps.",
      steps: [
        { text: "Sit or lie down; take 1st SL dose", detail: "Sip water first; tingling = still potent" },
        { text: "Pain unrelieved after 5 min → call 911" },
        { text: "Take the 2nd SL dose" },
        { text: "Take a 3rd dose 5 min later if needed", detail: "SL ×3 doses, 5 min apart" },
        { text: "Stay seated 30 min after the last dose" },
      ],
      followUp: {
        prompt: "Why call 911 after only ONE unrelieved dose?",
        options: ["Unrelieved pain = MI until proven otherwise", "SL nitro is for prevention only", "Headache means the dose failed", "The patch should be applied first"],
        answer: [0],
        why: "Unrelieved chest pain = perfusion NOT restored = MI until proven otherwise. Time is muscle.",
      },
    },
  },
  {
    id: "act:seq-alteplase-bleed",
    kind: "sequence",
    title: "Alteplase bleed: in order",
    topic: "coag",
    concepts: ["tpa-antidote", "tpa-nursing", "hep-bleeding"],
    source: "Coag Notes · Slides 12–13; Memory Aid · Alteplase",
    difficulty: 2,
    data: {
      prompt: "Life-threatening bleeding on alteplase: order the steps.",
      steps: [
        { text: "Recognize blood loss: ↓BP + ↑HR", detail: "Plus bleeding at wounds/IV sites, GI, GU, cerebral" },
        { text: "Stop the alteplase" },
        { text: "Give blood products" },
        { text: "Give the antidote, if needed" },
      ],
      followUp: {
        prompt: "Which antidote is that?",
        options: ["Aminocaproic acid", "Protamine sulfate", "Vitamin K (phytonadione)", "Idarucizumab"],
        answer: [0],
        why: "Aminocaproic acid reverses alteplase — given after stopping the drug and giving blood products.",
      },
    },
  },
];
