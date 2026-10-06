import type { WorldId } from "@/lib/types";
import { CONCEPT_BY_ID, CONCEPTS, WORLD_BY_ID } from "./curriculum";

/**
 * Study by Drug Type — the Drug Library taxonomy.
 *
 * Organized the way the instructor's lectures are: Module → drug type (blueprint content area) →
 * class / drug unit (one lecture slide topic). Every leaf UNIT has a micro-lesson (src/data/lessons) and
 * a concept list that powers Learn → Practice → Test. DRUG entries let the learner pick a single
 * medication: they point at a unit and (optionally) narrow it to that drug's concepts.
 *
 * Provenance: `source` names the lecture file(s) each unit is taught from.
 */

export interface StudyUnit {
  id: string;
  title: string;
  /** short line under the title (members, suffix, or the instructor's class label) */
  subtitle: string;
  group: string;
  icon: string;
  concepts: string[];
  /** drug ids (src/data/curriculum.ts DRUGS) used to keep drug-level practice on-topic */
  drugIds: string[];
  /** extra search terms (members, suffixes, abbreviations) */
  aka: string[];
  source: string;
}

export interface DrugEntry {
  id: string;
  name: string;
  unit: string;
  /** narrow the unit to these concepts when this drug is studied on its own */
  concepts?: string[];
  drugIds: string[];
  aka?: string[];
}

export interface StudyGroup {
  id: string;
  module: WorldId;
  title: string;
  subtitle: string;
  icon: string;
  units: string[];
}

export const GROUPS: StudyGroup[] = [
  // ───────── MODULE 5 · Pain & Inflammatory Medications ─────────
  { id: "g-analgesics", module: "w5", title: "Analgesics", subtitle: "Opioid · non-opioid · other analgesics", icon: "💊", units: ["u-apap", "u-tramadol", "u-opioids"] },
  { id: "g-antiinflam", module: "w5", title: "Anti-Inflammatory & Antigout", subtitle: "NSAIDs · antigout drugs", icon: "🔥", units: ["u-nsaids", "u-antigout"] },
  // ───────── MODULE 6 · Antihypertensives, Diuretics & Heart Failure ─────────
  { id: "g-antihtn", module: "w6", title: "Antihypertensives", subtitle: "Common terms · clonidine · ACE · ARB · CCB", icon: "🫁", units: ["u-htn-basics", "u-acei", "u-arb", "u-ccb", "u-clonidine"] },
  { id: "g-diuretics", module: "w6", title: "Diuretics", subtitle: "Loop · thiazide · K+-sparing · osmotic · K+", icon: "💧", units: ["u-loop", "u-thiazide", "u-spiro", "u-mannitol", "u-potassium"] },
  { id: "g-hf", module: "w6", title: "Heart Failure Drugs", subtitle: "Digoxin · how the HF drugs work", icon: "❤️", units: ["u-digoxin", "u-hf-team"] },
  // ───────── MODULE 7 · Antianginal, Coagulation Modifiers & Lipid-Lowering ─────────
  { id: "g-angina", module: "w7", title: "Antianginals", subtitle: "Nitroglycerin · beta-blockers · NAOMI", icon: "✨", units: ["u-nitro", "u-bb", "u-naomi"] },
  { id: "g-anticoag", module: "w7", title: "Anticoagulants", subtitle: "Heparin · enoxaparin · warfarin · DTIs · Xa inhibitors", icon: "🩸", units: ["u-coag-map", "u-heparin", "u-lmwh", "u-warfarin", "u-dti", "u-xa"] },
  { id: "g-antiplatelet", module: "w7", title: "Antiplatelets", subtitle: "Aspirin · clopidogrel", icon: "🔗", units: ["u-antiplatelets"] },
  { id: "g-thrombolytic", module: "w7", title: "Thrombolytics", subtitle: "Alteplase", icon: "💥", units: ["u-alteplase"] },
  { id: "g-lipids", module: "w7", title: "Lipid-Lowering Agents", subtitle: "Statins · colesevelam · gemfibrozil · ezetimibe", icon: "🧈", units: ["u-statins", "u-colesevelam", "u-gemfibrozil", "u-ezetimibe"] },
  // ───────── MODULE 8 · CNS Stimulants, Depressants & Anticonvulsants ─────────
  { id: "g-cnsstim", module: "w8", title: "CNS Stimulants", subtitle: "Amphetamine · methylphenidate", icon: "☕", units: ["u-stimulants"] },
  { id: "g-cnsdep", module: "w8", title: "CNS Depressants", subtitle: "Benzodiazepines · zolpidem · muscle relaxants", icon: "😴", units: ["u-benzos", "u-zolpidem", "u-muscle"] },
  { id: "g-anticonv", module: "w8", title: "Anticonvulsants", subtitle: "Six drugs · levels · status epilepticus", icon: "🧠", units: ["u-phenytoin", "u-phenobarbital", "u-carbamazepine", "u-topiramate", "u-valproic", "u-lamotrigine", "u-ac-nursing", "u-status"] },
  // ───────── MODULE 1 · Dosage calculations ─────────
  { id: "g-calc", module: "w1", title: "Dosage Calculations", subtitle: "All 7 blueprint calc types", icon: "🧮", units: ["u-calc"] },
];

const U = (id: string, group: string, title: string, subtitle: string, icon: string, concepts: string[], drugIds: string[], aka: string[], source: string): StudyUnit => ({ id, group, title, subtitle, icon, concepts, drugIds, aka, source });

const L5 = { n: "M5L1 Non-Opioid Pain Notes", o: "M5L2 Opioid Pain Notes", a: "M5L3 Anti-Inflammatory and Antigout Drugs Notes" };
const L6 = { h: "M6L1 Antihypertensives Notes", d: "M6L2 Diuretics", f: "M6L3 Heart Failure Drugs Notes" };
const L7 = { a: "M7L1 Antianginal Medications", c: "M7L2 Coagulation Modifiers Notes", l: "M7L3 Lipid-Lowering Agents Notes" };
const L8 = { s: "M8L1 CNS Stimulants", d: "M8L2 CNS Depressants Notes", a: "M8L3 Anticonvulsants Notes" };

export const UNITS: StudyUnit[] = [
  // Module 5
  U("u-apap", "g-analgesics", "Acetaminophen", "Non-opioid analgesic", "🧪", ["pain-basics", "apap-moa", "apap-tox", "apap-ci", "apap-lab", "apap-max", "apap-antidote", "apap-teach"], ["acetaminophen", "acetylcysteine"], ["tylenol", "apap", "non-opioid", "nonopioid", "acetylcysteine"], L5.n),
  U("u-tramadol", "g-analgesics", "Tramadol", "Miscellaneous analgesic", "⚡", ["tram-moa", "tram-seizure", "tram-intx"], ["tramadol"], ["other analgesic", "miscellaneous"], L5.n),
  U("u-opioids", "g-analgesics", "Opioid Analgesics", "morphine · hydromorphone · fentanyl · meperidine", "💊", ["op-moa", "op-se", "op-triad", "op-ci", "op-intx", "op-controlled", "op-hold", "op-antidote", "op-admin", "op-pca-patch", "op-meperidine"], ["morphine", "hydromorphone", "fentanyl", "meperidine", "opioids", "naloxone"], ["opioid", "narcotic", "naloxone", "narcan", "pca", "patch", "narcs", "codeine", "oxycodone", "methadone"], L5.o),
  U("u-nsaids", "g-antiinflam", "NSAIDs", "aspirin · ibuprofen · naproxen · ketorolac · celecoxib", "🔥", ["nsaid-moa", "nsaid-gi", "nsaid-salicylism", "nsaid-reye", "nsaid-ci", "nsaid-caution", "nsaid-intx", "nsaid-hold", "nsaid-teach"], ["ibuprofen", "ketorolac", "aspirin", "celecoxib", "nsaids"], ["nsaid", "cox", "anti-inflammatory", "salicylism", "reye"], L5.a),
  U("u-antigout", "g-antiinflam", "Antigout Drugs", "allopurinol · probenecid · colchicine", "🦶", ["gout-patho", "gout-allopurinol", "gout-probenecid", "gout-colchicine", "gout-teach"], ["allopurinol", "colchicine", "probenecid"], ["gout", "uric acid"], L5.a),
  // Module 6
  U("u-htn-basics", "g-antihtn", "Antihypertensive Basics", "Suffixes + common terms", "🔤", ["htn-suffix", "htn-terms"], [], ["terms", "suffix", "orthostatic", "reflex tachycardia", "names"], L6.h),
  U("u-clonidine", "g-antihtn", "Clonidine", "Alpha-2 agonist", "🌙", ["clonidine"], ["clonidine"], ["alpha-2", "alpha 2"], L6.h),
  U("u-acei", "g-antihtn", "ACE Inhibitors", "-pril · lisinopril · captopril · enalapril", "🫁", ["ace-moa", "ace-cough", "ace-angioedema", "ace-hyperk", "ace-se-other", "ace-ci", "ace-intx", "ace-teach"], ["acei"], ["ace", "pril", "-pril", "lisinopril", "captopril", "enalapril", "angioedema", "park"], L6.h),
  U("u-arb", "g-antihtn", "ARBs", "-sartan · losartan · valsartan", "🛡️", ["arb-moa", "arb-se", "arb-ci"], ["arb"], ["arb", "sartan", "-sartan", "losartan", "valsartan", "candesartan", "olmesartan", "angiotensin receptor"], L6.h),
  U("u-ccb", "g-antihtn", "Calcium Channel Blockers", "-pine · -zem · -mil", "🧱", ["ccb-moa", "ccb-se", "ccb-ci", "ccb-intx", "ccb-teach", "ccb-angina"], ["ccb", "diltiazem", "verapamil", "amlodipine", "nifedipine"], ["ccb", "calcium", "pine", "zem", "mil", "amlodipine", "diltiazem", "verapamil", "nifedipine", "grapefruit"], `${L6.h}; ${L7.a}`),
  U("u-loop", "g-diuretics", "Loop Diuretics", "Furosemide · K+-wasting", "💧", ["loop-moa", "loop-se", "loop-ci", "loop-intx", "loop-admin", "diur-teach"], ["furosemide"], ["loop", "furosemide", "lasix", "torsemide", "bumetanide", "henle"], L6.d),
  U("u-thiazide", "g-diuretics", "Thiazide Diuretics", "Hydrochlorothiazide · K+-wasting", "🚰", ["thz-moa", "thz-se", "thz-ci", "diur-teach"], ["hctz"], ["thiazide", "hctz", "hydrochlorothiazide"], L6.d),
  U("u-spiro", "g-diuretics", "Potassium-Sparing Diuretics", "Spironolactone", "🧂", ["spiro-moa", "spiro-se", "spiro-ci", "spiro-teach"], ["spironolactone"], ["k-sparing", "potassium sparing", "spironolactone", "aldosterone", "triamterene", "amiloride"], L6.d),
  U("u-mannitol", "g-diuretics", "Osmotic Diuretics", "Mannitol", "🧠", ["mannitol-moa", "mannitol-se", "mannitol-admin"], ["mannitol"], ["osmotic", "mannitol", "icp"], L6.d),
  U("u-potassium", "g-diuretics", "Potassium Replacement", "Oral vs IV · K+ up/down", "🍌", ["k-iv", "k-hyperk", "k-po", "k-updown"], ["potassium"], ["potassium", "k+", "kcl", "potassium chloride", "hyperkalemia", "hypokalemia"], L6.d),
  U("u-digoxin", "g-hf", "Digoxin", "Cardiac glycoside · harder, stronger, slower", "❤️", ["dig-moa", "dig-tox", "dig-hold", "dig-lab", "dig-intx", "dig-antidote", "dig-ci", "dig-teach"], ["digoxin", "digoxin-fab"], ["digoxin", "cardiac glycoside", "dig", "digibind", "immune fab"], L6.f),
  U("u-hf-team", "g-hf", "How HF Drugs Work", "ACE · ARB · beta-blocker · diuretic · digoxin", "🫀", ["hf-roles", "hf-assess", "hf-nonpharm"], [], ["heart failure", "hf", "bnp", "sodium"], L6.f),
  // Module 7
  U("u-nitro", "g-angina", "Nitroglycerin", "Nitrates · routes · 3 doses · 911", "✨", ["ntg-moa", "ntg-routes", "ntg-se", "ntg-ci", "ntg-admin", "ntg-storage", "ntg-hold"], ["nitroglycerin"], ["nitro", "ntg", "nitrate", "angina", "afil", "sildenafil"], L7.a),
  U("u-bb", "g-angina", "Beta-Blockers", "-olol · B1 heart, B2 lungs", "🐢", ["bb-moa", "bb-select", "bb-se", "bb-ci", "bb-hold", "bb-overdose", "bb-dup"], ["betablockers", "metoprolol", "atenolol", "propranolol", "sotalol"], ["beta", "olol", "-olol", "metoprolol", "atenolol", "propranolol"], L7.a),
  U("u-naomi", "g-angina", "Acute MI: NAOMI", "Nitro · Aspirin · Oxygen · Morphine · Intervention", "🚑", ["naomi"], ["naomi"], ["mi", "myocardial infarction", "naomi", "chest pain"], L7.a),
  U("u-coag-map", "g-anticoag", "Clot Basics", "Which drug does what?", "🗺️", ["coag-classes", "ap-vs-ac"], [], ["coagulation", "clot", "anticoagulant vs antiplatelet"], L7.c),
  U("u-heparin", "g-anticoag", "Heparin", "aPTT · HIT · protamine", "🩸", ["hep-moa", "hep-use-ci", "hep-bleeding", "hep-hit", "hep-lab", "hep-antidote", "hep-admin", "hep-intx"], ["heparin", "protamine"], ["heparin", "aptt", "ptt", "hit", "protamine"], L7.c),
  U("u-lmwh", "g-anticoag", "Enoxaparin (LMWH)", "Factor Xa only · no routine lab", "💉", ["lmwh-moa", "lmwh-lab", "lmwh-admin", "hep-hit", "hep-antidote"], ["enoxaparin", "protamine"], ["enoxaparin", "lovenox", "lmwh", "low molecular weight heparin", "dalteparin"], L7.c),
  U("u-warfarin", "g-anticoag", "Warfarin", "PT/INR · vitamin K", "🥬", ["war-moa", "war-ci", "war-lab", "war-antidote", "war-intx", "war-teach"], ["warfarin", "vitamin-k"], ["warfarin", "coumadin", "inr", "pt", "vitamin k", "phytonadione"], L7.c),
  U("u-dti", "g-anticoag", "Direct Thrombin Inhibitors", "Dabigatran · argatroban", "🎯", ["dti", "dti-antidote"], ["dabigatran", "argatroban", "idarucizumab"], ["dabigatran", "argatroban", "thrombin", "idarucizumab", "dti"], L7.c),
  U("u-xa", "g-anticoag", "Factor Xa Inhibitors", "Rivaroxaban · apixaban", "🧩", ["xa", "xa-antidote"], ["rivaroxaban", "andexanet"], ["rivaroxaban", "apixaban", "xa", "andexanet"], L7.c),
  U("u-antiplatelets", "g-antiplatelet", "Antiplatelets", "Aspirin · clopidogrel", "🔗", ["ap-moa", "ap-se-ci", "ap-vs-ac"], ["aspirin", "clopidogrel"], ["antiplatelet", "aspirin", "clopidogrel", "plavix", "p2y12"], L7.c),
  U("u-alteplase", "g-thrombolytic", "Alteplase", "The clot dissolver", "💥", ["tpa-moa", "tpa-ci", "tpa-nursing", "tpa-antidote"], ["alteplase", "aminocaproic-acid"], ["alteplase", "tpa", "thrombolytic", "aminocaproic"], L7.c),
  U("u-statins", "g-lipids", "Statins", "HMG-CoA reductase inhibitors", "🧈", ["lip-statin-moa", "lip-statin-se", "lip-statin-ci", "lip-statin-intx", "lip-goals"], ["statins", "rosuvastatin"], ["statin", "atorvastatin", "simvastatin", "rosuvastatin", "pravastatin", "cholesterol", "rhabdomyolysis"], L7.l),
  U("u-colesevelam", "g-lipids", "Colesevelam", "Bile acid sequestrant", "🫙", ["lip-seq"], ["colesevelam"], ["bile acid", "sequestrant", "colesevelam"], L7.l),
  U("u-gemfibrozil", "g-lipids", "Gemfibrozil", "Fibric acid derivative", "🪨", ["lip-gem"], ["gemfibrozil"], ["fibrate", "gemfibrozil", "gallstones"], L7.l),
  U("u-ezetimibe", "g-lipids", "Ezetimibe", "Cholesterol absorption inhibitor", "🚫", ["lip-eze"], ["ezetimibe"], ["ezetimibe", "absorption inhibitor"], L7.l),
  // Module 8
  U("u-stimulants", "g-cnsstim", "CNS Stimulants", "Amphetamine · methylphenidate", "☕", ["stim-moa", "stim-se", "stim-ci", "stim-monitor", "stim-admin"], ["amphetamine", "methylphenidate"], ["stimulant", "adhd", "narcolepsy", "amphetamine", "methylphenidate", "ritalin", "adderall"], L8.s),
  U("u-benzos", "g-cnsdep", "Benzodiazepines", "-pam · -lam · flumazenil", "😴", ["bz-moa", "bz-se", "bz-ci", "bz-intx", "bz-antidote", "bz-nursing", "cnsdep-pop"], ["benzodiazepines", "lorazepam", "diazepam", "midazolam", "flumazenil"], ["benzo", "pam", "lam", "lorazepam", "diazepam", "alprazolam", "midazolam", "flumazenil", "sedative"], L8.d),
  U("u-zolpidem", "g-cnsdep", "Zolpidem", "Non-benzodiazepine hypnotic", "🛌", ["zolpidem"], ["zolpidem"], ["zolpidem", "ambien", "insomnia", "non-benzo"], L8.d),
  U("u-muscle", "g-cnsdep", "Muscle Relaxants", "Cyclobenzaprine (central) · dantrolene (direct)", "💪", ["cyclo"], ["cyclobenzaprine", "dantrolene"], ["cyclobenzaprine", "dantrolene", "muscle relaxant", "malignant hyperthermia"], L8.d),
  U("u-phenytoin", "g-anticonv", "Phenytoin", "IV rules · gums · 10–20 mcg/mL", "🦷", ["pht-moa", "pht-se", "pht-iv", "pht-intx", "pht-ci", "ac-levels"], ["phenytoin"], ["phenytoin", "dilantin"], L8.a),
  U("u-phenobarbital", "g-anticonv", "Phenobarbital", "Barbiturate · 10–40 mcg/mL", "🌀", ["phenobarb", "ac-levels"], ["phenobarbital"], ["phenobarbital", "barbiturate"], L8.a),
  U("u-carbamazepine", "g-anticonv", "Carbamazepine", "Narrowest range · grapefruit · SJS", "🍊", ["carbamazepine", "ac-levels"], ["carbamazepine"], ["carbamazepine", "tegretol"], L8.a),
  U("u-topiramate", "g-anticonv", "Topiramate", "↓ sweating · glaucoma · 5–20 mcg/mL", "🌡️", ["topiramate", "ac-levels"], ["topiramate"], ["topiramate", "topamax"], L8.a),
  U("u-valproic", "g-anticonv", "Valproic Acid", "Hepatotoxic · 50–100 mcg/mL", "🫀", ["valproic", "ac-levels"], ["valproic-acid"], ["valproic", "valproate", "depakote"], L8.a),
  U("u-lamotrigine", "g-anticonv", "Lamotrigine", "Rash = emergency", "🔴", ["lamotrigine"], ["lamotrigine"], ["lamotrigine", "lamictal", "stevens-johnson", "sjs"], L8.a),
  U("u-ac-nursing", "g-anticonv", "Anticonvulsant Nursing", "Levels · safety · teaching", "🛡️", ["ac-levels", "ac-teach"], [], ["seizure", "anticonvulsant", "levels"], L8.a),
  U("u-status", "g-anticonv", "Status Epilepticus", "Benzo → phenytoin → airway", "🚨", ["se-steps", "se-priority"], ["lorazepam", "diazepam", "phenytoin", "midazolam", "phenobarbital"], ["status epilepticus", "seizure emergency"], L8.a),
  // Module 1
  U("u-calc", "g-calc", "Dosage Calculations", "2-step · mg/kg · safe dose · mL/hr · gtts/min", "🧮", ["calc-2step", "calc-3step", "calc-mgkg", "calc-safe", "calc-mlhr", "calc-unitshr", "calc-gtts"], ["calc"], ["calc", "math", "dosage", "drip", "gtts", "ml/hr", "mg/kg"], "Fall 2026 Exam 2 Blueprint; Exam2 Memory Aid · CALC"),
];

/** Single-drug entries ("one individual medication when enough course content exists"). */
export const DRUGS_LIB: DrugEntry[] = [
  { id: "d-morphine", name: "Morphine", unit: "u-opioids", drugIds: ["morphine", "opioids"] },
  { id: "d-hydromorphone", name: "Hydromorphone", unit: "u-opioids", drugIds: ["hydromorphone", "opioids"] },
  { id: "d-fentanyl", name: "Fentanyl (patch)", unit: "u-opioids", concepts: ["op-pca-patch", "op-moa", "op-antidote"], drugIds: ["fentanyl", "opioids"], aka: ["duragesic"] },
  { id: "d-meperidine", name: "Meperidine", unit: "u-opioids", concepts: ["op-meperidine", "op-moa"], drugIds: ["meperidine", "opioids"], aka: ["demerol"] },
  { id: "d-naloxone", name: "Naloxone", unit: "u-opioids", concepts: ["op-antidote", "op-triad", "op-hold"], drugIds: ["naloxone", "opioids"], aka: ["narcan"] },
  { id: "d-acetaminophen", name: "Acetaminophen", unit: "u-apap", drugIds: ["acetaminophen", "acetylcysteine"] },
  { id: "d-tramadol", name: "Tramadol", unit: "u-tramadol", drugIds: ["tramadol"] },
  { id: "d-aspirin", name: "Aspirin (NSAID)", unit: "u-nsaids", concepts: ["nsaid-moa", "nsaid-salicylism", "nsaid-reye", "nsaid-hold", "nsaid-intx"], drugIds: ["aspirin", "nsaids"], aka: ["asa"] },
  { id: "d-ibuprofen", name: "Ibuprofen", unit: "u-nsaids", concepts: ["nsaid-moa", "nsaid-gi", "nsaid-ci", "nsaid-intx", "nsaid-teach"], drugIds: ["ibuprofen", "nsaids"], aka: ["motrin", "advil"] },
  { id: "d-ketorolac", name: "Ketorolac", unit: "u-nsaids", concepts: ["nsaid-hold", "nsaid-ci", "nsaid-gi"], drugIds: ["ketorolac", "nsaids"], aka: ["toradol"] },
  { id: "d-allopurinol", name: "Allopurinol", unit: "u-antigout", concepts: ["gout-patho", "gout-allopurinol", "gout-teach"], drugIds: ["allopurinol"] },
  { id: "d-probenecid", name: "Probenecid", unit: "u-antigout", concepts: ["gout-patho", "gout-probenecid", "gout-teach"], drugIds: ["probenecid"] },
  { id: "d-colchicine", name: "Colchicine", unit: "u-antigout", concepts: ["gout-patho", "gout-colchicine", "gout-teach"], drugIds: ["colchicine"] },
  { id: "d-lisinopril", name: "Lisinopril", unit: "u-acei", drugIds: ["acei"], aka: ["captopril", "enalapril"] },
  { id: "d-losartan", name: "Losartan", unit: "u-arb", drugIds: ["arb"], aka: ["valsartan"] },
  { id: "d-diltiazem", name: "Diltiazem / Verapamil", unit: "u-ccb", drugIds: ["ccb", "diltiazem", "verapamil"] },
  { id: "d-amlodipine", name: "Amlodipine", unit: "u-ccb", drugIds: ["ccb", "amlodipine", "nifedipine"] },
  { id: "d-clonidine", name: "Clonidine", unit: "u-clonidine", drugIds: ["clonidine"] },
  { id: "d-furosemide", name: "Furosemide", unit: "u-loop", drugIds: ["furosemide"], aka: ["lasix"] },
  { id: "d-hctz", name: "Hydrochlorothiazide", unit: "u-thiazide", drugIds: ["hctz"], aka: ["hctz"] },
  { id: "d-spironolactone", name: "Spironolactone", unit: "u-spiro", drugIds: ["spironolactone"] },
  { id: "d-mannitol", name: "Mannitol", unit: "u-mannitol", drugIds: ["mannitol"] },
  { id: "d-kcl", name: "Potassium chloride", unit: "u-potassium", drugIds: ["potassium"], aka: ["kcl"] },
  { id: "d-digoxin", name: "Digoxin", unit: "u-digoxin", drugIds: ["digoxin", "digoxin-fab"] },
  { id: "d-nitroglycerin", name: "Nitroglycerin", unit: "u-nitro", drugIds: ["nitroglycerin"] },
  { id: "d-metoprolol", name: "Metoprolol", unit: "u-bb", drugIds: ["betablockers", "metoprolol"] },
  { id: "d-heparin", name: "Heparin", unit: "u-heparin", drugIds: ["heparin", "protamine"] },
  { id: "d-enoxaparin", name: "Enoxaparin", unit: "u-lmwh", drugIds: ["enoxaparin", "protamine"], aka: ["lovenox"] },
  { id: "d-warfarin", name: "Warfarin", unit: "u-warfarin", drugIds: ["warfarin", "vitamin-k"], aka: ["coumadin"] },
  { id: "d-dabigatran", name: "Dabigatran", unit: "u-dti", drugIds: ["dabigatran", "idarucizumab"] },
  { id: "d-argatroban", name: "Argatroban", unit: "u-dti", concepts: ["dti"], drugIds: ["argatroban"] },
  { id: "d-rivaroxaban", name: "Rivaroxaban", unit: "u-xa", drugIds: ["rivaroxaban", "andexanet"] },
  { id: "d-aspirin-ap", name: "Aspirin (antiplatelet)", unit: "u-antiplatelets", drugIds: ["aspirin"] },
  { id: "d-clopidogrel", name: "Clopidogrel", unit: "u-antiplatelets", drugIds: ["clopidogrel"], aka: ["plavix"] },
  { id: "d-alteplase", name: "Alteplase", unit: "u-alteplase", drugIds: ["alteplase", "aminocaproic-acid"], aka: ["tpa"] },
  { id: "d-atorvastatin", name: "Atorvastatin (statins)", unit: "u-statins", drugIds: ["statins", "rosuvastatin"] },
  { id: "d-colesevelam", name: "Colesevelam", unit: "u-colesevelam", drugIds: ["colesevelam"] },
  { id: "d-gemfibrozil", name: "Gemfibrozil", unit: "u-gemfibrozil", drugIds: ["gemfibrozil"] },
  { id: "d-ezetimibe", name: "Ezetimibe", unit: "u-ezetimibe", drugIds: ["ezetimibe"] },
  { id: "d-methylphenidate", name: "Methylphenidate", unit: "u-stimulants", drugIds: ["methylphenidate", "amphetamine"] },
  { id: "d-amphetamine", name: "Amphetamine", unit: "u-stimulants", drugIds: ["amphetamine", "methylphenidate"] },
  { id: "d-lorazepam", name: "Lorazepam", unit: "u-benzos", drugIds: ["benzodiazepines", "lorazepam"] },
  { id: "d-flumazenil", name: "Flumazenil", unit: "u-benzos", concepts: ["bz-antidote", "bz-se"], drugIds: ["flumazenil", "benzodiazepines"] },
  { id: "d-zolpidem", name: "Zolpidem", unit: "u-zolpidem", drugIds: ["zolpidem"] },
  { id: "d-cyclobenzaprine", name: "Cyclobenzaprine", unit: "u-muscle", drugIds: ["cyclobenzaprine"] },
  { id: "d-dantrolene", name: "Dantrolene", unit: "u-muscle", drugIds: ["dantrolene"] },
  { id: "d-phenytoin", name: "Phenytoin", unit: "u-phenytoin", drugIds: ["phenytoin"] },
  { id: "d-phenobarbital", name: "Phenobarbital", unit: "u-phenobarbital", drugIds: ["phenobarbital"] },
  { id: "d-carbamazepine", name: "Carbamazepine", unit: "u-carbamazepine", drugIds: ["carbamazepine"] },
  { id: "d-topiramate", name: "Topiramate", unit: "u-topiramate", drugIds: ["topiramate"] },
  { id: "d-valproic", name: "Valproic acid", unit: "u-valproic", drugIds: ["valproic-acid"] },
  { id: "d-lamotrigine", name: "Lamotrigine", unit: "u-lamotrigine", drugIds: ["lamotrigine"] },
];

export const GROUP_BY_ID: Record<string, StudyGroup> = Object.fromEntries(GROUPS.map((g) => [g.id, g]));
export const UNIT_BY_ID: Record<string, StudyUnit> = Object.fromEntries(UNITS.map((u) => [u.id, u]));
export const DRUG_BY_ID: Record<string, DrugEntry> = Object.fromEntries(DRUGS_LIB.map((d) => [d.id, d]));

export const MODULE_ORDER: WorldId[] = ["w5", "w6", "w7", "w8", "w1"];
export const groupsForModule = (m: WorldId) => GROUPS.filter((g) => g.module === m);
export const unitsForGroup = (g: string) => (GROUP_BY_ID[g]?.units ?? []).map((id) => UNIT_BY_ID[id]).filter(Boolean);
export const drugsForUnit = (u: string) => DRUGS_LIB.filter((d) => d.unit === u);
export const moduleLabel = (m: WorldId) => `${WORLD_BY_ID[m].module} · ${WORLD_BY_ID[m].title}`;

/**
 * A study selection: what the learner picked in the library. Exactly one of module/group/unit/drug.
 * Resolves to concepts (+ an optional drug filter for questions).
 */
export interface Selection {
  kind: "module" | "group" | "unit" | "drug";
  id: string;
}

export function resolveSelection(sel: Selection): { title: string; subtitle: string; concepts: string[]; drugIds?: string[]; units: string[] } {
  const uniq = (xs: string[]) => Array.from(new Set(xs)).filter((c) => CONCEPT_BY_ID[c]);
  switch (sel.kind) {
    case "drug": {
      const d = DRUG_BY_ID[sel.id];
      const u = d && UNIT_BY_ID[d.unit];
      if (!d || !u) return { title: "", subtitle: "", concepts: [], units: [] };
      return { title: d.name, subtitle: u.title, concepts: uniq(d.concepts ?? u.concepts), drugIds: d.drugIds, units: [u.id] };
    }
    case "unit": {
      const u = UNIT_BY_ID[sel.id];
      if (!u) return { title: "", subtitle: "", concepts: [], units: [] };
      return { title: u.title, subtitle: GROUP_BY_ID[u.group]?.title ?? "", concepts: uniq(u.concepts), units: [u.id] };
    }
    case "group": {
      const g = GROUP_BY_ID[sel.id];
      if (!g) return { title: "", subtitle: "", concepts: [], units: [] };
      return { title: g.title, subtitle: moduleLabel(g.module), concepts: uniq(unitsForGroup(g.id).flatMap((u) => u.concepts)), units: g.units };
    }
    case "module": {
      const m = sel.id as WorldId;
      const gs = groupsForModule(m);
      if (!gs.length) return { title: "", subtitle: "", concepts: [], units: [] };
      return { title: WORLD_BY_ID[m].title, subtitle: WORLD_BY_ID[m].module, concepts: uniq(gs.flatMap((g) => unitsForGroup(g.id).flatMap((u) => u.concepts))), units: gs.flatMap((g) => g.units) };
    }
  }
}

export function parseSelection(s: string | null | undefined): Selection | null {
  if (!s) return null;
  const [kind, ...rest] = s.split(":");
  const id = rest.join(":");
  if (!id || !["module", "group", "unit", "drug"].includes(kind)) return null;
  return { kind: kind as Selection["kind"], id };
}
export const selKey = (sel: Selection) => `${sel.kind}:${sel.id}`;

/** First unit (in library order) that teaches a concept — used for "Teach me this" and first-exposure lessons. */
const UNIT_FOR_CONCEPT: Record<string, string> = {};
for (const g of GROUPS) for (const uid of g.units) for (const c of UNIT_BY_ID[uid]?.concepts ?? []) UNIT_FOR_CONCEPT[c] ??= uid;
export const unitForConcept = (conceptId: string) => UNIT_FOR_CONCEPT[conceptId];

export interface SearchHit {
  kind: "unit" | "drug" | "group";
  id: string;
  title: string;
  sub: string;
  module: WorldId;
  score: number;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+]+/g, " ").trim();

/** Lightweight search over groups, units and single drugs (names, members, suffixes, aliases). */
export function searchLibrary(query: string, limit = 12): SearchHit[] {
  const q = norm(query);
  if (q.length < 2) return [];
  const score = (fields: string[]): number => {
    let best = 0;
    for (const f of fields) {
      const n = norm(f);
      if (!n) continue;
      if (n === q) best = Math.max(best, 100);
      else if (n.startsWith(q)) best = Math.max(best, 80);
      else if (n.split(" ").some((w) => w.startsWith(q))) best = Math.max(best, 60);
      else if (q.length >= 3 && n.includes(q)) best = Math.max(best, 40);
    }
    return best;
  };
  const hits: SearchHit[] = [];
  for (const d of DRUGS_LIB) {
    const u = UNIT_BY_ID[d.unit];
    const s = score([d.name, ...(d.aka ?? [])]);
    if (s) hits.push({ kind: "drug", id: d.id, title: d.name, sub: u.title, module: GROUP_BY_ID[u.group].module, score: s + 5 });
  }
  for (const u of UNITS) {
    const s = score([u.title, u.subtitle, ...u.aka]);
    if (s) hits.push({ kind: "unit", id: u.id, title: u.title, sub: u.subtitle, module: GROUP_BY_ID[u.group].module, score: s + (norm(u.title).startsWith(q) ? 8 : 0) });
  }
  for (const g of GROUPS) {
    const s = score([g.title]);
    if (s) hits.push({ kind: "group", id: g.id, title: g.title, sub: g.subtitle, module: g.module, score: s });
  }
  // a drug that is the only member of its unit duplicates the unit hit — keep the unit
  const seen = new Set<string>();
  return hits
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .filter((h) => {
      const key = h.kind === "drug" ? `${DRUG_BY_ID[h.id].unit}|${norm(h.title)}` : `${h.id}|${norm(h.title)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

/** Every non-calc concept must live in at least one unit (validated in tests). */
export const conceptsWithoutUnit = () => CONCEPTS.filter((c) => !UNIT_FOR_CONCEPT[c.id]).map((c) => c.id);
