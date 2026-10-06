import type { ActivityKind } from "@/lib/activities/types";
import type { WorldId } from "@/lib/types";

/** Catalog of Visual Labs entries (Practice → Visual Labs). `id` pins a specific activity; otherwise random of `kind`. */
export interface LabEntry {
  slug: string;
  title: string;
  sub: string;
  kind: ActivityKind;
  /** pin a specific activity id */
  id?: string;
  /** restrict random picks to ids starting with this prefix */
  prefix?: string;
  world?: WorldId;
  icon: string;
  tone: string;
}

export const VISUAL_LABS: LabEntry[] = [
  { slug: "family", title: "Drug Family Wall", sub: "Drag drugs into suffix families", kind: "family-wall", icon: "🧩", tone: "from-indigo-500 to-violet-600", world: "w6" },
  { slug: "raas", title: "RAAS Explorer", sub: "Block the pathway: -pril · -sartan · spironolactone", kind: "raas", icon: "🫀", tone: "from-sky-500 to-indigo-600", world: "w6" },
  { slug: "nephron", title: "Diuretic Map", sub: "Place diuretics on the nephron · watch K⁺", kind: "nephron", icon: "💧", tone: "from-cyan-500 to-sky-600", world: "w6" },
  { slug: "potassium", title: "Protect the Potassium", sub: "LOSE K⁺ vs KEEP K⁺", kind: "sorter", id: "act:sort-potassium", icon: "🍌", tone: "from-amber-400 to-orange-500", world: "w6" },
  { slug: "clot", title: "Clotting Lab", sub: "Prevent vs stop clumping vs dissolve", kind: "clot-lab", icon: "🩸", tone: "from-rose-500 to-red-700", world: "w7" },
  { slug: "rescue", title: "Antidote Rescue", sub: "Drag the rescue kit to the client", kind: "rescue", icon: "🧯", tone: "from-emerald-500 to-teal-700" },
  { slug: "gauge", title: "Lab Gauges", sub: "aPTT · INR · digoxin · anticonvulsant levels", kind: "gauge", icon: "🎚️", tone: "from-teal-500 to-cyan-700" },
  { slug: "monitor", title: "Lab Dashboard", sub: "Flag every reading that needs action", kind: "monitor", icon: "🖥️", tone: "from-slate-700 to-slate-900" },
  { slug: "priority", title: "Priority Zone", sub: "Drag what needs IMMEDIATE action", kind: "priority", icon: "🚨", tone: "from-red-500 to-rose-700" },
  { slug: "room", title: "What's Wrong Here?", sub: "Inspect the room · find the safety problems", kind: "room", icon: "🔎", tone: "from-violet-500 to-fuchsia-600" },
  { slug: "sim", title: "Clinical Simulations", sub: "60-second branching shifts", kind: "sim", icon: "🩺", tone: "from-blue-600 to-indigo-700" },
  { slug: "status", title: "Status Epilepticus", sub: "Build the emergency timeline", kind: "sequence", id: "act:seq-status-epilepticus", icon: "⚡", tone: "from-purple-600 to-indigo-800", world: "w8" },
  { slug: "timeline", title: "Timelines", sub: "Toxicity orders · SL nitro · alteplase bleed", kind: "sequence", icon: "🕒", tone: "from-fuchsia-500 to-purple-700" },
  { slug: "body", title: "Body Map", sub: "Where it acts · what to watch", kind: "body", icon: "🧍", tone: "from-amber-500 to-rose-500" },
  { slug: "palace", title: "Memory Palaces", sub: "Explore a room, then find what's missing", kind: "palace", icon: "🏛️", tone: "from-indigo-400 to-amber-400" },
  { slug: "sort", title: "Sort It", sub: "Fast medication sorting", kind: "sorter", icon: "🗂️", tone: "from-lime-500 to-emerald-600" },
  { slug: "swipe", title: "Swipe Mode", sub: "Hold or give? Fast binary calls", kind: "swipe", icon: "👆", tone: "from-pink-500 to-rose-600" },
  { slug: "chart", title: "Patient Charts", sub: "Read the chart, make the call", kind: "chart", icon: "📋", tone: "from-sky-600 to-blue-800" },
  { slug: "compare", title: "Don't Mix: Rebuild", sub: "Rebuild the comparison from pieces", kind: "compare", icon: "🔀", tone: "from-violet-500 to-indigo-700" },
  { slug: "drip", title: "Drip & Pump Lab", sub: "Set the rate · watch it drip", kind: "drip", icon: "🧮", tone: "from-lime-500 to-teal-600", world: "w1" },
];

export const LAB_BY_SLUG: Record<string, LabEntry> = Object.fromEntries(VISUAL_LABS.map((l) => [l.slug, l]));
