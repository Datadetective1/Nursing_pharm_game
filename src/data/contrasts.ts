import type { TopicId } from "@/lib/types";

/**
 * "DON'T MIX THESE UP" — side-by-side contrast cards followed by discrimination questions.
 * Every cell comes from the Memory Aid or Coag Notes.
 */
export interface ContrastSet {
  id: string;
  title: string;
  topic: TopicId;
  concept: string;
  columns: string[];
  rows: { label: string; cells: string[] }[];
  /** discrimination items: answer = column index */
  quiz: { q: string; answer: number; why: string }[];
  takeaway: string;
  source: string;
}

export const CONTRASTS: ContrastSet[] = [
  {
    id: "heparin-vs-enox",
    title: "Heparin vs Enoxaparin",
    topic: "coag",
    concept: "lmwh-moa",
    columns: ["Heparin", "Enoxaparin (LMWH)"],
    rows: [
      { label: "Mechanism", cells: ["Activates antithrombin → inactivates thrombin AND factor Xa", "Inactivates factor Xa ONLY"] },
      { label: "Monitoring lab", cells: ["aPTT 1.5–2.5× normal ≈ 60–80 sec", "No lab measures effect — CrCl, platelets, H&H"] },
      { label: "Setting", cells: ["Needs aPTT monitoring", "Safe for home use; teach self-injection"] },
      { label: "Injection tip", cells: ["SubQ abdomen ≥ 2 in from umbilicus; do NOT aspirate", "Do NOT expel the air bubble; no massage 1–2 min"] },
      { label: "HIT risk", cells: ["Higher", "Still possible but less likely"] },
      { label: "Caution", cells: ["Hemophilia, PUD, severe HTN, hepatic/kidney dz", "Same as heparin + kidney dysfunction (renally eliminated → dose adjust)"] },
      { label: "Antidote", cells: ["Protamine sulfate", "Protamine sulfate (same)"] },
    ],
    quiz: [
      { q: "Which one is monitored with an aPTT of about 60–80 seconds?", answer: 0, why: "Heparin's therapeutic response is assessed with aPTT/PTT. Enoxaparin has no monitoring lab." },
      { q: "Which one inactivates factor Xa ONLY, so routine lab monitoring isn't needed?", answer: 1, why: "LMWH = Xa only → fewer factors → no routine monitoring, safe for home use." },
      { q: "For which one should the nurse NOT expel the air bubble in the prefilled syringe?", answer: 1, why: "Enoxaparin: don't expel the air bubble unless the dose is adjusted." },
      { q: "Which one needs a dose adjustment based on creatinine clearance?", answer: 1, why: "LMWHs are eliminated by the kidneys." },
      { q: "Which one carries the higher risk of HIT?", answer: 0, why: "HIT can occur with LMWH but is much less likely than with heparin." },
    ],
    takeaway: "Heparin = thrombin + Xa, watch the aPTT. Enoxaparin = Xa only, no lab, home. BOTH → protamine.",
    source: "Coag Notes · Slides 2–4",
  },
  {
    id: "ace-vs-arb",
    title: "ACE Inhibitors vs ARBs",
    topic: "antihtn",
    concept: "arb-moa",
    columns: ["ACE inhibitor (-pril)", "ARB (-sartan)"],
    rows: [
      { label: "Mechanism", cells: ["Blocks Ang I → Ang II AND ↑bradykinin", "Blocks Ang II AT THE RECEPTOR; bradykinin untouched"] },
      { label: "Cough", cells: ["DRY HACKING COUGH (bradykinin)", "MUCH LESS cough"] },
      { label: "Potassium", cells: ["Retains K+ → hyperkalemia", "Same — hyperkalemia"] },
      { label: "Angioedema", cells: ["Yes — airway emergency", "Yes — caution if prior angioedema on an ACE"] },
      { label: "CI", cells: ["PARK: Pregnancy, Allergy/prior angioedema, Renal failure, hyperKalemia", "Pregnancy, allergy, renal failure"] },
      { label: "Hold / teach", cells: ["SBP < 100; no salt substitutes; never stop abruptly", "SBP < 100; no salt substitutes; never stop abruptly"] },
    ],
    quiz: [
      { q: "A client stopped their antihypertensive because of a nagging dry cough. Which class most likely caused it?", answer: 0, why: "ACE inhibitors ↑bradykinin → dry hacking cough; ARBs leave bradykinin alone." },
      { q: "Which class blocks angiotensin II at the receptor?", answer: 1, why: "ARBs block Ang II at the receptor." },
      { q: "Which suffix belongs to the class that also raises bradykinin?", answer: 0, why: "-pril = ACE inhibitor (↑bradykinin)." },
      { q: "Which class is used with CAUTION in a client who had angioedema on the other class?", answer: 1, why: "ARB caution: prior angioedema on an ACE inhibitor." },
    ],
    takeaway: "Both: hyperkalemia, angioedema, pregnancy CI, avoid salt substitutes. Only ACE: the bradykinin cough.",
    source: "Memory Aid · ACE inhibitors / ARBs",
  },
  {
    id: "diuretics",
    title: "Loop vs Thiazide vs K+-Sparing",
    topic: "diuretics",
    concept: "k-updown",
    columns: ["Loop (furosemide)", "Thiazide (HCTZ)", "K+-sparing (spironolactone)"],
    rows: [
      { label: "Where/how", cells: ["Loop of Henle — blocks Na/Cl", "Distal tubule — Na/Cl/H2O/K", "Blocks ALDOSTERONE"] },
      { label: "Potassium", cells: ["WASTES K+ (look LOW)", "WASTES K+ (look LOW)", "RETAINS K+ (look HIGH)"] },
      { label: "Signature effect", cells: ["OTOTOXICITY", "↑Lipids, ↑glucose — NO hearing loss", "Gynecomastia, deepened voice"] },
      { label: "First choice for", cells: ["Edema in HF", "Essential HTN", "—"] },
      { label: "Food teaching", cells: ["Eat MORE K+ foods", "Eat MORE K+ foods", "LIMIT K+ foods; NO salt substitutes"] },
      { label: "Key danger", cells: ["IV ≤ 20 mg/min; hypoK → dig toxicity", "CI in renal impairment", "+ K+ supplements → FATAL hyperK"] },
    ],
    quiz: [
      { q: "Which diuretic is the ONLY one that causes ototoxicity?", answer: 0, why: "Only loop diuretics cause ototoxicity — thiazides can be combined with ototoxic drugs." },
      { q: "Which one should be held for a HIGH potassium?", answer: 2, why: "Spironolactone retains K+ → hold if K+ is high or the client is anuric." },
      { q: "Which is FIRST-LINE for essential hypertension?", answer: 1, why: "Thiazides are first-line for essential HTN." },
      { q: "Which is the first choice for edema in heart failure?", answer: 0, why: "Furosemide is the first choice in HF." },
      { q: "Which one can cause gynecomastia?", answer: 2, why: "Only spironolactone causes gynecomastia/deepened voice (blocks aldosterone)." },
      { q: "For which one is the teaching to AVOID salt substitutes?", answer: 2, why: "Salt substitutes = KCl → hyperkalemia with a K+-sparing drug." },
    ],
    takeaway: "WASTING (loop, thiazide) → eat more K+. SPARING (spironolactone) → limit K+, no salt substitutes.",
    source: "Memory Aid · Diuretics + One-member exceptions",
  },
  {
    id: "coag-classes",
    title: "Anticoagulant vs Antiplatelet vs Thrombolytic",
    topic: "coag",
    concept: "coag-classes",
    columns: ["Anticoagulant", "Antiplatelet", "Thrombolytic"],
    rows: [
      { label: "Examples", cells: ["Heparin, enoxaparin, warfarin, dabigatran, argatroban, rivaroxaban", "Aspirin, clopidogrel", "Alteplase"] },
      { label: "What it does", cells: ["Prevents clot formation — does NOT dissolve existing clots", "Stops platelets clumping", "DISSOLVES clots (plasminogen → plasmin)"] },
      { label: "Where", cells: ["Low-velocity VEINS + LEFT ATRIUM (DVT, PE, a-fib)", "High-velocity ARTERIES (CAD, CVA, PAD)", "Acute MI, massive PE, ischemic stroke, line patency"] },
      { label: "Antidotes", cells: ["Protamine · vitamin K · idarucizumab · andexanet alfa", "— (not in course notes)", "Aminocaproic acid"] },
    ],
    quiz: [
      { q: "Which class is the ONLY one that dissolves an existing clot?", answer: 2, why: "Alteplase dissolves clots. Anticoagulants do NOT dissolve existing clots." },
      { q: "Which class works mainly in high-velocity arteries (CAD, stroke, PAD)?", answer: 1, why: "Antiplatelets = arteries; anticoagulants = veins + left atrium." },
      { q: "A client with a DVT and a-fib most needs which class to prevent new clots?", answer: 0, why: "Anticoagulants target low-velocity veins and the left atrium (DVT, PE, a-fib)." },
      { q: "Clopidogrel belongs to which class?", answer: 1, why: "Clopidogrel binds the P2Y12 ADP receptor — an antiplatelet." },
      { q: "Aminocaproic acid reverses which class?", answer: 2, why: "Aminocaproic acid is the antidote for alteplase." },
    ],
    takeaway: "Anticoagulants PREVENT (veins). Antiplatelets STOP CLUMPING (arteries). Thrombolytics DISSOLVE. A client may legitimately be on an antiplatelet AND an anticoagulant.",
    source: "Coag Notes · Slides 1, 9, 12 + Memory Aid",
  },
  {
    id: "heparin-vs-warfarin",
    title: "Heparin vs Warfarin",
    topic: "coag",
    concept: "war-lab",
    columns: ["Heparin", "Warfarin"],
    rows: [
      { label: "Mechanism", cells: ["Activates antithrombin → inactivates thrombin + Xa", "Antagonizes vitamin K → blocks VII, IX, X, prothrombin"] },
      { label: "Lab", cells: ["aPTT 60–80 sec", "PT 18–24 sec; INR 2–3 (most)"] },
      { label: "Antidote", cells: ["Protamine sulfate (slowly)", "Vitamin K (phytonadione)"] },
      { label: "Big teaching", cells: ["Soft toothbrush, electric razor, don't massage sites", "CONSISTENT vitamin K intake — not elimination"] },
      { label: "Unique CI", cells: ["Thrombocytopenia; eye/brain surgery", "Pregnancy"] },
    ],
    quiz: [
      { q: "Which drug is monitored with PT/INR?", answer: 1, why: "Warfarin = PT/INR. Heparin = aPTT." },
      { q: "Which drug is reversed with vitamin K?", answer: 1, why: "Warfarin is the only one reversed by vitamin K." },
      { q: "Which drug's antidote must be given no faster than 50 mg per 10 minutes?", answer: 0, why: "Protamine (heparin's antidote) given slowly — it causes hypotension." },
      { q: "Which drug requires teaching about consistent leafy-green intake?", answer: 1, why: "Vitamin K foods decrease warfarin's effect — keep intake consistent." },
      { q: "Which one is contraindicated in pregnancy per the course notes?", answer: 1, why: "Warfarin CI: allergy, acute/chronic bleeding, pregnancy." },
    ],
    takeaway: "Heparin → aPTT → protamine. Warfarin → PT/INR → vitamin K.",
    source: "Coag Notes · Slides 2, 5–6",
  },
  {
    id: "dti-xa",
    title: "Dabigatran vs Argatroban vs Rivaroxaban",
    topic: "coag",
    concept: "dti",
    columns: ["Dabigatran", "Argatroban", "Rivaroxaban"],
    rows: [
      { label: "Class", cells: ["Direct thrombin inhibitor", "Direct thrombin inhibitor", "Direct factor Xa inhibitor"] },
      { label: "Use", cells: ["A-fib stroke/embolism prevention; DVT/PE", "Clients who CANNOT take heparin due to HIT", "A-fib stroke prevention; DVT/PE prevention"] },
      { label: "Caution / CI", cells: ["Liver AND kidney disease", "Liver disease", "CI: severe kidney or mod–severe liver impairment"] },
      { label: "Antidote", cells: ["Idarucizumab", "— (not specified)", "Andexanet alfa"] },
    ],
    quiz: [
      { q: "A client developed HIT on heparin. Which anticoagulant is used instead?", answer: 1, why: "Argatroban prevents/treats thrombosis in clients who cannot take heparin due to HIT." },
      { q: "Which drug is reversed by idarucizumab?", answer: 0, why: "Dabigatran is the one with idarucizumab." },
      { q: "Which one directly inhibits factor Xa?", answer: 2, why: "Rivaroxaban (and apixaban) are direct Xa inhibitors." },
      { q: "Which drug is reversed by andexanet alfa per the slides?", answer: 2, why: "Slide 8: Xa-inhibitor antidote andexanet alfa." },
    ],
    takeaway: "ARGatroban = when HIT ARGues against heparin. Dabigatran → idarucizumab. Rivaroxaban (Xa) → andexanet alfa.",
    source: "Coag Notes · Slides 7–8",
  },
  {
    id: "anticonvulsants",
    title: "Phenytoin vs the Other Anticonvulsants",
    topic: "anticonv",
    concept: "ac-levels",
    columns: ["Phenytoin", "Carbamazepine", "Valproic acid", "Topiramate", "Lamotrigine", "Phenobarbital"],
    rows: [
      { label: "Level (mcg/mL)", cells: ["10–20", "4–12 (narrowest)", "50–100", "5–20", "—", "10–40"] },
      { label: "Signature", cells: ["GINGIVAL HYPERPLASIA; IV rules", "Blood dyscrasias; grapefruit", "HEPATOTOXIC; pancreatitis", "↓Sweating; angle-closure glaucoma", "Rash/SJS; aseptic meningitis", "Barbiturate; abrupt stop → seizures"] },
    ],
    quiz: [
      { q: "Which one requires normal saline only, ≤ 50 mg/min IV, and is never given IM?", answer: 0, why: "Phenytoin is the only one with IV rules (NS only, ≤ 50 mg/min, flush, never IM)." },
      { q: "Which one has the NARROWEST therapeutic range?", answer: 1, why: "Carbamazepine 4–12 mcg/mL is the narrowest." },
      { q: "Which one is the hepatotoxic one (watch for jaundice, abdominal pain)?", answer: 2, why: "Valproic acid is the hepatotoxic one." },
      { q: "Which one causes decreased sweating and angle-closure glaucoma?", answer: 3, why: "Topiramate: ↓sweating with ↑body temp, angle-closure glaucoma." },
      { q: "Which one can cause aseptic meningitis (headache, fever, stiff neck)?", answer: 4, why: "Lamotrigine: aseptic meningitis; also SJS/TEN." },
      { q: "Which one causes gingival hyperplasia?", answer: 0, why: "Phenytoin → brush, floss, dentist 2×/year." },
      { q: "Which one is a barbiturate whose abrupt withdrawal causes seizures?", answer: 5, why: "Phenobarbital must be tapered." },
      { q: "Which one interacts with grapefruit to raise levels?", answer: 1, why: "Carbamazepine + grapefruit → ↑levels → toxicity." },
    ],
    takeaway: "Rash → lamotrigine/carbamazepine (hold + notify). Liver → valproic. Gums + IV rules → phenytoin.",
    source: "Memory Aid · Anticonvulsants + One-member exceptions",
  },
  {
    id: "bb-selectivity",
    title: "Cardioselective vs Nonselective Beta-Blockers",
    topic: "angina",
    concept: "bb-select",
    columns: ["Cardioselective (B1)", "Nonselective (B1 + B2)"],
    rows: [
      { label: "Examples", cells: ["Metoprolol, atenolol", "Propranolol, sotalol"] },
      { label: "Lungs", cells: ["Safe in asthma/COPD", "Bronchoconstriction — CI in asthma/COPD"] },
      { label: "Post-MI", cells: ["PREFERRED", "—"] },
    ],
    quiz: [
      { q: "A client with asthma needs a beta-blocker. Which type is appropriate?", answer: 0, why: "Cardioselective (B1 only) are safe in asthma/COPD." },
      { q: "Which type is contraindicated in COPD?", answer: 1, why: "Nonselective block B2 in the lungs → bronchoconstriction." },
      { q: "Propranolol belongs to which group?", answer: 1, why: "Propranolol and sotalol are nonselective." },
      { q: "Which type is preferred after an MI?", answer: 0, why: "Cardioselective beta-blocker preferred post-MI." },
    ],
    takeaway: "B1 = 1 heart. B2 = 2 lungs. Nonselective hits both → bronchoconstriction.",
    source: "Memory Aid · Beta-blockers + One-member exceptions",
  },
  {
    id: "ccb",
    title: "-pine vs diltiazem/verapamil",
    topic: "antihtn",
    concept: "ccb-moa",
    columns: ["-pine (amlodipine, nifedipine)", "Diltiazem / verapamil"],
    rows: [
      { label: "Acts on", cells: ["Vessels only", "Vessels AND ↓heart rate"] },
      { label: "Typical S/E", cells: ["MORE peripheral edema + reflex tachycardia", "Bradycardia; verapamil = worst constipation"] },
      { label: "Digoxin", cells: ["—", "Verapamil ↑digoxin levels"] },
    ],
    quiz: [
      { q: "Which group also lowers the heart rate?", answer: 1, why: "dilTIAZem + verapaMIL also ↓HR; -pines act on vessels only." },
      { q: "Which group is more likely to cause ankle edema and reflex tachycardia?", answer: 0, why: "-pine drugs → more peripheral edema + reflex tachycardia." },
      { q: "Which group contains the drug that specifically raises digoxin levels?", answer: 1, why: "Verapamil ↑digoxin levels." },
    ],
    takeaway: "-zem / -mil slow the heart; -pine just opens the pipes (edema + reflex tachy). All CCBs: no grapefruit.",
    source: "Memory Aid · CCBs + One-member exceptions",
  },
  {
    id: "gout",
    title: "Allopurinol vs Colchicine vs Probenecid",
    topic: "antiinflam",
    concept: "gout-probenecid",
    columns: ["Allopurinol", "Colchicine", "Probenecid"],
    rows: [
      { label: "How", cells: ["Prevents uric acid PRODUCTION", "↓Inflammatory response to urate crystals", "↓Reabsorption → ↑urinary ELIMINATION"] },
      { label: "When", cells: ["Prophylaxis AND can give during an attack", "Acute attacks; short-term only", "Chronic — HOLD within 2–3 wk of an acute attack"] },
      { label: "Note", cells: ["—", "Reserved for clients unresponsive to safer agents", "Started too soon → precipitates a flare"] },
    ],
    quiz: [
      { q: "Which drug should NOT be started within 2–3 weeks of an acute attack?", answer: 2, why: "Probenecid within 2–3 wk of an acute attack precipitates a flare." },
      { q: "Which drug prevents uric acid from being produced?", answer: 0, why: "Allopurinol prevents uric acid production." },
      { q: "Which drug's side effects limit it to short-term use for acute attacks?", answer: 1, why: "Colchicine — reserved, short-term." },
      { q: "Which drug increases urinary elimination of uric acid?", answer: 2, why: "Probenecid ↓reabsorption → ↑urinary elimination." },
    ],
    takeaway: "ALLO = stops production. PROBEnecid = PRObes it OUT in the urine (not near an attack). COLCHicine = calms the crystal inflammation (short-term).",
    source: "Memory Aid · Antigout",
  },
  {
    id: "lipids",
    title: "Statins vs Colesevelam vs Gemfibrozil vs Ezetimibe",
    topic: "lipids",
    concept: "lip-statin-moa",
    columns: ["Statins", "Colesevelam", "Gemfibrozil", "Ezetimibe"],
    rows: [
      { label: "How", cells: ["Inhibit HMG-CoA reductase", "Bind bile acids", "Activate lipoprotein lipase", "↓Cholesterol absorption"] },
      { label: "Signature S/E", cells: ["Myopathy → rhabdo; hepatotoxicity", "CONSTIPATION; blocks other drugs", "GALLSTONES", "Hepatitis, myopathy"] },
      { label: "Key rule", cells: ["Avoid grapefruit; hold for muscle pain + check CK", "Other meds 1 hr before or 4–6 hr after", "CI gallbladder dz; + warfarin ↑bleeding", "CI pregnancy, mod/severe liver"] },
    ],
    quiz: [
      { q: "Which one causes gallstones (RUQ pain, fat intolerance, bloating)?", answer: 2, why: "Gemfibrozil is the one that causes gallstones." },
      { q: "Which one requires other meds 1 hour before or 4–6 hours after?", answer: 1, why: "Sequestrants block absorption of other drugs." },
      { q: "Which one inhibits HMG-CoA reductase?", answer: 0, why: "Statins." },
      { q: "Which one decreases cholesterol absorption from bile and food?", answer: 3, why: "Ezetimibe." },
      { q: "Which one is most associated with constipation?", answer: 1, why: "Sequestrants cause constipation." },
    ],
    takeaway: "Statin = muscles + liver + grapefruit. Sequestrant = constipation + spacing. Gemfibrozil = gallstones.",
    source: "Memory Aid · Lipid-lowering agents",
  },
  {
    id: "cns-relaxants",
    title: "Benzodiazepine vs Zolpidem vs Cyclobenzaprine",
    topic: "cnsdep",
    concept: "cyclo",
    columns: ["Benzodiazepine (-pam/-lam)", "Zolpidem", "Cyclobenzaprine"],
    rows: [
      { label: "Use", cells: ["Anxiety, seizures, insomnia, spasm, ETOH withdrawal", "SHORT-TERM insomnia", "Muscle spasm from injury"] },
      { label: "Signature", cells: ["Paradoxical response; flumazenil antidote", "Sleep-related complex behaviors", "C = Centrally acting; dependence long-term"] },
      { label: "CI", cells: ["Sleep apnea, pregnancy, resp depression", "Pregnancy", "—"] },
    ],
    quiz: [
      { q: "Which one is linked to sleep-related complex behaviors?", answer: 1, why: "Zolpidem is the one with sleep-related complex behaviors." },
      { q: "Which one is reversed by flumazenil for IV toxicity?", answer: 0, why: "Benzodiazepine antidote = flumazenil." },
      { q: "Which one is a centrally acting muscle relaxant?", answer: 2, why: "Cyclobenzaprine: C = Centrally acting." },
      { q: "Which one is contraindicated in sleep apnea per the notes?", answer: 0, why: "Benzo CI: allergy, pregnancy, sleep apnea, resp depression, organic brain disease." },
    ],
    takeaway: "All ↑GABA + all add to ETOH. Benzo → flumazenil. Zolpidem → sleep-related complex behaviors. Cyclobenzaprine → Central.",
    source: "Memory Aid · Benzodiazepines / Zolpidem + muscle relaxants",
  },
];
