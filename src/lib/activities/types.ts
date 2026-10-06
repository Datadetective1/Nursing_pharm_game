import type { ChunkKey, TopicId } from "@/lib/types";

/**
 * Interactive / visual learning activities.
 * Every activity links to course concepts (src/data/curriculum.ts) and cites its source so the
 * visual layer stays traceable to the authoritative study material.
 */

export type ActivityKind =
  | "family-wall" // drag drug cards into suffix families
  | "raas" // tap where ACE inhibitor / ARB / spironolactone act
  | "nephron" // place diuretics on the nephron; watch Na+/H2O/K+
  | "clot-lab" // anticoagulant vs antiplatelet vs thrombolytic on a vessel scene
  | "rescue" // drag the antidote rescue kit to the deteriorating client
  | "gauge" // lab value gauge: place the marker, interpret, act
  | "monitor" // lab dashboard: tap everything that needs action
  | "priority" // drag the finding that needs IMMEDIATE action into the priority zone
  | "room" // "what's wrong with this patient?" clinical room hotspots
  | "sorter" // drag/tap cards into 2–3 bins
  | "compare" // rebuild a hidden side-by-side comparison
  | "palace" // memory palace room: explore objects, then recall the missing one
  | "sequence" // put treatment/progression steps in order on a timeline
  | "body" // side-effect / site-of-action body map
  | "chart" // compact patient chart + interpretation question
  | "swipe" // swipe left/right binary decisions with explicit thresholds
  | "sim" // branching clinical micro-simulation
  | "drip"; // IV drip / pump calculation lab

export interface ActMeta {
  /** stable id. Static activities: "act:<key>". Generated: "act:<key>:<seed>". */
  id: string;
  title: string;
  topic: TopicId;
  /** concept ids; the first one is the primary concept used for mastery + Mistake Vault */
  concepts: string[];
  source: string;
  difficulty: 1 | 2 | 3;
}

// ─────────────── shared bits ───────────────
export interface ChartRow {
  label: string;
  value: string;
  /** visual status indicator */
  flag?: "high" | "low" | "critical" | "ok" | "note";
}

export interface MiniQuestion {
  prompt: string;
  options: string[];
  /** indices of correct options (one for single-answer) */
  answer: number[];
  why: string;
}

// ─────────────── per-kind payloads ───────────────
export interface FamilyWallData {
  families: { id: string; label: string; suffixes: string[]; hint: string; color: string }[];
  cards: { name: string; family: string; suffix: string }[];
}

export type RaasTarget = "ace" | "receptor" | "aldosterone";
export interface RaasData {
  challenges: { prompt: string; drug: string; target: RaasTarget; followUp: MiniQuestion }[];
}

export type NephronZone = "loop" | "distal" | "aldosterone" | "blood";
export interface NephronData {
  drugs: { id: "furosemide" | "hctz" | "spironolactone" | "mannitol"; name: string; zone: NephronZone }[];
  followUp: MiniQuestion;
}

export type ClotClass = "anticoagulant" | "antiplatelet" | "thrombolytic";
export interface ClotLabData {
  scenarios: {
    prompt: string;
    scene: "existing-clot" | "venous-prevent" | "platelet-clump";
    answer: ClotClass;
    /** the drug cards offered (name + its class) */
    cards: { name: string; cls: ClotClass }[];
    why: string;
  }[];
}

export interface RescueData {
  drug: string;
  story: string;
  vitals: { label: string; value: string; bad?: boolean }[];
  signs: string[];
  antidote: string;
  kits: string[];
  note: string;
}

export interface GaugeData {
  lab: string;
  drug: string;
  unit: string;
  /** scale bounds for drawing */
  min: number;
  max: number;
  /** target range (inclusive) */
  low: number;
  high: number;
  value: number;
  context?: string;
  zoneLabels: { low: string; in: string; high: string };
  /** what the band means + what the nurse does, keyed by band */
  meaning: Record<"low" | "in" | "high", string>;
  action: Record<"low" | "in" | "high", string>;
}

export interface MonitorData {
  client: string;
  meds: string[];
  tiles: { label: string; value: string; unit?: string; action: boolean; why: string }[];
}

export interface PriorityData {
  client: string;
  drug: string;
  findings: string[];
  /** index of the finding that needs IMMEDIATE action */
  answer: number;
  why: string;
  visual: "airway" | "breathing" | "bleeding" | "heart" | "brain" | "skin" | "liver" | "muscle" | "kidney";
}

export type RoomObject = "patient" | "iv-bag" | "pump" | "monitor" | "mar" | "labs" | "tray" | "mouth" | "skin" | "patch" | "pca" | "vial" | "med-cup" | "bed" | "calendar";
export interface RoomData {
  client: string;
  prompt: string;
  hotspots: { id: string; object: RoomObject; label: string; detail: string; problem: boolean; why: string }[];
}

export interface SorterData {
  prompt: string;
  bins: { id: string; label: string; sub?: string }[];
  cards: { text: string; bin: string; why: string }[];
}

export interface CompareData {
  /** id of a set in src/data/contrasts.ts */
  setId: string;
  /** how many cells to hide */
  hide: number;
}

export type PalaceIcon =
  | "salad"
  | "calendar"
  | "baby"
  | "brush"
  | "shield"
  | "flask"
  | "pill"
  | "syringe"
  | "heart"
  | "eye"
  | "droplet"
  | "banana"
  | "clock"
  | "alert"
  | "smile"
  | "wind"
  | "bed"
  | "thermometer"
  | "ban"
  | "scale";
export interface PalaceData {
  scene: string;
  objects: { id: string; icon: PalaceIcon; label: string; chunk: ChunkKey; fact: string; x: number; y: number }[];
}

export interface SequenceData {
  prompt: string;
  /** steps in the CORRECT order */
  steps: { text: string; detail?: string }[];
  followUp?: MiniQuestion;
}

export type BodyRegion = "brain" | "eyes" | "ears" | "mouth" | "lungs" | "heart" | "vessels" | "liver" | "gi" | "kidneys" | "blood" | "skin" | "muscle";
export interface BodyData {
  drug: string;
  acts: { region: BodyRegion; text: string }[];
  effects: { region: BodyRegion; text: string }[];
  /** reverse quiz: given highlighted effects, which drug? */
  quiz?: MiniQuestion;
}

export interface ChartData {
  patient: string;
  meds: string[];
  rows: ChartRow[];
  findings?: string[];
  question: MiniQuestion;
}

export interface SwipeData {
  prompt: string;
  left: string;
  right: string;
  cards: { text: string; detail?: string; side: "left" | "right"; why: string }[];
}

export interface SimData {
  client: string;
  drug: string;
  intro: string;
  nodes: {
    id: string;
    rows?: ChartRow[];
    text: string;
    prompt: string;
    choices: { label: string; correct: boolean; feedback: string }[];
  }[];
  debrief: string[];
}

export interface DripData {
  /** a generated calculation id (src/data/calc.ts) — "calc-gtts-123" or "calc-mlhr-123" */
  calcId: string;
}

type A<K extends ActivityKind, D> = ActMeta & { kind: K; data: D };

export type Activity =
  | A<"family-wall", FamilyWallData>
  | A<"raas", RaasData>
  | A<"nephron", NephronData>
  | A<"clot-lab", ClotLabData>
  | A<"rescue", RescueData>
  | A<"gauge", GaugeData>
  | A<"monitor", MonitorData>
  | A<"priority", PriorityData>
  | A<"room", RoomData>
  | A<"sorter", SorterData>
  | A<"compare", CompareData>
  | A<"palace", PalaceData>
  | A<"sequence", SequenceData>
  | A<"body", BodyData>
  | A<"chart", ChartData>
  | A<"swipe", SwipeData>
  | A<"sim", SimData>
  | A<"drip", DripData>;

export type ActivityOf<K extends ActivityKind> = Extract<Activity, { kind: K }>;

/** What an activity reports when the learner finishes it. */
export interface ActivityResult {
  /** first-try success (drives mastery + vault) */
  correct: boolean;
  /** items right on first try / total graded items */
  score: number;
  total: number;
  /** short human summary for the vault ("2/6 placed on first try") */
  summary: string;
}
