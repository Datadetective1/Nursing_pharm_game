export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-dose", name: "First Dose", desc: "Finish your first study session", icon: "🌱" },
  { id: "perfect-10", name: "Perfect 10", desc: "Answer 10 in a row correctly", icon: "🎯" },
  { id: "comeback-kid", name: "Comeback Kid", desc: "Fix 5 questions from your Mistake Vault", icon: "🔁" },
  { id: "gauntlet-runner", name: "Gauntlet Runner", desc: "Defeat The Pain Gauntlet", icon: "🔥" },
  { id: "pressure-pro", name: "Pressure Pro", desc: "Defeat The Pressure Crisis", icon: "💧" },
  { id: "clot-buster", name: "Clot Buster", desc: "Defeat The Clotting Cascade", icon: "🩸" },
  { id: "neuro-navigator", name: "Neuro Navigator", desc: "Defeat The Neuro Storm", icon: "🧠" },
  { id: "antidote-ace", name: "Antidote Ace", desc: "Perfect round in the Antidote Arena", icon: "🧯" },
  { id: "lab-legend", name: "Lab Legend", desc: "Crack 8 Lab Locks without a wrong tumbler", icon: "🔓" },
  { id: "calc-crusher", name: "Calc Crusher", desc: "5 dosage calculations right in a row", icon: "🧮" },
  { id: "sharp-eye", name: "Sharp Eye", desc: "Clear 5 'Don't Mix These Up' sets", icon: "🔀" },
  { id: "calibrated", name: "Well Calibrated", desc: "20+ confident answers at ≥ 90% accuracy", icon: "⚖️" },
  { id: "century", name: "Century", desc: "Answer 100 questions", icon: "💯" },
  { id: "deep-roots", name: "Deep Roots", desc: "Master 10 concepts", icon: "🌳" },
  { id: "on-a-roll", name: "On a Roll", desc: "Study 3 days in a row", icon: "📅" },
  { id: "exam-ready", name: "Exam Ready", desc: "Score 80%+ on a simulated Exam 2", icon: "🎓" },
];

export const ACH_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

export const BOSS_BADGE: Record<string, string> = {
  "boss-w5": "gauntlet-runner",
  "boss-w6": "pressure-pro",
  "boss-w7": "clot-buster",
  "boss-w8": "neuro-navigator",
};
