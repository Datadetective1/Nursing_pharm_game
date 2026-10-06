import type { Activity } from "@/lib/activities/types";

/**
 * Body maps: where a drug acts (only when the sources state it) + course-listed adverse/toxic
 * effects mapped to an obvious region, with a reverse "which drug?" quiz.
 */
export const BODY: Activity[] = [
  // ───────────── ANALGESICS ─────────────
  {
    id: "act:body-opioids",
    kind: "body",
    title: "Opioids: body map",
    topic: "analgesics",
    concepts: ["op-se", "op-triad", "op-moa"],
    source: "Memory Aid · Opioids",
    difficulty: 1,
    data: {
      drug: "Morphine (opioids)",
      acts: [{ region: "brain", text: "Opioid receptors in CNS → block pain" }],
      effects: [
        { region: "brain", text: "Sedation; ↓LOC" },
        { region: "eyes", text: "Pinpoint pupils (toxicity triad)" },
        { region: "lungs", text: "Respiratory depression" },
        { region: "gi", text: "Nausea; constipation" },
        { region: "kidneys", text: "Urinary retention" },
      ],
      quiz: {
        prompt: "Pinpoint pupils, resp depression, constipation light up. Which drug?",
        options: ["Acetaminophen", "Morphine", "Digoxin", "Furosemide"],
        answer: [1],
        why: "NARCS + triad (↓LOC, resp depression, pinpoint pupils) = opioid. RR < 10 → naloxone.",
      },
    },
  },
  {
    id: "act:body-acetaminophen",
    kind: "body",
    title: "Acetaminophen: body map",
    topic: "analgesics",
    concepts: ["apap-tox", "apap-moa"],
    source: "Memory Aid · Acetaminophen",
    difficulty: 2,
    data: {
      drug: "Acetaminophen",
      acts: [{ region: "brain", text: "↓Prostaglandins in CNS" }],
      effects: [
        { region: "gi", text: "Early toxicity: N/V/D, abdominal pain" },
        { region: "skin", text: "Early toxicity: sweating" },
        { region: "liver", text: "Late: hepatic failure" },
        { region: "eyes", text: "Jaundice — sclera first" },
        { region: "brain", text: "Late: coma" },
      ],
      quiz: {
        prompt: "Sweating + N/V early, then yellow sclera + liver failure. Which drug?",
        options: ["Morphine", "Ibuprofen", "Phenytoin", "Acetaminophen"],
        answer: [3],
        why: "APAP toxicity: early N/V/D, sweating, abd pain; late hepatic failure. Jaundice shows in the sclera first. Antidote: acetylcysteine.",
      },
    },
  },

  // ───────────── ANTI-INFLAMMATORY ─────────────
  {
    id: "act:body-nsaids",
    kind: "body",
    title: "NSAIDs: body map",
    topic: "antiinflam",
    concepts: ["nsaid-gi", "nsaid-moa", "nsaid-salicylism"],
    source: "Memory Aid · NSAIDs + one-member exceptions",
    difficulty: 2,
    data: {
      drug: "NSAIDs (ibuprofen · ketorolac · aspirin)",
      acts: [
        { region: "gi", text: "↓COX-1 → stomach unprotected" },
        { region: "blood", text: "↓COX-1 → ↓platelet aggregation" },
      ],
      effects: [
        { region: "gi", text: "#1: GI ulcer/bleed, tarry stools" },
        { region: "kidneys", text: "↓Kidney function" },
        { region: "ears", text: "Tinnitus — salicylism (ASA only)" },
        { region: "brain", text: "Salicylism: HA, dizziness (ASA)" },
        { region: "heart", text: "BBW: MI/stroke risk (not ASA)" },
      ],
      quiz: {
        prompt: "Tarry stools, coffee-ground emesis, tinnitus light up. Which drug?",
        options: ["Morphine", "Digoxin", "Aspirin", "Lorazepam"],
        answer: [2],
        why: "NSAID #1 adverse effect = GI ulcer/bleed (COX-1 loss). Tinnitus = salicylism, aspirin only.",
      },
    },
  },

  // ───────────── ANTIHYPERTENSIVES ─────────────
  {
    id: "act:body-ace-inhibitors",
    kind: "body",
    title: "ACE inhibitors: body map",
    topic: "antihtn",
    concepts: ["ace-cough", "ace-angioedema", "ace-hyperk", "ace-se-other", "ace-moa"],
    source: "Memory Aid · ACE inhibitors",
    difficulty: 2,
    data: {
      drug: "ACE inhibitors (-pril)",
      acts: [{ region: "vessels", text: "Vasodilation (↓AngII, ↑bradykinin)" }],
      effects: [
        { region: "lungs", text: "Dry hacking cough (bradykinin)" },
        { region: "mouth", text: "Angioedema: lips/tongue → airway" },
        { region: "mouth", text: "Dysgeusia (altered taste)" },
        { region: "blood", text: "Hyperkalemia; neutropenia (↓WBC)" },
        { region: "vessels", text: "1st-dose orthostatic hypotension" },
        { region: "skin", text: "Rash" },
      ],
      quiz: {
        prompt: "Dry cough, swollen tongue, high K+ light up. Which drug class?",
        options: ["Loop diuretic", "CCB (-pine)", "ACE inhibitor (-pril)", "Beta-blocker (-olol)"],
        answer: [2],
        why: "ACE inhibitors ↑bradykinin → dry cough, retain K+ (hyperkalemia). Angioedema = airway emergency.",
      },
    },
  },
  {
    id: "act:body-ccb",
    kind: "body",
    title: "Calcium channel blockers: body map",
    topic: "antihtn",
    concepts: ["ccb-se", "ccb-moa"],
    source: "Memory Aid · CCBs + one-member exceptions",
    difficulty: 2,
    data: {
      drug: "CCBs (-pine · -zem · -mil)",
      acts: [
        { region: "vessels", text: "Vascular smooth muscle dilation" },
        { region: "heart", text: "dilTIAZem + verapaMIL also ↓HR" },
      ],
      effects: [
        { region: "vessels", text: "Orthostatic hypotension" },
        { region: "vessels", text: "Peripheral (ankle) edema" },
        { region: "heart", text: "Reflex tachycardia, palpitations" },
        { region: "heart", text: "Bradycardia, dysrhythmias" },
        { region: "gi", text: "Constipation (worst: verapamil)" },
      ],
      quiz: {
        prompt: "Ankle edema, reflex tachycardia, constipation light up. Which drug?",
        options: ["Amlodipine", "Furosemide", "Atenolol", "Phenytoin"],
        answer: [0],
        why: "-pine CCBs dilate vessels → more peripheral edema + reflex tachycardia. Ca channels in the intestine → ↓motility → constipation.",
      },
    },
  },

  // ───────────── DIURETICS ─────────────
  {
    id: "act:body-loop-diuretic",
    kind: "body",
    title: "Furosemide: body map",
    topic: "diuretics",
    concepts: ["loop-se", "loop-moa"],
    source: "Memory Aid · Loop diuretic",
    difficulty: 2,
    data: {
      drug: "Furosemide (loop, K+-wasting)",
      acts: [{ region: "kidneys", text: "Loop of Henle: ↓Na/Cl reabsorption" }],
      effects: [
        { region: "ears", text: "Ototoxicity (hearing loss)" },
        { region: "blood", text: "Hypokalemia; hyperglycemia" },
        { region: "heart", text: "Dysrhythmias (from low K+)" },
        { region: "muscle", text: "Weakness (from low K+)" },
        { region: "vessels", text: "Dehydration, hypotension" },
      ],
      quiz: {
        prompt: "Hearing loss, low K+, weakness light up. Which drug?",
        options: ["Spironolactone", "Hydrochlorothiazide", "Furosemide", "ACE inhibitor (-pril)"],
        answer: [2],
        why: "Only loop diuretics cause ototoxicity; HCTZ also wastes K+ but spares hearing. Low K+ → weakness, dysrhythmias.",
      },
    },
  },
  {
    id: "act:body-spironolactone",
    kind: "body",
    title: "Spironolactone: body map",
    topic: "diuretics",
    concepts: ["spiro-se", "spiro-moa"],
    source: "Memory Aid · Spironolactone + one-member exceptions",
    difficulty: 2,
    data: {
      drug: "Spironolactone (K+-sparing)",
      acts: [{ region: "kidneys", text: "Blocks aldosterone: Na/H2O out, K+ kept" }],
      effects: [
        { region: "blood", text: "Hyperkalemia; metabolic acidosis" },
        { region: "heart", text: "HyperK: bradycardia, ECG changes" },
        { region: "muscle", text: "HyperK: weakness, numbness/tingling" },
        { region: "skin", text: "Hirsutism (endocrine effect)" },
        { region: "brain", text: "Drowsiness" },
      ],
      quiz: {
        prompt: "High K+, gynecomastia, deepened voice. Which drug?",
        options: ["Furosemide", "Hydrochlorothiazide", "Mannitol", "Spironolactone"],
        answer: [3],
        why: "Spironolactone blocks aldosterone → retains K+. It is the only diuretic causing gynecomastia/deepened voice.",
      },
    },
  },

  // ───────────── HEART FAILURE ─────────────
  {
    id: "act:body-digoxin",
    kind: "body",
    title: "Digoxin: body map",
    topic: "hf",
    concepts: ["dig-tox", "dig-moa"],
    source: "Memory Aid · Digoxin",
    difficulty: 1,
    data: {
      drug: "Digoxin",
      acts: [{ region: "heart", text: "↑Force, ↓rate, ↓conduction" }],
      effects: [
        { region: "gi", text: "1st sign: anorexia; then N/V, abd pain" },
        { region: "muscle", text: "Fatigue, weakness" },
        { region: "eyes", text: "Blurred; yellow-green/white halos" },
        { region: "heart", text: "Dysrhythmias = late + worst" },
      ],
      quiz: {
        prompt: "Anorexia, yellow-green halos, dysrhythmia light up. Which drug?",
        options: ["Furosemide", "Digoxin", "Morphine", "Atenolol"],
        answer: [1],
        why: "Digoxin toxicity: anorexia → N/V, abd pain → fatigue, halos → dysrhythmias. Antidote: digoxin immune fab.",
      },
    },
  },

  // ───────────── COAGULATION ─────────────
  {
    id: "act:body-heparin",
    kind: "body",
    title: "Heparin: body map",
    topic: "coag",
    concepts: ["hep-bleeding", "hep-hit", "hep-moa"],
    source: "M7L2 Coagulation Modifiers · Slides 2, 4; Memory Aid · Heparin",
    difficulty: 2,
    data: {
      drug: "Heparin",
      acts: [{ region: "blood", text: "Activates antithrombin → ↓thrombin + Xa" }],
      effects: [
        { region: "blood", text: "Bleeding: ↓H&H" },
        { region: "blood", text: "HIT: ↓platelets + thrombosis" },
        { region: "skin", text: "Easy bruising; IV-site bleeding" },
        { region: "gi", text: "Blood in stool; coffee-ground emesis" },
        { region: "kidneys", text: "Blood in urine" },
        { region: "vessels", text: "↓BP (blood loss)" },
        { region: "heart", text: "↑HR (blood loss)" },
      ],
      quiz: {
        prompt: "Bruising, blood in stool, ↓H&H, falling platelets light up. Which drug?",
        options: ["Digoxin", "Furosemide", "Lorazepam", "Heparin"],
        answer: [3],
        why: "Bleeding signs: ↓H&H, ↓BP, ↑HR, bruising, blood in stool/urine. Platelets ↓≥50% or <100,000 → suspect HIT: hold + notify.",
      },
    },
  },

  // ───────────── LIPIDS ─────────────
  {
    id: "act:body-statins",
    kind: "body",
    title: "Statins: body map",
    topic: "lipids",
    concepts: ["lip-statin-se"],
    source: "Memory Aid · Lipid-lowering agents",
    difficulty: 1,
    data: {
      drug: "Statins",
      acts: [],
      effects: [
        { region: "liver", text: "Hepatotoxicity (↑AST)" },
        { region: "muscle", text: "Myopathy: aches, pain, tenderness" },
        { region: "muscle", text: "Rhabdomyolysis (↑CK)" },
        { region: "kidneys", text: "Dark urine (rhabdomyolysis)" },
      ],
      quiz: {
        prompt: "Muscle pain, ↑CK, dark urine, ↑AST light up. Which drug?",
        options: ["Niacin", "Statins", "Colesevelam", "Furosemide"],
        answer: [1],
        why: "Statins: hepatotoxicity + myopathy → rhabdomyolysis (↑CK, dark urine). Unexplained muscle pain → hold + check CK.",
      },
    },
  },

  // ───────────── ANTIANGINAL ─────────────
  {
    id: "act:body-beta-blockers",
    kind: "body",
    title: "Beta-blockers: body map",
    topic: "angina",
    concepts: ["bb-se", "bb-moa", "bb-select"],
    source: "Memory Aid · Beta-blockers + one-member exceptions",
    difficulty: 2,
    data: {
      drug: "Beta-blockers (-olol)",
      acts: [
        { region: "heart", text: "B1 = heart: ↓HR" },
        { region: "lungs", text: "B2 = lungs (nonselective blocks)" },
      ],
      effects: [
        { region: "heart", text: "Bradycardia" },
        { region: "vessels", text: "Hypotension" },
        { region: "lungs", text: "Bronchoconstriction (nonselective)" },
        { region: "blood", text: "Hypoglycemia — and masks it" },
        { region: "brain", text: "Dizziness, depression" },
        { region: "muscle", text: "Fatigue, weakness" },
      ],
      quiz: {
        prompt: "Bradycardia, bronchoconstriction, masked hypoglycemia. Which drug?",
        options: ["Amlodipine", "Lorazepam", "Propranolol", "Furosemide"],
        answer: [2],
        why: "Nonselective (B1 + B2) beta-blockers like propranolol: ↓HR, bronchoconstriction, mask hypoglycemia (block warning tachycardia).",
      },
    },
  },

  // ───────────── CNS DEPRESSANTS ─────────────
  {
    id: "act:body-benzodiazepines",
    kind: "body",
    title: "Benzodiazepines: body map",
    topic: "cnsdep",
    concepts: ["bz-se", "bz-moa"],
    source: "Memory Aid · Benzodiazepines",
    difficulty: 1,
    data: {
      drug: "Benzodiazepines (-pam / -lam)",
      acts: [{ region: "brain", text: "↑GABA → CNS depression" }],
      effects: [
        { region: "brain", text: "Drowsiness, incoordination" },
        { region: "brain", text: "Paradoxical: excitation, rage" },
        { region: "lungs", text: "Respiratory depression" },
        { region: "gi", text: "N/V, anorexia" },
        { region: "vessels", text: "Toxicity: profound hypotension" },
        { region: "heart", text: "Toxicity: cardiac arrest" },
      ],
      quiz: {
        prompt: "Drowsiness, incoordination, paradoxical rage light up. Which drug?",
        options: ["Lorazepam", "Methylphenidate", "Digoxin", "Furosemide"],
        answer: [0],
        why: "Benzos ↑GABA → CNS depression; paradoxical excitation/rage can occur. IV toxicity antidote: flumazenil.",
      },
    },
  },

  // ───────────── CNS STIMULANTS ─────────────
  {
    id: "act:body-stimulants",
    kind: "body",
    title: "CNS stimulants: body map",
    topic: "cnsstim",
    concepts: ["stim-se", "stim-moa"],
    source: "Memory Aid · CNS stimulants",
    difficulty: 1,
    data: {
      drug: "Amphetamine / methylphenidate",
      acts: [{ region: "brain", text: "↑Norepinephrine + dopamine (CNS)" }],
      effects: [
        { region: "brain", text: "Insomnia, restlessness, tremors" },
        { region: "brain", text: "Psychosis: hallucinations, paranoia" },
        { region: "gi", text: "↓Appetite, weight loss" },
        { region: "heart", text: "Tachycardia, dysrhythmias, chest pain" },
        { region: "vessels", text: "↑BP" },
      ],
      quiz: {
        prompt: "Insomnia, ↓appetite, tachycardia, ↑BP light up. Which drug?",
        options: ["Lorazepam", "Methylphenidate", "Metoprolol", "Morphine"],
        answer: [1],
        why: "Stimulants ↑NE + dopamine — THINK CAFFEINE: insomnia, ↓appetite/weight loss, ↑HR and BP.",
      },
    },
  },

  // ───────────── ANTICONVULSANTS ─────────────
  {
    id: "act:body-phenytoin",
    kind: "body",
    title: "Phenytoin: body map",
    topic: "anticonv",
    concepts: ["pht-se", "pht-moa"],
    source: "Memory Aid · Phenytoin + one-member exceptions",
    difficulty: 2,
    data: {
      drug: "Phenytoin",
      acts: [
        { region: "brain", text: "↓Sodium influx → ↓abnormal firing" },
        { region: "heart", text: "Antiarrhythmic (ventricular)" },
      ],
      effects: [
        { region: "mouth", text: "Gingival hyperplasia" },
        { region: "eyes", text: "Nystagmus, double vision" },
        { region: "brain", text: "Sedation, ataxia, ↓cognition" },
        { region: "heart", text: "Dysrhythmias" },
        { region: "vessels", text: "Hypotension" },
        { region: "skin", text: "Hirsutism, coarse facial features" },
      ],
      quiz: {
        prompt: "Gingival hyperplasia, nystagmus, hirsutism light up. Which drug?",
        options: ["Valproic acid", "Phenytoin", "Topiramate", "Lamotrigine"],
        answer: [1],
        why: "Phenytoin is the only anticonvulsant causing gingival hyperplasia — brush + floss ≥2×/day, dentist 2×/year.",
      },
    },
  },
  {
    id: "act:body-valproic",
    kind: "body",
    title: "Valproic acid: body map",
    topic: "anticonv",
    concepts: ["valproic"],
    source: "Memory Aid · Anticonvulsants + one-member exceptions",
    difficulty: 2,
    data: {
      drug: "Valproic acid",
      acts: [{ region: "brain", text: "Controls neuron excitation" }],
      effects: [
        { region: "liver", text: "Hepatotoxicity: jaundice, abd pain" },
        { region: "gi", text: "N/V, indigestion; pancreatitis" },
        { region: "blood", text: "Thrombocytopenia" },
        { region: "brain", text: "CNS effects (hyperammonemia)" },
      ],
      quiz: {
        prompt: "Jaundice, pancreatitis, low platelets, hyperammonemia. Which drug?",
        options: ["Phenytoin", "Topiramate", "Valproic acid", "Lamotrigine"],
        answer: [2],
        why: "Valproic acid is THE hepatotoxic anticonvulsant; also pancreatitis, thrombocytopenia, hyperammonemia.",
      },
    },
  },
  {
    id: "act:body-topiramate",
    kind: "body",
    title: "Topiramate: body map",
    topic: "anticonv",
    concepts: ["topiramate"],
    source: "Memory Aid · Anticonvulsants + one-member exceptions",
    difficulty: 2,
    data: {
      drug: "Topiramate",
      acts: [{ region: "brain", text: "Blocks Na channels, ↑GABA" }],
      effects: [
        { region: "eyes", text: "Angle-closure glaucoma; diplopia" },
        { region: "skin", text: "↓Sweating with ↑body temp" },
        { region: "brain", text: "Somnolence, dizziness, confusion" },
        { region: "brain", text: "↑Suicide risk" },
        { region: "gi", text: "Anorexia + weight loss" },
        { region: "blood", text: "Metabolic acidosis" },
      ],
      quiz: {
        prompt: "↓Sweating with ↑body temp + angle-closure glaucoma. Which drug?",
        options: ["Phenytoin", "Valproic acid", "Carbamazepine", "Topiramate"],
        answer: [3],
        why: "Topiramate is the anticonvulsant with ↓sweating (↑body temp) + angle-closure glaucoma; also ↑suicide risk.",
      },
    },
  },
];
