// Core content + progress types for Pharm Quest.
// Content (src/data) is kept separate from UI so it can be corrected/expanded easily.

export type WorldId = "w1" | "w5" | "w6" | "w7" | "w8";

export type TopicId =
  | "calc"
  | "analgesics"
  | "antiinflam"
  | "antihtn"
  | "diuretics"
  | "hf"
  | "coag"
  | "lipids"
  | "angina"
  | "cnsdep"
  | "cnsstim"
  | "anticonv";

/** The chunk / mastery skill a concept exercises. */
export type Skill =
  | "moa" // mechanism of action
  | "use" // indication
  | "se" // side / adverse / toxic effects
  | "ci" // contraindication / caution
  | "intx" // interactions
  | "lab" // labs + therapeutic ranges
  | "hold" // hold parameters / never-do rules
  | "antidote"
  | "action" // nursing action / priority
  | "teach" // patient teaching
  | "class" // class identification / compare
  | "calc"; // dosage calculation

export type Cognitive = "remember" | "understand" | "apply" | "analyze" | "evaluate";
export type Difficulty = 1 | 2 | 3;

/** What kind of item this is, used for variety + filtering (Lab Lock, Antidote Arena, etc). */
export type QFormat =
  | "definition"
  | "antidote"
  | "lab"
  | "lab-interpretation"
  | "side-effect"
  | "contraindication"
  | "interaction"
  | "nursing-action"
  | "first-action"
  | "question-order" // "which order should the nurse question?"
  | "teaching"
  | "case"
  | "class-id"
  | "contrast"
  | "why"
  | "calc";

interface QBase {
  /** Unique, stable id, e.g. "an-op-012" */
  id: string;
  topic: TopicId;
  /** Concept id from src/data/concepts.ts */
  concept: string;
  /** Drug ids (see DRUG ids in concepts.ts) */
  drugs: string[];
  difficulty: Difficulty;
  cognitive: Cognitive;
  format: QFormat;
  /** Question text. For "tf" this is the statement to judge. For "fill" use ____ for the blank. */
  stem: string;
  /** Short explanation of WHY the answer is right (shown after answering). */
  why: string;
  /** The clue in the stem that should have pointed to the answer. */
  clue?: string;
  /** Optional memory hook. Must restate the real fact, never replace it. */
  hook?: string;
  /** Where the fact comes from, e.g. "Memory Aid · Opioids" or "Coag Notes · Slide 2". */
  source: string;
  /** Worked solution steps (dosage calculations). */
  steps?: string[];
  /** True for programmatically generated items (calculations). */
  generated?: boolean;
}

export interface MCQQuestion extends QBase {
  type: "mcq";
  options: string[];
  /** index into options */
  answer: number;
}

export interface SATAQuestion extends QBase {
  type: "sata";
  options: string[];
  /** indices into options that are correct (>= 2 usually) */
  answers: number[];
}

export interface TFQuestion extends QBase {
  type: "tf";
  answer: boolean;
}

export interface FillQuestion extends QBase {
  type: "fill";
  /** Accepted answers (case/punctuation-insensitive). First entry is shown as THE answer. */
  accept: string[];
  /** If numeric, the learner's input is parsed as a number and compared with tolerance. */
  numeric?: { value: number; tolerance?: number };
  unit?: string;
}

export interface MatchQuestion extends QBase {
  type: "match";
  /** [left, right] pairs. Right sides must be unique. */
  pairs: [string, string][];
}

export interface OrderQuestion extends QBase {
  type: "order";
  /** Items in the CORRECT order. Shuffled for display. */
  items: string[];
}

export type Question =
  | MCQQuestion
  | SATAQuestion
  | TFQuestion
  | FillQuestion
  | MatchQuestion
  | OrderQuestion;

export type QuestionType = Question["type"];

export interface Concept {
  id: string;
  topic: TopicId;
  /** quest-map node this concept belongs to */
  node: string;
  skill: Skill;
  /** short human label, e.g. "Heparin antidote" */
  label: string;
  /** Rapid-review / high-yield flag */
  highYield?: boolean;
}

export interface QuestNode {
  id: string;
  world: WorldId;
  topic: TopicId;
  title: string;
  subtitle: string;
  icon: string; // emoji/glyph used in map
}

export interface Topic {
  id: TopicId;
  world: WorldId;
  title: string;
  short: string;
  /** blueprint question range */
  min: number;
  max: number;
  /** number of questions in the 50-question simulated exam */
  examCount: number;
  blueprintDrugs: string;
}

export interface World {
  id: WorldId;
  num: number;
  title: string;
  subtitle: string;
  module: string;
  gradient: string; // tailwind gradient classes
  accent: string; // css color
  boss?: { id: string; name: string; tagline: string; badge: string };
}

export type ChunkKey =
  | "moa"
  | "use"
  | "se"
  | "ci"
  | "caution"
  | "intx"
  | "lab"
  | "hold"
  | "antidote"
  | "action"
  | "teach";

export interface DrugCard {
  id: string;
  name: string;
  /** e.g. "Loop diuretic (K+-wasting)" */
  classLabel: string;
  node: string;
  topic: TopicId;
  /** members / examples */
  examples?: string;
  chunks: Partial<Record<ChunkKey, string[]>>;
  /** mnemonic + the real fact it encodes */
  hook?: string;
  source: string;
}
