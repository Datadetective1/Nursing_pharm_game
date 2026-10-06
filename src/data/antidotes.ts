/**
 * Drug → antidote pairings. ONLY pairings stated in the course materials.
 * (Argatroban is intentionally absent: the materials don't clearly assign it an antidote.)
 */
export interface AntidotePair {
  id: string;
  drug: string;
  drugClass: string;
  antidote: string;
  note: string;
  concept: string;
  topic: "analgesics" | "coag" | "hf" | "cnsdep" | "angina";
  source: string;
}

export const ANTIDOTES: AntidotePair[] = [
  { id: "ad-opioid", drug: "Morphine (opioids)", drugClass: "Opioid", antidote: "Naloxone", note: "Lasts only 20–30 min — repeat doses, monitor RR up to 2 hr. Give if RR < 10.", concept: "op-antidote", topic: "analgesics", source: "Memory Aid · Opioids" },
  { id: "ad-fentanyl", drug: "Fentanyl", drugClass: "Opioid", antidote: "Naloxone", note: "Same opioid antidote; fentanyl ≈ 100× morphine.", concept: "op-antidote", topic: "analgesics", source: "Memory Aid · Opioids" },
  { id: "ad-apap", drug: "Acetaminophen", drugClass: "Nonopioid analgesic", antidote: "Acetylcysteine", note: "IV better tolerated. Level drawn < 4 hr; after 4 hr assume toxic + treat.", concept: "apap-antidote", topic: "analgesics", source: "Memory Aid · Acetaminophen" },
  { id: "ad-heparin", drug: "Heparin", drugClass: "Anticoagulant", antidote: "Protamine sulfate", note: "Give SLOWLY — no faster than 50 mg per 10 min (causes hypotension).", concept: "hep-antidote", topic: "coag", source: "Coag Notes · Slide 2" },
  { id: "ad-enox", drug: "Enoxaparin (LMWH)", drugClass: "Anticoagulant", antidote: "Protamine sulfate", note: "Same antidote as heparin.", concept: "hep-antidote", topic: "coag", source: "Coag Notes · Slide 3" },
  { id: "ad-warfarin", drug: "Warfarin", drugClass: "Anticoagulant", antidote: "Vitamin K (phytonadione)", note: "Warfarin is the only one reversed by vitamin K.", concept: "war-antidote", topic: "coag", source: "Coag Notes · Slides 5–6" },
  { id: "ad-dabigatran", drug: "Dabigatran", drugClass: "Direct thrombin inhibitor", antidote: "Idarucizumab", note: "For severe bleeding / emergency surgery.", concept: "dti-antidote", topic: "coag", source: "Coag Notes · Slide 7" },
  { id: "ad-rivaroxaban", drug: "Rivaroxaban", drugClass: "Factor Xa inhibitor", antidote: "Andexanet alfa", note: "Xa-inhibitor antidote (FDA-approved 2018, per slide).", concept: "xa-antidote", topic: "coag", source: "Coag Slides · Slide 8" },
  { id: "ad-alteplase", drug: "Alteplase", drugClass: "Thrombolytic", antidote: "Aminocaproic acid", note: "Stop alteplase, give blood products, then antidote if life-threatening.", concept: "tpa-antidote", topic: "coag", source: "Coag Notes · Slide 12" },
  { id: "ad-digoxin", drug: "Digoxin", drugClass: "Cardiac glycoside", antidote: "Digoxin immune fab", note: "Hold for apical pulse < 60 (full minute) or any toxicity sign.", concept: "dig-antidote", topic: "hf", source: "Memory Aid · Digoxin" },
  { id: "ad-benzo", drug: "Benzodiazepines (IV toxicity)", drugClass: "CNS depressant", antidote: "Flumazenil", note: "Oral ingestion → gastric lavage or activated charcoal. Maintain airway.", concept: "bz-antidote", topic: "cnsdep", source: "Memory Aid · Benzodiazepines" },
  { id: "ad-bb", drug: "Beta-blocker overdose (symptomatic bradycardia)", drugClass: "Beta-blocker", antidote: "Atropine", note: "Withhold doses; atropine for symptomatic bradycardia; glucagon + insulin.", concept: "bb-overdose", topic: "angina", source: "Memory Aid · Beta-blockers" },
];

export const ANTIDOTE_NAMES = Array.from(new Set(ANTIDOTES.map((a) => a.antidote)));
