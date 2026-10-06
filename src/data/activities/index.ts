import type { Activity } from "@/lib/activities/types";
import type { Concept } from "@/lib/types";
import { TEMPLATES, TEMPLATE_BY_KEY } from "./generated";
import { SIMS } from "./sims";
import { ROOMS } from "./rooms";
import { MONITORS } from "./monitors";
import { CHARTS } from "./charts";
import { PRIORITY } from "./priority";
import { SWIPES } from "./swipes";
import { SORTERS } from "./sorters";
import { SEQUENCES } from "./sequences";
import { BODY } from "./body";
import { PALACES } from "./palaces";
import { RESCUES } from "./rescue";
import type { Rng } from "@/lib/rng";

/** Hand-authored (source-checked) activities. Generated ones come from TEMPLATES. */
export const STATIC_ACTIVITIES: Activity[] = [...SIMS, ...ROOMS, ...MONITORS, ...CHARTS, ...PRIORITY, ...SWIPES, ...SORTERS, ...SEQUENCES, ...BODY, ...PALACES, ...RESCUES];

const BY_ID = new Map(STATIC_ACTIVITIES.map((a) => [a.id, a]));

export const isActivityId = (id: string) => id.startsWith("act:");

/** Resolve any activity id: static ("act:sim-heparin") or generated ("act:gauge-aptt:123", "act:compare-ace-vs-arb"). */
export function getActivity(id: string): Activity | undefined {
  const s = BY_ID.get(id);
  if (s) return s;
  const m = id.match(/^act:([a-z0-9-]+)(?::(\d+))?$/);
  if (!m) return undefined;
  const t = TEMPLATE_BY_KEY[m[1]];
  return t ? t.make(Number(m[2] ?? 0)) : undefined;
}

export const activitiesOfKind = (kind: Activity["kind"]) => STATIC_ACTIVITIES.filter((a) => a.kind === kind);

/**
 * Candidate activities touching any of the given concepts (static + one fresh instance of each matching
 * template). Used by the session composer.
 */
export function activitiesForConcepts(concepts: Concept[], rng: Rng): Activity[] {
  const ids = new Set(concepts.map((c) => c.id));
  const statics = STATIC_ACTIVITIES.filter((a) => a.concepts.some((c) => ids.has(c)));
  const gen = TEMPLATES.filter((t) => t.concepts.some((c) => ids.has(c))).map((t) => t.make(Math.floor(rng() * 2 ** 31)));
  return [...statics, ...gen];
}

export { TEMPLATES };
