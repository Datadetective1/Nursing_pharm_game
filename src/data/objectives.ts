import type { Concept } from "@/lib/types";
import { CONCEPTS } from "./curriculum";

/**
 * Chapter objectives (Chapters objectives.docx) mapped to concepts — INTERNAL ONLY.
 * Used by the coverage matrix and tests to prove the game teaches and tests what the instructor expects.
 * Objective codes are never shown in the learner UI.
 */
export interface Objective {
  id: string;
  text: string;
  /** which concepts serve this objective */
  match: (c: Concept) => boolean;
}

const DIFF = new Set(["moa", "use", "se", "ci", "intx", "lab", "class"]);
const NURSE = new Set(["action", "teach", "hold", "lab", "intx"]);
const at = (nodes: string[], skills?: Set<string>) => (c: Concept) => nodes.includes(c.node) && (!skills || skills.has(c.skill));

export const OBJECTIVES: Objective[] = [
  { id: "MO5.1", text: "Differentiate nonopioid analgesics (indications, actions, adverse reactions, contraindications)", match: at(["apap", "tramadol"], DIFF) },
  { id: "MO5.2", text: "Nursing process: nonopioid analgesics", match: at(["apap", "tramadol"], NURSE) },
  { id: "MO5.3", text: "Antidotes for nonopioid analgesics", match: (c) => c.id === "apap-antidote" },
  { id: "MO5.4", text: "Differentiate opioid analgesics", match: at(["opioids"], DIFF) },
  { id: "MO5.5", text: "Nursing process: opioid analgesics", match: at(["opioids"], NURSE) },
  { id: "MO5.6", text: "Antidotes for opioid analgesics", match: (c) => c.id === "op-antidote" },
  { id: "MO5.7", text: "Differentiate anti-inflammatory drugs and drugs used to treat gout", match: at(["nsaids", "antigout"], DIFF) },
  { id: "MO5.8", text: "Nursing process: anti-inflammatory and gout medications", match: at(["nsaids", "antigout"], new Set([...NURSE, "ci"])) },
  { id: "MO6.1", text: "Differentiate beta-blockers, CCBs, ACE inhibitors, ARBs", match: (c) => (c.topic === "antihtn" && DIFF.has(c.skill)) || (c.node === "betablockers" && DIFF.has(c.skill)) },
  { id: "MO6.2", text: "Nursing process: beta-blockers, CCBs, ACE inhibitors, ARBs", match: (c) => (c.topic === "antihtn" || c.node === "betablockers") && (NURSE.has(c.skill) || c.skill === "antidote") },
  { id: "MO6.3", text: "Differentiate the classes of diuretics", match: at(["loop-thiazide", "spiro-mannitol"], DIFF) },
  { id: "MO6.4", text: "Nursing process: potassium-sparing and potassium-wasting diuretics", match: (c) => (c.node === "loop-thiazide" || c.node === "spiro-mannitol" || c.id === "k-updown") && (NURSE.has(c.skill) || c.skill === "class") },
  { id: "MO6.5", text: "Potassium replacement best practices (oral and IV)", match: at(["potassium"]) },
  { id: "MO6.6", text: "Heart failure drugs: ACE inhibitors, ARBs, beta-blockers, digoxin", match: (c) => c.node === "hf-roles" || ["dig-moa", "dig-ci", "dig-intx"].includes(c.id) },
  { id: "MO6.7", text: "Nursing process: digoxin", match: (c) => ["dig-hold", "dig-lab", "dig-teach"].includes(c.id) },
  { id: "MO6.8", text: "Early vs late digoxin toxicity and its management", match: (c) => ["dig-tox", "dig-antidote"].includes(c.id) },
  { id: "MO7.1", text: "Differentiate nitroglycerin", match: at(["nitro"], DIFF) },
  { id: "MO7.2", text: "Nursing process: nitroglycerin", match: (c) => (c.node === "nitro" && NURSE.has(c.skill)) || c.id === "naomi" },
  { id: "MO7.3", text: "Differentiate antiplatelets, anticoagulants, thrombolytics", match: (c) => c.topic === "coag" && DIFF.has(c.skill) },
  { id: "MO7.4", text: "Nursing process: antiplatelets, anticoagulants, thrombolytics", match: (c) => c.topic === "coag" && NURSE.has(c.skill) },
  { id: "MO7.5", text: "Antidote for each coagulation modifier", match: (c) => c.topic === "coag" && c.skill === "antidote" },
  { id: "MO7.6", text: "Differentiate lipid-lowering drugs", match: (c) => c.topic === "lipids" && DIFF.has(c.skill) },
  { id: "MO7.7", text: "Nursing process: lipid-lowering drugs", match: (c) => c.topic === "lipids" && (NURSE.has(c.skill) || c.skill === "se") },
  { id: "MO8.1", text: "Differentiate CNS stimulants", match: (c) => c.topic === "cnsstim" && DIFF.has(c.skill) },
  { id: "MO8.2", text: "Nursing process: CNS stimulants", match: (c) => c.topic === "cnsstim" && (NURSE.has(c.skill) || c.skill === "lab") },
  { id: "MO8.3", text: "Differentiate benzodiazepines, cyclobenzaprine, zolpidem", match: (c) => c.topic === "cnsdep" && DIFF.has(c.skill) },
  { id: "MO8.4", text: "Nursing process: benzodiazepines, cyclobenzaprine, barbiturates, zolpidem", match: (c) => (c.topic === "cnsdep" && NURSE.has(c.skill)) || c.id === "phenobarb" || c.id === "cnsdep-pop" },
  { id: "MO8.5", text: "Antidote for benzodiazepines", match: (c) => c.id === "bz-antidote" },
  { id: "MO8.6", text: "Differentiate phenytoin and topiramate", match: (c) => c.node === "phenytoin" || c.id === "topiramate" },
  { id: "MO8.7", text: "Therapeutic levels: phenytoin, carbamazepine, valproic acid, phenobarbital", match: (c) => c.id === "ac-levels" },
  { id: "MO8.8", text: "Nursing process: anticonvulsants", match: (c) => c.topic === "anticonv" && (NURSE.has(c.skill) || c.node === "status" || ["lamotrigine", "valproic", "carbamazepine"].includes(c.id)) },
  { id: "BP-CALC", text: "Blueprint · Dosage calculations (Module 1)", match: (c) => c.topic === "calc" },
];

export const conceptsForObjective = (id: string) => {
  const o = OBJECTIVES.find((x) => x.id === id);
  return o ? CONCEPTS.filter(o.match) : [];
};
export const objectivesForConcept = (c: Concept) => OBJECTIVES.filter((o) => o.match(c)).map((o) => o.id);
