import type { WorldId } from "@/lib/types";

/** Drug-family trees for dual coding. Badges are short, source-backed tags (antidote / lab / signature). */
export interface TreeNode {
  label: string;
  badges?: { text: string; kind: "antidote" | "lab" | "key" }[];
  children?: TreeNode[];
}

const A = (text: string) => ({ text, kind: "antidote" as const });
const L = (text: string) => ({ text, kind: "lab" as const });
const K = (text: string) => ({ text, kind: "key" as const });

export const TREES: Partial<Record<WorldId, TreeNode[]>> = {
  w5: [
    {
      label: "Analgesics",
      children: [
        { label: "Opioids", badges: [A("naloxone"), K("NARCS")], children: [{ label: "Morphine", badges: [K("NAOMI")] }, { label: "Hydromorphone" }, { label: "Fentanyl", badges: [K("≈100× morphine")] }, { label: "Meperidine" }] },
        { label: "Acetaminophen", badges: [A("acetylcysteine"), L("10–20 mcg/mL"), K("no anti-inflam")] },
        { label: "Tramadol", badges: [K("↓seizure threshold")] },
      ],
    },
    {
      label: "Anti-inflammatory (NSAIDs)",
      badges: [K("#1 = GI bleed")],
      children: [{ label: "Ibuprofen", badges: [K("blocks ASA cardioprotection")] }, { label: "Ketorolac", badges: [K("max 5 days")] }, { label: "Aspirin", badges: [K("tinnitus · Reye")] }],
    },
    {
      label: "Antigout",
      children: [{ label: "Allopurinol", badges: [K("↓production")] }, { label: "Probenecid", badges: [K("↑excretion · not near attack")] }, { label: "Colchicine", badges: [K("acute · short-term")] }],
    },
  ],
  w6: [
    {
      label: "Antihypertensives",
      children: [
        { label: "ACE inhibitors (-pril)", badges: [K("cough"), K("PARK"), L("K+")] },
        { label: "ARBs (-sartan)", badges: [K("less cough"), L("K+")] },
        { label: "Calcium channel blockers", children: [{ label: "-pine", badges: [K("edema · reflex tachy")] }, { label: "Diltiazem · verapamil", badges: [K("↓HR")] }] },
      ],
    },
    {
      label: "Diuretics",
      children: [
        { label: "Loop — furosemide", badges: [K("K+ wasting"), K("ototoxic")] },
        { label: "Thiazide — HCTZ", badges: [K("K+ wasting"), K("1st-line HTN")] },
        { label: "K+-sparing — spironolactone", badges: [K("K+ HIGH")] },
        { label: "Osmotic — mannitol", badges: [K("↓ICP · filter")] },
      ],
    },
    { label: "Potassium replacement", badges: [K("NEVER IV push")] },
    { label: "Heart failure — digoxin", badges: [A("digoxin immune fab"), L("0.5–1.5 ng/mL"), K("apical < 60 hold")] },
  ],
  w7: [
    {
      label: "Coagulation modifiers",
      children: [
        {
          label: "Anticoagulants (prevent — don't dissolve)",
          children: [
            { label: "Heparin", badges: [A("protamine"), L("aPTT 60–80 s")] },
            { label: "Enoxaparin (LMWH)", badges: [A("protamine"), L("no lab · CrCl")] },
            { label: "Warfarin", badges: [A("vitamin K"), L("PT/INR")] },
            { label: "Direct thrombin inhibitors", children: [{ label: "Dabigatran", badges: [A("idarucizumab")] }, { label: "Argatroban", badges: [K("when HIT")] }] },
            { label: "Xa inhibitor — rivaroxaban", badges: [A("andexanet alfa")] },
          ],
        },
        { label: "Antiplatelets (arteries)", children: [{ label: "Aspirin", badges: [K("COX · 81 mg")] }, { label: "Clopidogrel", badges: [K("P2Y12")] }] },
        { label: "Thrombolytic — alteplase (dissolves)", badges: [A("aminocaproic acid"), K("≤ 3 hr")] },
      ],
    },
    {
      label: "Lipid lowering",
      badges: [L("TC <200 · LDL <100 · HDL >60")],
      children: [{ label: "Statins", badges: [K("myopathy · CK")] }, { label: "Colesevelam", badges: [K("constipation · spacing")] }, { label: "Gemfibrozil", badges: [K("gallstones")] }, { label: "Ezetimibe", badges: [K("↓absorption")] }],
    },
    {
      label: "Antianginals",
      children: [{ label: "Nitroglycerin", badges: [K("SBP < 90 hold"), K("no -afil")] }, { label: "Beta-blockers (-olol)", badges: [K("B1 heart · B2 lungs")] }, { label: "NAOMI", badges: [K("acute MI")] }],
    },
  ],
  w8: [
    {
      label: "CNS depressants",
      children: [{ label: "Benzodiazepines (-pam/-lam)", badges: [A("flumazenil")] }, { label: "Zolpidem", badges: [K("complex sleep behaviors")] }, { label: "Cyclobenzaprine", badges: [K("C = central")] }],
    },
    { label: "CNS stimulants", badges: [K("last dose by 4 PM")], children: [{ label: "Amphetamine" }, { label: "Methylphenidate" }] },
    {
      label: "Anticonvulsants",
      badges: [K("never stop abruptly")],
      children: [
        { label: "Phenytoin", badges: [L("10–20"), K("gums · NS only")] },
        { label: "Phenobarbital", badges: [L("10–40")] },
        { label: "Carbamazepine", badges: [L("4–12"), K("SJS · grapefruit")] },
        { label: "Valproic acid", badges: [L("50–100"), K("liver")] },
        { label: "Topiramate", badges: [L("5–20"), K("↓sweating")] },
        { label: "Lamotrigine", badges: [K("rash → hold")] },
      ],
    },
    { label: "Status epilepticus", children: [{ label: "1 · IV lorazepam / diazepam" }, { label: "2 · IV phenytoin" }, { label: "3 · midazolam / propofol → phenobarbital" }, { label: "Then: airway + breathing" }] },
  ],
};
