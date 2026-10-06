"use client";

import type { Activity, ActivityResult } from "@/lib/activities/types";
import { FamilyWall } from "./FamilyWall";
import { Raas } from "./Raas";
import { Nephron } from "./Nephron";
import { ClottingLab } from "./ClottingLab";
import { AntidoteRescue } from "./AntidoteRescue";
import { LabGauge } from "./LabGauge";
import { LabMonitor, MicroSim, PatientChart, PriorityZone } from "./ClinicalCards";
import { ClinicalRoom, SequenceBuilder, Sorter, SwipeDeck } from "./Games";
import { BodyMap, CompareChallenge, DripLab, MemoryPalace } from "./Visuals";

/** Renders any activity by kind. onDone fires exactly once with the first-try result. */
export function ActivityView({ act, onDone }: { act: Activity; onDone: (r: ActivityResult) => void }) {
  switch (act.kind) {
    case "family-wall":
      return <FamilyWall act={act} onDone={onDone} />;
    case "raas":
      return <Raas act={act} onDone={onDone} />;
    case "nephron":
      return <Nephron act={act} onDone={onDone} />;
    case "clot-lab":
      return <ClottingLab act={act} onDone={onDone} />;
    case "rescue":
      return <AntidoteRescue act={act} onDone={onDone} />;
    case "gauge":
      return <LabGauge act={act} onDone={onDone} />;
    case "monitor":
      return <LabMonitor act={act} onDone={onDone} />;
    case "priority":
      return <PriorityZone act={act} onDone={onDone} />;
    case "room":
      return <ClinicalRoom act={act} onDone={onDone} />;
    case "sorter":
      return <Sorter act={act} onDone={onDone} />;
    case "compare":
      return <CompareChallenge act={act} onDone={onDone} />;
    case "palace":
      return <MemoryPalace act={act} onDone={onDone} />;
    case "sequence":
      return <SequenceBuilder act={act} onDone={onDone} />;
    case "body":
      return <BodyMap act={act} onDone={onDone} />;
    case "chart":
      return <PatientChart act={act} onDone={onDone} />;
    case "swipe":
      return <SwipeDeck act={act} onDone={onDone} />;
    case "sim":
      return <MicroSim act={act} onDone={onDone} />;
    case "drip":
      return <DripLab act={act} onDone={onDone} />;
  }
}

export const KIND_LABEL: Record<Activity["kind"], string> = {
  "family-wall": "Drug Family Wall",
  raas: "RAAS explorer",
  nephron: "Nephron map",
  "clot-lab": "Clotting Lab",
  rescue: "Antidote Rescue",
  gauge: "Lab gauge",
  monitor: "Lab dashboard",
  priority: "Priority Zone",
  room: "What's wrong?",
  sorter: "Sort it",
  compare: "Don't mix these up",
  palace: "Memory palace",
  sequence: "Timeline",
  body: "Body map",
  chart: "Patient chart",
  swipe: "Swipe",
  sim: "Simulation",
  drip: "Drip lab",
};
