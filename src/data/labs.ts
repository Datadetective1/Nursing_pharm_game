import { pick, type Rng } from "@/lib/rng";
import type { TopicId } from "@/lib/types";

/**
 * LAB LOCK puzzles. Each lock = a client scenario with 3–4 "tumblers":
 *   1) which lab/assessment, 2) target range (if the course gives one), 3) interpret the value, 4) nursing response.
 * Every value, range and action comes from the Memory Aid / Coag Notes. Responses are limited to actions the
 * materials state (hold, notify, antidote, assess for bleeding/clot signs, etc).
 */
export interface LockStep {
  kind: "lab" | "range" | "interpret" | "response";
  prompt: string;
  options: string[];
  answer: number;
  why: string;
}

export interface LabLock {
  id: string;
  drug: string;
  topic: TopicId;
  concept: string;
  scenario: string;
  steps: LockStep[];
  source: string;
}

type LockGen = (rng: Rng) => LabLock;

const step = (kind: LockStep["kind"], prompt: string, correct: string, wrong: string[], why: string): LockStep => {
  const options = [correct, ...wrong];
  return { kind, prompt, options, answer: 0, why };
};

const heparinAptt: LockGen = (rng) => {
  const band = pick(rng, ["sub", "ok", "supra"] as const);
  const value = band === "sub" ? pick(rng, [38, 42, 45, 50]) : band === "ok" ? pick(rng, [62, 66, 70, 75, 78]) : pick(rng, [92, 98, 105, 118]);
  const interp = {
    sub: "Subtherapeutic — the client is STILL at risk for clots",
    ok: "Therapeutic — within the goal range",
    supra: "Supratherapeutic — the client is at greater risk for bleeding",
  };
  const resp = {
    sub: "aPTT is too low (still at risk for clots) — assess the calf for heat, redness, pain, swelling",
    ok: "aPTT is in the goal range — continue therapy and keep monitoring the aPTT",
    supra: "aPTT is too high — assess for bleeding (↓BP, ↑HR, bruising, epistaxis, blood in stool/urine); protamine is the antidote",
  };
  return {
    id: "lock-heparin-aptt",
    drug: "Heparin",
    topic: "coag",
    concept: "hep-lab",
    scenario: `A client receiving heparin for a DVT has a new aPTT of ${value} seconds.`,
    source: "Coag Notes · Slide 2",
    steps: [
      step("lab", "Which lab measures the client's therapeutic response to heparin?", "aPTT (PTT)", ["PT/INR", "Creatinine clearance", "Digoxin level"], "Heparin response is assessed with the aPTT/PTT."),
      step("range", "What is the usual heparin goal?", "1.5–2.5× normal ≈ 60–80 seconds", ["18–24 seconds", "INR 2–3", "10–20 mcg/mL"], "Goal is commonly 1.5–2.5× the normal aPTT, about 60–80 seconds."),
      step("interpret", `How should the nurse interpret an aPTT of ${value} seconds?`, interp[band], Object.entries(interp).filter(([k]) => k !== band).map(([, v]) => v).concat(["Unrelated — aPTT doesn't reflect heparin"]), `Below 60 = subtherapeutic (still at risk for clots); above 80 = supratherapeutic (bleeding risk).`),
      step("response", "Best nursing response?", resp[band], Object.entries(resp).filter(([k]) => k !== band).map(([, v]) => v).concat(["Give vitamin K to normalize the aPTT"]), band === "supra" ? "Too high = bleeding risk: assess for bleeding; heparin's antidote is protamine (not vitamin K)." : band === "sub" ? "Too low = still at risk for clots: monitor for DVT signs." : "Within 60–80 sec = therapeutic; continue to monitor."),
    ],
  };
};

const heparinPlatelets: LockGen = (rng) => {
  const v = pick(rng, [
    { text: "platelets dropped from 260,000 to 120,000", hit: true, why: "That is a drop of more than 50%." },
    { text: "platelets are now 88,000", hit: true, why: "Platelets below 100,000 → hold + notify." },
    { text: "platelets went from 240,000 to 228,000", hit: false, why: "A small change — not a ≥50% drop and still above 100,000." },
  ]);
  const drug = pick(rng, ["heparin", "enoxaparin"]);
  return {
    id: "lock-hit",
    drug: drug === "heparin" ? "Heparin" : "Enoxaparin",
    topic: "coag",
    concept: "hep-hit",
    scenario: `Day 6 of ${drug} therapy: the client's ${v.text}.`,
    source: "Coag Notes · Slide 4 (nursing process)",
    steps: [
      step("lab", `Which lab screens for heparin-induced thrombocytopenia (HIT) on ${drug}?`, "Platelet count", ["aPTT", "INR", "Fibrinogen"], "Platelet count is monitored to assess for HIT."),
      step("range", "Which finding should make the nurse suspect HIT?", "Platelets drop ≥ 50% or fall below 100,000", ["Platelets rise above 400,000", "aPTT above 80 seconds", "INR above 3"], "HIT criterion: a drop of 50% or more, or platelets below 100,000."),
      step("interpret", "Interpretation?", v.hit ? "Meets HIT criteria — suspect HIT" : "Does not meet HIT criteria", [v.hit ? "Does not meet HIT criteria" : "Meets HIT criteria — suspect HIT", "Expected effect of heparin — therapeutic", "Indicates the dose is too low"], v.why),
      step("response", "Nursing action?", v.hit ? "Hold the dose and notify the provider" : "Continue therapy and keep monitoring platelets", [v.hit ? "Continue therapy and keep monitoring platelets" : "Hold the dose and notify the provider", "Give vitamin K", "Increase the dose to prevent clots"], v.hit ? "If platelets drop ≥50% or below 100,000: hold heparin/enoxaparin and notify. (Argatroban is used when a client cannot take heparin due to HIT.)" : "No HIT criteria met — continue and monitor."),
    ],
  };
};

const enoxaparinLab: LockGen = () => ({
  id: "lock-enox",
  drug: "Enoxaparin",
  topic: "coag",
  concept: "lmwh-lab",
  scenario: "A client with chronic kidney disease is started on enoxaparin for DVT prophylaxis after hip surgery.",
  source: "Coag Notes · Slides 3–4",
  steps: [
    step("lab", "Which lab measures enoxaparin's therapeutic effect?", "None — no lab measures it; effect = no new or extending clots", ["aPTT 60–80 seconds", "PT 18–24 seconds", "INR 2–3"], "LMWH therapeutic response can't be assessed with labs — it's judged by absence of new/extending clots."),
    step("lab", "Which lab is monitored to decide whether the dose needs adjusting?", "Creatinine clearance", ["aPTT", "Digoxin level", "BNP"], "LMWHs are eliminated by the kidneys → creatinine clearance guides dose adjustment."),
    step("interpret", "Why does this client's kidney disease matter?", "Enoxaparin is eliminated by the kidneys, so the dose needs adjustment", ["It changes the antidote to vitamin K", "It makes HIT impossible", "It means aPTT must be drawn every 6 hours"], "Kidney dysfunction = caution; dosage adjustment needed."),
    step("response", "Which other labs does the nurse track?", "Platelets (HIT) and H&H (bleeding)", ["PT/INR and vitamin K intake", "Ammonia and amylase", "CK and AST"], "For LMWH: H&H for bleeding, platelets for HIT, creatinine clearance for renal function."),
  ],
});

const warfarinInr: LockGen = (rng) => {
  const v = pick(rng, [
    { who: "atrial fibrillation", range: "INR 2–3", inr: 4.1, band: "high" as const },
    { who: "atrial fibrillation", range: "INR 2–3", inr: 2.5, band: "ok" as const },
    { who: "pulmonary embolism treatment", range: "INR 2.5–3.5", inr: 1.8, band: "low" as const },
    { who: "pulmonary embolism treatment", range: "INR 2.5–3.5", inr: 3.0, band: "ok" as const },
    { who: "mechanical heart valve", range: "INR 3–4.5", inr: 3.8, band: "ok" as const },
    { who: "mechanical heart valve", range: "INR 3–4.5", inr: 5.6, band: "high" as const },
  ]);
  const interp = { low: "Below range — subtherapeutic, still at risk for clots", ok: "Within the therapeutic range", high: "Above range — high bleeding risk" };
  const resp = {
    low: "INR is below range (still at risk for clots) — assess the calf for heat, redness, pain, swelling",
    ok: "INR is in range — give the dose as prescribed and keep regular PT/INR monitoring",
    high: "INR is above range — hold the dose; vitamin K (phytonadione) is the antidote",
  };
  const otherRanges = ["INR 2–3", "INR 2.5–3.5", "INR 3–4.5", "aPTT 60–80 seconds"].filter((r) => r !== v.range);
  return {
    id: "lock-warfarin",
    drug: "Warfarin",
    topic: "coag",
    concept: "war-lab",
    scenario: `A client taking warfarin for ${v.who} has an INR of ${v.inr}.`,
    source: "Coag Notes · Slides 5–6",
    steps: [
      step("lab", "Which labs evaluate warfarin's therapeutic response?", "PT and INR", ["aPTT", "Platelet count only", "Creatinine clearance"], "Warfarin response = PT/INR (PT 1.5–2× control = 18–24 sec)."),
      step("range", `Target for ${v.who}?`, v.range, otherRanges.slice(0, 3), "INR 2–3 for most indications; 2.5–3.5 for PE treatment; 3–4.5 for mechanical valve/recurrent systemic embolism."),
      step("interpret", `INR ${v.inr} means:`, interp[v.band], Object.entries(interp).filter(([k]) => k !== v.band).map(([, x]) => x).concat(["The client needs protamine"]), `Compare ${v.inr} to the ${v.who} target (${v.range}).`),
      step("response", "Nursing action?", resp[v.band], Object.entries(resp).filter(([k]) => k !== v.band).map(([, x]) => x).concat(["Give protamine sulfate slowly"]), v.band === "high" ? "Hold if PT or INR exceeds the therapeutic level; vitamin K is warfarin's antidote." : v.band === "low" ? "Below range = still at risk for clots." : "Therapeutic — continue and keep PT/INR appointments."),
    ],
  };
};

const digoxinLock: LockGen = (rng) => {
  const v = pick(rng, [
    { text: "digoxin level 2.6 ng/mL; the client reports loss of appetite", band: "toxic" as const },
    { text: "digoxin level 0.9 ng/mL; apical pulse 74 counted for a full minute", band: "ok" as const },
    { text: "digoxin level 1.0 ng/mL; apical pulse 54 counted for a full minute", band: "brady" as const },
  ]);
  const interp = {
    toxic: "Above range with an early toxicity sign (anorexia) — digoxin toxicity",
    ok: "Therapeutic level with an acceptable apical pulse",
    brady: "Level is in range, but the apical pulse is below 60",
  };
  const resp = {
    toxic: "Hold the dose — level above range + anorexia = toxicity; notify (antidote: digoxin immune fab)",
    ok: "Give the dose — the level and apical pulse are acceptable",
    brady: "Hold the dose — the apical pulse is below 60; notify",
  };
  return {
    id: "lock-digoxin",
    drug: "Digoxin",
    topic: "hf",
    concept: "dig-lab",
    scenario: `Morning med pass: client on digoxin for heart failure — ${v.text}.`,
    source: "Memory Aid · Digoxin",
    steps: [
      step("lab", "Besides the digoxin level, which electrolyte matters most?", "Potassium (low K+ → digoxin toxicity)", ["Sodium", "Calcium", "Glucose"], "Hypokalemia increases digoxin toxicity risk (loop/thiazide + digoxin = highest-risk pairing)."),
      step("range", "Therapeutic digoxin level (course notes)?", "0.5–1.5 ng/mL", ["10–20 mcg/mL", "60–80 seconds", "4–12 mcg/mL"], "Memory aid: 0.5–1.5 ng/mL (a quiz printed 0.5–2.0 — use the range given in the question)."),
      step("interpret", "Interpretation?", interp[v.band], Object.entries(interp).filter(([k]) => k !== v.band).map(([, x]) => x).concat(["Subtherapeutic — increase the dose"]), "Check level AND apical pulse AND toxicity signs (anorexia is the earliest)."),
      step("response", "Nursing action?", resp[v.band], Object.entries(resp).filter(([k]) => k !== v.band).map(([, x]) => x).concat(["Give with an antacid to reduce nausea"]), "HOLD for apical pulse < 60 (full 60 seconds) or any sign of toxicity. Antidote: digoxin immune fab."),
    ],
  };
};

const apapLock: LockGen = (rng) => {
  const v = pick(rng, [
    { text: "Level drawn 3 hours after ingestion: 260 mcg/mL", toxic: true },
    { text: "The client arrives 6 hours after taking an unknown amount; the level is pending", toxic: true },
    { text: "Level drawn 2 hours after a normal dose: 15 mcg/mL", toxic: false },
  ]);
  return {
    id: "lock-apap",
    drug: "Acetaminophen",
    topic: "analgesics",
    concept: "apap-lab",
    scenario: `Possible acetaminophen overdose. ${v.text}.`,
    source: "Memory Aid · Acetaminophen",
    steps: [
      step("lab", "Which labs reflect liver injury from acetaminophen?", "AST/ALT", ["aPTT", "CK", "BNP"], "Monitor AST/ALT; acetaminophen toxicity damages the liver."),
      step("range", "Therapeutic acetaminophen level?", "10–20 mcg/mL (toxic > 200)", ["50–100 mcg/mL (toxic > 150)", "0.5–1.5 ng/mL", "4–12 mcg/mL"], "Level 10–20 mcg/mL; toxic > 200. Draw within 4 hr; after 4 hr assume toxic and treat."),
      step("interpret", "Interpretation?", v.toxic ? "Treat as toxic" : "Therapeutic — not toxic", [v.toxic ? "Therapeutic — not toxic" : "Treat as toxic", "Wait for jaundice before deciding", "Repeat the level tomorrow before acting"], v.toxic ? "Above 200 = toxic; after 4 hours, ASSUME toxic and treat." : "15 is within 10–20 mcg/mL."),
      step("response", "Antidote / action?", v.toxic ? "Acetylcysteine (IV better tolerated)" : "No antidote needed; teach one APAP product at a time", [v.toxic ? "No antidote needed; teach one APAP product at a time" : "Acetylcysteine (IV better tolerated)", "Naloxone", "Vitamin K"], "Acetaminophen antidote = acetylcysteine."),
    ],
  };
};

type AC = { drug: string; concept: string; range: string; low: number; high: number };
const ACS: AC[] = [
  { drug: "Phenytoin", concept: "ac-levels", range: "10–20 mcg/mL", low: 10, high: 20 },
  { drug: "Phenobarbital", concept: "ac-levels", range: "10–40 mcg/mL", low: 10, high: 40 },
  { drug: "Carbamazepine", concept: "ac-levels", range: "4–12 mcg/mL", low: 4, high: 12 },
  { drug: "Valproic acid", concept: "ac-levels", range: "50–100 mcg/mL", low: 50, high: 100 },
  { drug: "Topiramate", concept: "ac-levels", range: "5–20 mcg/mL", low: 5, high: 20 },
];

const anticonvLock: LockGen = (rng) => {
  const d = pick(rng, ACS);
  const band = pick(rng, ["low", "ok", "high"] as const);
  const value =
    band === "low" ? Math.max(1, Math.round(d.low * pick(rng, [0.5, 0.6, 0.7]))) : band === "high" ? Math.round(d.high * pick(rng, [1.3, 1.5, 1.8])) : Math.round((d.low + d.high) / 2);
  const others = ACS.filter((x) => x.range !== d.range).map((x) => x.range);
  const interp = { low: "Below range — risk of SEIZURES", ok: "Within the therapeutic range", high: "Above range — risk of TOXICITY" };
  const resp = {
    low: "Level is below range — report it; the client is at risk for breakthrough seizures",
    ok: "Level is in range — give as scheduled at the same time daily",
    high: "Level is above range — hold the dose and notify the provider",
  };
  return {
    id: `lock-ac-${d.drug.toLowerCase().replace(/\s/g, "")}`,
    drug: d.drug,
    topic: "anticonv",
    concept: d.concept,
    scenario: `A client taking ${d.drug.toLowerCase()} has a serum level of ${value} mcg/mL.`,
    source: "Memory Aid · Anticonvulsants — Levels",
    steps: [
      step("range", `Therapeutic range for ${d.drug.toLowerCase()}?`, d.range, others.slice(0, 3), `${d.drug}: ${d.range}. (Carbamazepine 4–12 is the narrowest.)`),
      step("interpret", `A level of ${value} mcg/mL means:`, interp[band], Object.entries(interp).filter(([k]) => k !== band).map(([, x]) => x).concat(["Level is irrelevant once seizures stop"]), "BELOW the range = seizures. ABOVE the range = toxicity."),
      step("response", "Nursing action?", resp[band], Object.entries(resp).filter(([k]) => k !== band).map(([, x]) => x).concat(["Stop the drug abruptly"]), "Level above range → hold + notify. NEVER stop any anticonvulsant abruptly."),
    ],
  };
};

const statinLock: LockGen = () => ({
  id: "lock-statin",
  drug: "Statins",
  topic: "lipids",
  concept: "lip-statin-se",
  scenario: "A client on a statin reports new, unexplained muscle aches and tenderness and dark urine.",
  source: "Memory Aid · Lipid-lowering agents",
  steps: [
    step("lab", "Which lab should be checked for this complaint?", "CK (CPK)", ["aPTT", "INR", "Digoxin level"], "Unexplained muscle pain → hold + check CK (rhabdomyolysis)."),
    step("interpret", "What is the nurse worried about?", "Myopathy progressing to rhabdomyolysis", ["Gallstones", "Angioedema", "Reye syndrome"], "Statin myopathy → rhabdomyolysis (↑CK, dark urine, profound weight loss)."),
    step("response", "Nursing action?", "Hold the statin and check CK", ["Give with grapefruit juice", "Double the dose", "Teach that muscle pain is expected and harmless"], "HOLD for unexplained muscle pain/tenderness/weakness and check CK."),
    step("lab", "Which other labs does statin therapy monitor?", "AST/ALT and a lipid panel", ["Platelets and aPTT", "Potassium and BNP", "Ammonia and amylase"], "Baseline + periodic cholesterol; AST/ALT (hepatotoxicity)."),
  ],
});

const lipidGoalLock: LockGen = (rng) => {
  const v = pick(rng, [
    { lab: "Total cholesterol", val: "238 mg/dL", goal: "< 200", at: false },
    { lab: "LDL", val: "86 mg/dL", goal: "< 100", at: true },
    { lab: "HDL", val: "42 mg/dL", goal: "> 60", at: false },
    { lab: "LDL", val: "142 mg/dL", goal: "< 100", at: false },
  ]);
  return {
    id: "lock-lipid-goals",
    drug: "Lipid-lowering agents",
    topic: "lipids",
    concept: "lip-goals",
    scenario: `Follow-up lipid panel: ${v.lab} ${v.val}.`,
    source: "Memory Aid · Lipid-lowering agents",
    steps: [
      step("range", `Course goal for ${v.lab}?`, v.goal, ["< 200", "< 100", "> 60", "> 100"].filter((g) => g !== v.goal).slice(0, 3), "Goals: total < 200, LDL < 100, HDL > 60."),
      step("interpret", `Is ${v.lab} ${v.val} at goal?`, v.at ? "Yes — at goal" : "No — not at goal", [v.at ? "No — not at goal" : "Yes — at goal", "Can't tell without a CK", "Only the INR matters"], `Goal is ${v.goal}.`),
      step("response", "How are ALL lipid-lowering agents evaluated?", "Did the cholesterol drop?", ["Did the aPTT reach 60–80 sec?", "Did the client gain weight?", "Did the apical pulse drop below 60?"], "All lipid-lowering agents are evaluated the same way: did cholesterol drop? (Used with diet, activity, weight control.)"),
    ],
  };
};

const potassiumLock: LockGen = (rng) => {
  const v = pick(rng, [
    { drug: "Furosemide", concept: "loop-se", text: "The lab reports a LOW potassium.", dir: "low" as const },
    { drug: "Spironolactone", concept: "spiro-se", text: "The lab reports an ELEVATED potassium.", dir: "high" as const },
    { drug: "Hydrochlorothiazide", concept: "thz-se", text: "The lab reports a LOW potassium.", dir: "low" as const },
    { drug: "An ACE inhibitor (-pril)", concept: "ace-hyperk", text: "The lab reports an ELEVATED potassium.", dir: "high" as const },
  ]);
  const wasting = v.dir === "low";
  return {
    id: "lock-k",
    drug: v.drug,
    topic: v.concept.startsWith("ace") ? "antihtn" : "diuretics",
    concept: v.concept,
    scenario: `A client taking ${v.drug.startsWith("An ") ? "an ACE inhibitor (-pril)" : v.drug.toLowerCase()}: ${v.text}`,
    source: "Memory Aid · Diuretics / K+ summary",
    steps: [
      step("lab", `Which lab is the priority to watch for this drug?`, "Potassium (K+)", ["aPTT", "CK", "Ammonia"], "Diuretics and ACE/ARBs shift potassium."),
      step("interpret", "Is this the expected direction for this drug?", wasting ? "Yes — this drug WASTES K+ (look LOW)" : "Yes — this drug RAISES/SPARES K+ (look HIGH)", [wasting ? "No — this drug should raise K+" : "No — this drug should lower K+", "K+ is unaffected by this drug", "Only sodium changes with this drug"], "K+ DOWN: loop, thiazide. K+ UP: ACE, ARB, spironolactone, K+ supplements, salt substitutes."),
      step("response", "Teaching that fits this drug?", wasting ? "Eat more K+ foods (bananas, OJ, avocado, potato, raisins, spinach)" : "Limit high-K+ foods and AVOID salt substitutes", [wasting ? "Limit high-K+ foods and AVOID salt substitutes" : "Eat more K+ foods (bananas, OJ, avocado, potato, raisins, spinach)", "Take K+ supplements by IV push", "Double fluid intake"], "WASTING → eat more K+; SPARING → limit K+ (salt substitutes = KCl)."),
      step("response", "Which matters if the client also takes digoxin?", wasting ? "Low K+ → digoxin TOXICITY" : "High K+ → decreased digoxin effect", [wasting ? "High K+ → decreased digoxin effect" : "Low K+ → digoxin TOXICITY", "Digoxin has no K+ interaction", "Digoxin raises K+ to normal"], "Loop/thiazide → hypoK → digoxin toxicity; ACE/ARB → hyperK → ↓digoxin effect."),
    ],
  };
};

const aceLock: LockGen = (rng) => {
  const sbp = pick(rng, [92, 96, 98]);
  return {
    id: "lock-ace",
    drug: "ACE inhibitor",
    topic: "antihtn",
    concept: "ace-teach",
    scenario: `Two hours after the FIRST dose of an ACE inhibitor, the client's BP is ${sbp}/58 and they feel dizzy standing up.`,
    source: "Memory Aid · ACE inhibitors",
    steps: [
      step("lab", "When should BP be watched closely after the first ACE dose?", "About 2 hours after the first dose", ["Only after one week", "Only at bedtime", "BP doesn't need monitoring"], "First-dose orthostatic hypotension — watch BP 2 hr after the first dose."),
      step("interpret", "This finding is:", "First-dose orthostatic hypotension", ["Angioedema", "Expected therapeutic effect — no concern", "Hyperkalemia"], "Orthostatic hypotension is a first-dose effect of ACE inhibitors."),
      step("response", "Hold parameter for ACE/ARB?", "Hold for SBP < 100 (or per parameter)", ["Hold for SBP < 140", "Hold for apical pulse < 60", "Never hold an ACE inhibitor"], "HOLD SBP < 100 or per parameter; teach to rise slowly."),
    ],
  };
};

const alteplaseLock: LockGen = () => ({
  id: "lock-alteplase",
  drug: "Alteplase",
  topic: "coag",
  concept: "tpa-nursing",
  scenario: "A client with an acute ischemic stroke (symptom onset 90 minutes ago) is being prepared for alteplase.",
  source: "Coag Notes · Slides 12–13",
  steps: [
    step("lab", "Which baseline labs are drawn before alteplase?", "CBC (H&H, platelets), aPTT, PT, INR, and fibrinogen", ["Digoxin and potassium only", "CK and AST only", "Ammonia and lipase"], "Thrombolytic assessment: baseline VS, CBC, aPTT, PT, INR, fibrinogen."),
    step("interpret", "Timing matters because:", "Alteplase works best given as soon as possible — within 3 hours of onset", ["It must be delayed 24 hours", "It only works after the clot organizes", "Timing doesn't affect thrombolytics"], "Administer ASAP after onset — within 3 hours is best."),
    step("interpret", "During the infusion, BP drops and HR rises. This suggests:", "Blood loss / bleeding", ["Therapeutic success", "Digoxin toxicity", "Fluid overload"], "Hypotension + tachycardia = signs of blood loss."),
    step("response", "If life-threatening bleeding occurs:", "Stop alteplase, give blood products, then aminocaproic acid if needed", ["Speed up the infusion", "Give protamine", "Give vitamin K and continue"], "Discontinue, transfuse, then antidote aminocaproic acid if needed."),
  ],
});

const bnpLock: LockGen = () => ({
  id: "lock-bnp",
  drug: "Heart failure regimen",
  topic: "hf",
  concept: "hf-assess",
  scenario: "A client with heart failure on furosemide and digoxin gained 6 lb in 2 days; BNP is 480.",
  source: "Memory Aid · Digoxin / HF",
  steps: [
    step("lab", "Which lab here reflects fluid overload?", "BNP", ["INR", "CK", "Ammonia"], "BNP > 100 = fluid overload."),
    step("range", "BNP threshold for fluid overload in the course notes?", "> 100", ["> 1,000", "< 60", "> 20"], "Memory aid: BNP > 100 = fluid overload."),
    step("interpret", "A 6-lb gain in 2 days means:", "Report it — more than 5 lb in 2 days signals fluid retention", ["Expected — ignore it", "Dehydration", "The diuretic is working too well"], "Teach daily weights; report > 5 lb in 2 days."),
  ],
});

const stimLock: LockGen = () => ({
  id: "lock-stim",
  drug: "Methylphenidate",
  topic: "cnsstim",
  concept: "stim-monitor",
  scenario: "An 8-year-old on methylphenidate for ADHD returns for follow-up.",
  source: "Memory Aid · CNS stimulants",
  steps: [
    step("lab", "Which assessments are tracked at baseline AND follow-up?", "Height and weight (plus HR and BP)", ["aPTT and platelets", "Digoxin level", "Ammonia"], "Baseline and follow-up height + weight (growth suppression); HR + BP."),
    step("interpret", "The child has lost weight since starting therapy. This is linked to:", "↓Appetite / weight loss from the stimulant", ["Expected growth spurt", "Fluid overload", "Hypoglycemia masking"], "Stimulants cause ↓appetite, weight loss, growth suppression in children."),
    step("response", "Best teaching?", "Give during or right after meals; last dose no later than 4 PM; weigh 2×/week", ["Give at bedtime on an empty stomach", "Add caffeine to boost effect", "Stop the drug abruptly over the weekend"], "During/right after meals; last dose by 4 PM; weigh 2×/week, report weight loss; never stop abruptly."),
  ],
});

const mannitolLock: LockGen = () => ({
  id: "lock-mannitol",
  drug: "Mannitol",
  topic: "diuretics",
  concept: "mannitol-admin",
  scenario: "A client with increased intracranial pressure is receiving IV mannitol.",
  source: "Memory Aid · Mannitol",
  steps: [
    step("lab", "Priority assessment?", "Neuro status (LOC, pupils)", ["Bowel sounds", "Height and weight", "Gum health"], "Neuro status is the priority assessment; also I&O and electrolytes."),
    step("interpret", "Which finding suggests rebound/worsening ↑ICP?", "↓LOC, pupil changes, headache, N/V", ["Improved LOC", "Increased urine output", "Dry mouth"], "↑ICP signs: ↓LOC, pupil changes, HA, N/V."),
    step("response", "The nurse sees crystals in the vial. Action?", "Return it to pharmacy to warm; use a filtered needle and filtered tubing", ["Shake vigorously and give IV push", "Give it IM instead", "Dilute with dextrose and give"], "Crystals → return to pharmacy to warm. IV only, filtered needle + filtered tubing."),
  ],
});

export const LAB_LOCKS: LockGen[] = [
  heparinAptt,
  heparinPlatelets,
  enoxaparinLab,
  warfarinInr,
  digoxinLock,
  apapLock,
  anticonvLock,
  anticonvLock,
  statinLock,
  lipidGoalLock,
  potassiumLock,
  aceLock,
  alteplaseLock,
  bnpLock,
  stimLock,
  mannitolLock,
];
