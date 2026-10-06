import type { TopicId } from "@/lib/types";

/**
 * RAPID REVIEW flash cards — night-before / morning-of. Only high-yield, source-backed facts.
 * Learner sees the prompt, recalls, then reveals.
 */
export type RapidCat = "antidote" | "danger" | "hold" | "lab" | "ci" | "priority" | "confuse" | "calc";

export interface RapidCard {
  id: string;
  cat: RapidCat;
  topic: TopicId;
  concept: string;
  front: string;
  back: string;
  source: string;
}

export const RAPID_CATS: Record<RapidCat, { label: string; icon: string }> = {
  antidote: { label: "Antidotes", icon: "🧯" },
  danger: { label: "Dangerous effects", icon: "⚠️" },
  hold: { label: "Hold parameters", icon: "✋" },
  lab: { label: "Labs & ranges", icon: "🧪" },
  ci: { label: "Contraindications", icon: "⛔" },
  priority: { label: "Priority actions", icon: "🚨" },
  confuse: { label: "Don't mix up", icon: "🔀" },
  calc: { label: "Calc formulas", icon: "🧮" },
};

const MA = "Memory Aid";
const CN = "M7L2 Coagulation Modifiers";

let n = 0;
const r = (cat: RapidCat, topic: TopicId, concept: string, front: string, back: string, source: string): RapidCard => ({
  id: `rr-${++n}`,
  cat,
  topic,
  concept,
  front,
  back,
  source,
});

export const RAPID: RapidCard[] = [
  // Antidotes
  r("antidote", "analgesics", "op-antidote", "Opioid antidote — and the catch?", "NALOXONE. Lasts only 20–30 min → repeat doses, monitor RR up to 2 hr. Causes abrupt pain, HTN, tachycardia, N/V.", `${MA} · Opioids`),
  r("antidote", "analgesics", "apap-antidote", "Acetaminophen antidote?", "ACETYLCYSTEINE (IV better tolerated).", `${MA} · Acetaminophen`),
  r("antidote", "coag", "hep-antidote", "Heparin AND enoxaparin antidote — how fast?", "PROTAMINE SULFATE — slowly, no faster than 50 mg per 10 min (causes hypotension).", `${CN} · Slides 2–3`),
  r("antidote", "coag", "war-antidote", "Warfarin antidote?", "VITAMIN K (phytonadione).", `${CN} · Slides 5–6`),
  r("antidote", "coag", "dti-antidote", "Dabigatran antidote?", "IDARUCIZUMAB (severe bleeding / emergency surgery).", `${CN} · Slide 7`),
  r("antidote", "coag", "xa-antidote", "Rivaroxaban (Xa inhibitor) antidote?", "ANDEXANET ALFA (FDA-approved 2018, per slide).", "M7L2 Coagulation Modifiers · Slide 8"),
  r("antidote", "coag", "tpa-antidote", "Alteplase antidote + sequence?", "Stop alteplase → blood products → AMINOCAPROIC ACID if life-threatening.", `${CN} · Slide 12`),
  r("antidote", "hf", "dig-antidote", "Digoxin antidote?", "DIGOXIN IMMUNE FAB.", `${MA} · Digoxin`),
  r("antidote", "cnsdep", "bz-antidote", "Benzodiazepine antidote (IV toxicity)? Oral ingestion?", "FLUMAZENIL for IV toxicity; oral → gastric lavage or activated charcoal. Maintain airway.", `${MA} · Benzodiazepines`),
  r("antidote", "angina", "bb-overdose", "Beta-blocker overdose management?", "Withhold doses; ATROPINE for symptomatic bradycardia; GLUCAGON + insulin.", `${MA} · Beta-blockers`),

  // Danger signs
  r("danger", "analgesics", "op-triad", "Opioid toxicity TRIAD?", "↓LOC + respiratory depression + PINPOINT PUPILS = emergency.", `${MA} · Opioids`),
  r("danger", "analgesics", "op-se", "NARCS = ?", "Nausea · Acute toxicity/Addiction · Resp depression · Constipation · Sedation · Urinary retention.", `${MA} · Opioids`),
  r("danger", "analgesics", "apap-tox", "APAP toxicity: early vs late?", "EARLY: N/V/D, sweating, abd pain. LATE: hepatic failure, coma, death. Jaundice (sclera first) + dark urine = late liver damage.", `${MA} · Acetaminophen`),
  r("danger", "analgesics", "tram-seizure", "Tramadol's big danger?", "SEIZURES — lowers seizure threshold. + SSRIs → serotonin syndrome.", `${MA} · Tramadol`),
  r("danger", "antiinflam", "nsaid-gi", "NSAID #1 adverse effect + signs?", "GI ULCER/BLEED: dark tarry stools, coffee-ground emesis, epigastric pain esp. after eating.", `${MA} · NSAIDs`),
  r("danger", "antiinflam", "nsaid-salicylism", "Salicylism signs (aspirin only)?", "TINNITUS, sweating, headache, dizziness, respiratory alkalosis.", `${MA} · NSAIDs`),
  r("danger", "antihtn", "ace-angioedema", "ACE inhibitor client: 'my tongue feels thick'", "ANGIOEDEMA = AIRWAY EMERGENCY → assess airway + notify IMMEDIATELY.", `${MA} · ACE inhibitors`),
  r("danger", "antihtn", "ace-cough", "Why do ACE inhibitors cause a cough (and ARBs much less)?", "ACE ↑BRADYKININ → dry hacking cough. ARBs leave bradykinin untouched.", `${MA} · ACE / ARB`),
  r("danger", "diuretics", "loop-se", "Loop-only side effect?", "OTOTOXICITY (also IV too fast → transient hearing loss). Thiazides don't.", `${MA} · Diuretics`),
  r("danger", "diuretics", "spiro-ci", "Spironolactone + potassium supplement = ?", "FATAL HYPERKALEMIA.", `${MA} · Spironolactone`),
  r("danger", "hf", "dig-tox", "Digoxin toxicity — EARLIEST sign and order?", "1) ANOREXIA (earliest) 2) N/V, abd pain 3) fatigue, weakness, vision changes — yellow-green/white halos 4) dysrhythmias (late, worst).", `${MA} · Digoxin`),
  r("danger", "coag", "hep-hit", "HIT = ?", "Immune-mediated ↓platelets WITH thrombosis. Platelets drop ≥ 50% or < 100,000 → hold + notify.", `${CN} · Slides 2, 4`),
  r("danger", "coag", "hep-bleeding", "Signs of bleeding on an anticoagulant?", "↓H&H, ↓BP, ↑HR, easy/excessive bruising, bleeding at IV site, epistaxis, blood in stool/urine, coffee-ground emesis.", `${CN} · Slide 4`),
  r("danger", "lipids", "lip-statin-se", "Statin muscle pain + dark urine?", "Myopathy → RHABDOMYOLYSIS (↑CK). Hold + check CK.", `${MA} · Lipids`),
  r("danger", "angina", "ntg-ci", "Nitroglycerin + sildenafil ('-afil')?", "FATAL BP DROP.", `${MA} · Nitroglycerin`),
  r("danger", "angina", "bb-se", "Beta-blockers + diabetes?", "Cause hypoglycemia AND MASK it (block the warning tachycardia) → check glucose more often.", `${MA} · Beta-blockers`),
  r("danger", "cnsdep", "bz-intx", "Benzo + ETOH / kava kava / valerian?", "Profound respiratory arrest, coma, death.", `${MA} · Benzodiazepines`),
  r("danger", "cnsdep", "zolpidem", "Zolpidem's signature risk?", "SLEEP-RELATED COMPLEX BEHAVIORS. Short-term insomnia only; CI pregnancy.", `${MA} · Zolpidem`),
  r("danger", "cnsstim", "stim-ci", "Stimulant + MAOI?", "HYPERTENSIVE CRISIS.", `${MA} · CNS stimulants`),
  r("danger", "anticonv", "lamotrigine", "Rash on lamotrigine or carbamazepine?", "HOLD + NOTIFY (Stevens-Johnson).", `${MA} · Anticonvulsants`),
  r("danger", "anticonv", "valproic", "Valproic acid big danger?", "HEPATOTOXICITY (anorexia, abd pain, JAUNDICE); pancreatitis; hyperammonemia.", `${MA} · Anticonvulsants`),

  // Hold parameters
  r("hold", "analgesics", "op-hold", "Opioid hold parameters? When naloxone?", "Hold + notify: RR < 12, SBP < 100, HR < 60. RR < 10 → give NALOXONE.", `${MA} · Opioids`),
  r("hold", "analgesics", "apap-max", "Acetaminophen daily max (3 tiers)?", "4 g (most) · 3 g undernourished · 2 g if > 3 alcoholic drinks/day. Hold if max reached or a 2nd APAP product was given.", `${MA} · Acetaminophen`),
  r("hold", "antiinflam", "nsaid-hold", "Ketorolac max duration? Aspirin before surgery?", "Ketorolac MAX 5 DAYS. Stop aspirin 1 week pre-op/pre-delivery.", `${MA} · NSAIDs`),
  r("hold", "antiinflam", "gout-probenecid", "When NOT to start probenecid?", "Within 2–3 weeks of an acute gout attack — precipitates a flare.", `${MA} · Antigout`),
  r("hold", "antihtn", "ace-teach", "ACE / ARB / CCB hold parameter?", "SBP < 100 (or per parameter).", `${MA} · Module 6`),
  r("hold", "angina", "bb-hold", "Beta-blocker hold?", "SBP < 100 or HR < 60 (apical, full minute). NEVER stop abruptly — taper 1–2 wk.", `${MA} · Beta-blockers`),
  r("hold", "hf", "dig-hold", "Digoxin hold?", "APICAL pulse < 60 counted a FULL 60 seconds, or any sign of toxicity.", `${MA} · Digoxin`),
  r("hold", "angina", "ntg-hold", "Nitroglycerin hold?", "SBP < 90 — withhold further doses.", `${MA} · Nitroglycerin`),
  r("hold", "diuretics", "k-iv", "Potassium chloride IV rule?", "NEVER IV PUSH — high alert. Always diluted + infused with continuous cardiac monitoring.", `${MA} · Potassium`),
  r("hold", "diuretics", "loop-admin", "IV furosemide rate?", "No faster than 20 mg/min (transient hearing loss). Hold if K+ low.", `${MA} · Loop`),
  r("hold", "anticonv", "pht-iv", "IV phenytoin rules?", "Normal saline ONLY (never dextrose), ≤ 50 mg/min, flush with NS after, NEVER IM.", `${MA} · Phenytoin`),
  r("hold", "cnsstim", "stim-admin", "Stimulant timing?", "Last dose no later than 4 PM. Patch on alternating hips ≤ 9 hours. Never stop abruptly.", `${MA} · CNS stimulants`),
  r("hold", "lipids", "lip-statin-se", "When to hold a statin?", "Unexplained muscle pain/tenderness/weakness → hold + check CK.", `${MA} · Lipids`),
  r("hold", "coag", "war-lab", "When to hold warfarin?", "PT or INR above the therapeutic range.", `${CN} · Slide 6`),

  // Labs & ranges
  r("lab", "coag", "hep-lab", "Heparin goal aPTT?", "1.5–2.5× normal ≈ 60–80 seconds. Low = still clot risk; high = bleeding risk.", `${CN} · Slide 2`),
  r("lab", "coag", "lmwh-lab", "Enoxaparin labs?", "No lab measures its effect. Monitor CREATININE CLEARANCE, platelets, H&H.", `${CN} · Slides 3–4`),
  r("lab", "coag", "war-lab", "Warfarin PT and INR targets?", "PT 1.5–2× control = 18–24 sec. INR 2–3 most · 2.5–3.5 PE · 3–4.5 mechanical valve/recurrent embolism.", `${CN} · Slide 5`),
  r("lab", "coag", "tpa-nursing", "Alteplase baseline labs?", "CBC (H&H, platelets), aPTT, PT, INR, FIBRINOGEN.", `${CN} · Slide 13`),
  r("lab", "hf", "dig-lab", "Digoxin therapeutic level?", "0.5–0.8 ng/mL per the lecture slide; > 2 ng/mL = toxicity (study guides list 0.5–1.5 — use the range given in the question). Watch K+.", `${MA} · Digoxin`),
  r("lab", "analgesics", "apap-lab", "Acetaminophen level?", "10–20 mcg/mL; toxic > 200. Draw < 4 hr; after 4 hr assume toxic + treat. AST/ALT.", `${MA} · Acetaminophen`),
  r("lab", "anticonv", "ac-levels", "Anticonvulsant levels (mcg/mL)?", "Phenytoin 10–20 · Phenobarbital 10–40 · Carbamazepine 4–12 (narrowest) · Valproic 50–100 · Topiramate 5–20. Below = seizures; above = toxicity.", `${MA} · Anticonvulsants`),
  r("lab", "lipids", "lip-goals", "Lipid goals?", "Total < 200 · LDL < 100 · HDL > 60.", `${MA} · Lipids`),
  r("lab", "hf", "hf-assess", "BNP meaning? S3 vs S4?", "BNP > 100 = fluid overload. S4 = ALWAYS abnormal (stiff ventricle). S3 may be normal; abnormal = volume overload.", `${MA} · Digoxin/HF`),
  r("lab", "cnsstim", "stim-monitor", "Stimulant monitoring?", "HR + BP; baseline AND follow-up height + weight; mental status (aggression, affect, mood).", `${MA} · CNS stimulants`),

  // Contraindications
  r("ci", "antihtn", "ace-ci", "ACE inhibitor CI = PARK?", "Pregnancy · Allergy/prior angioedema · Renal failure · hyperKalemia.", `${MA} · ACE inhibitors`),
  r("ci", "analgesics", "op-ci", "Opioid contraindications?", "After BILIARY TRACT SURGERY (sphincter of Oddi spasm) and premature infants.", `${MA} · Opioids`),
  r("ci", "antiinflam", "nsaid-reye", "Aspirin + child with a viral illness?", "REYE SYNDROME — contraindicated.", `${MA} · NSAIDs`),
  r("ci", "diuretics", "thz-ci", "Thiazide — the one CI?", "Renal impairment.", `${MA} · Thiazide`),
  r("ci", "coag", "tpa-ci", "Alteplase absolute CIs?", "ANY prior intracranial hemorrhage, structural cerebral lesion, active internal bleeding, ischemic stroke within 3 months.", `${CN} · Slide 12`),
  r("ci", "coag", "war-ci", "Warfarin CI?", "Allergy, acute or chronic bleeding, PREGNANCY.", `${CN} · Slide 5`),
  r("ci", "coag", "hep-use-ci", "Heparin CI?", "Thrombocytopenia, uncontrolled bleeding, eye/brain surgery.", `${CN} · Slide 2`),
  r("ci", "angina", "bb-select", "Which beta-blockers are CI in asthma/COPD?", "NONSELECTIVE only (propranolol, sotalol). Cardioselective (metoprolol, atenolol) are not.", `${MA} · One-member exceptions`),
  r("ci", "angina", "ntg-ci", "Nitroglycerin CI?", "Allergy, severe anemia, traumatic head injury, closed-angle glaucoma.", `${MA} · Nitroglycerin`),
  r("ci", "lipids", "lip-statin-ci", "Statin CI + pharmacogenomics item?", "Liver disorders, PREGNANCY. Rosuvastatin avoided/reduced in clients of Asian descent.", `${MA} · Lipids`),
  r("ci", "cnsdep", "bz-ci", "Benzodiazepine CI?", "Allergy, pregnancy, SLEEP APNEA, respiratory depression, organic brain disease.", `${MA} · Benzodiazepines`),
  r("ci", "anticonv", "pht-ci", "IV phenytoin CI?", "Sinus bradycardia, SA block, 2nd/3rd° AV block, Stokes-Adams syndrome.", `${MA} · Phenytoin`),
  r("ci", "hf", "dig-ci", "Digoxin CI?", "V-fib, V-tach, 2nd/3rd° heart block. Caution: hypokalemia.", `${MA} · Digoxin`),

  // Priority actions
  r("priority", "angina", "ntg-admin", "SL nitroglycerin — chest pain not relieved by the first dose?", "Call 911 after the FIRST unrelieved dose, THEN take the 2nd. Up to 3 doses 5 min apart; sit/lie down; never drive.", `${MA} · Nitroglycerin`),
  r("priority", "angina", "naomi", "NAOMI?", "Nitroglycerin · Aspirin (usually first) · Oxygen if sat < 94% on RA · Morphine · Intervention (stent). TIME IS MUSCLE.", `${MA} · NAOMI`),
  r("priority", "anticonv", "se-steps", "Status epilepticus sequence?", "1) IV/rectal lorazepam or diazepam (stops CURRENT seizure) 2) IV phenytoin (prevents more) 3) midazolam/propofol → high-dose phenobarbital. Then AIRWAY + BREATHING.", `${MA} · Status epilepticus`),
  r("priority", "anticonv", "se-priority", "Seizure safety?", "Never put anything in a seizing client's mouth. Pad side rails, bed low, O2 flow-meter in room.", `${MA} · Status epilepticus`),
  r("priority", "diuretics", "mannitol-admin", "Mannitol priorities?", "NEURO status first. Crystals → return to pharmacy to warm. IV only, filtered needle + filtered tubing.", `${MA} · Mannitol`),
  r("priority", "analgesics", "op-admin", "Before EVERY opioid dose?", "Count RR. 2-nurse dose check, witness waste, 2 side rails + bed alarm, naloxone available.", `${MA} · Opioids`),
  r("priority", "analgesics", "op-pca-patch", "Fentanyl patch rules?", "Opioid-TOLERANT only, gloves, 72 hr, rotate, NO HEAT, fold + flush, never cut.", `${MA} · Opioids`),
  r("priority", "coag", "war-teach", "Warfarin diet teaching?", "CONSISTENT vitamin K intake — not elimination. Tell the provider if diet changes.", `${CN} · Slide 6`),
  r("priority", "coag", "lmwh-admin", "Enoxaparin injection?", "Abdominal wall ≥ 2 in from umbilicus. Do NOT expel the air bubble. No massage. Rotate + record.", `${CN} · Slide 4`),
  r("priority", "cnsdep", "bz-nursing", "Benzo nursing diagnosis for every client?", "RISK FOR INJURY — bed alarm, give at bedtime, avoid driving.", `${MA} · Benzodiazepines`),

  // Confusables
  r("confuse", "coag", "coag-classes", "Which coag class DISSOLVES clots?", "Only thrombolytics (alteplase). Anticoagulants DO NOT dissolve existing clots.", `${CN} · Slides 1, 12`),
  r("confuse", "coag", "ap-vs-ac", "Antiplatelet vs anticoagulant territory?", "Antiplatelet = high-velocity ARTERIES (CAD, CVA, PAD). Anticoagulant = low-velocity VEINS + LEFT ATRIUM (DVT, PE, a-fib).", `${MA} · Antiplatelets`),
  r("confuse", "coag", "dti", "Argatroban is for…?", "Clients who CANNOT take heparin due to HIT.", `${CN} · Slide 7`),
  r("confuse", "diuretics", "k-updown", "K+ UP vs K+ DOWN drugs?", "UP: ACE inhibitors, spironolactone, K+ supplements, salt substitutes. DOWN: loop, thiazide. ARBs: potassium is not influenced (ARB lecture).", `${MA} · Summary`),
  r("confuse", "antihtn", "ccb-moa", "Which CCBs also slow the heart?", "dilTIAZem + verapaMIL. '-pine' drugs act on vessels only (more edema + reflex tachycardia).", `${MA} · One-member exceptions`),
  r("confuse", "antiinflam", "nsaid-intx", "Which NSAID cancels aspirin's heart protection?", "IBUPROFEN.", `${MA} · One-member exceptions`),
  r("confuse", "cnsdep", "cyclo", "Cyclobenzaprine vs dantrolene?", "Cyclobenzaprine = C = CENTRALLY acting. Dantrolene = D = DIRECT acting (malignant hyperthermia).", `${MA} · Muscle relaxants`),
  r("confuse", "lipids", "lip-gem", "Which lipid drug causes gallstones? Constipation?", "Gemfibrozil = gallstones. Sequestrants (colesevelam) = constipation + block other drugs.", `${MA} · One-member exceptions`),
  r("confuse", "anticonv", "carbamazepine", "Narrowest anticonvulsant range + grapefruit?", "CARBAMAZEPINE (4–12) — also blood dyscrasias, SJS.", `${MA} · One-member exceptions`),
  r("confuse", "antihtn", "htn-suffix", "-pril / -sartan / -pine·-zem·-mil / -olol?", "ACE inhibitor / ARB / calcium channel blocker / beta-blocker.", "Blueprint + Memory Aid"),

  // Calc
  r("calc", "calc", "calc-gtts", "Drops per minute formula?", "(mL/hr × drop factor) ÷ 60 → ROUND TO WHOLE. Microdrip 60 gtts/mL: gtts/min = mL/hr.", `${MA} · CALC`),
  r("calc", "calc", "calc-mlhr", "mL/hr formula?", "Total volume ÷ hours.", `${MA} · CALC`),
  r("calc", "calc", "calc-unitshr", "units/hr → mL/hr?", "units/hr ÷ concentration (units/mL) = mL/hr.", `${MA} · CALC`),
  r("calc", "calc", "calc-mgkg", "lb → kg? weight-based dosing?", "lb ÷ 2.2 = kg. Weight-based dosing MULTIPLIES (kg × mg/kg).", `${MA} · CALC`),
  r("calc", "calc", "calc-safe", "Safe dose method?", "Calculate the safe RANGE first, THEN compare it to the order.", `${MA} · CALC`),
  r("calc", "calc", "calc-2step", "g → mg → mcg?", "g → mg ×1000; mg → mcg ×1000.", `${MA} · CALC`),
];
