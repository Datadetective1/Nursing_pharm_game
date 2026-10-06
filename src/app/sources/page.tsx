"use client";

import { Screen, TopBar, SectionTitle } from "@/components/ui";
import { TOPICS, NODES, CONCEPTS } from "@/data/curriculum";
import { QUESTIONS } from "@/data/bank";
import { ANTIDOTES } from "@/data/antidotes";
import { CONTRASTS } from "@/data/contrasts";
import { RAPID } from "@/data/rapid";
import { LAB_LOCKS } from "@/data/labs";

const COVERAGE_NOTES: { title: string; body: string }[] = [
  { title: "Digoxin therapeutic range", body: "Your M6L3 lecture slide says 0.5–0.8 ng/mL and > 2 ng/mL = toxicity. The Memory Aid, Study Guide and Rapid Reference list 0.5–1.5. Pharm Quest teaches the lecture range and never uses a value between 0.8 and 2.0 as the deciding fact. On the exam, use the range given in the question." },
  { title: "ARBs and potassium", body: "Your M6L1 notes say ARBs do NOT cause hyperkalemia and potassium supplements are not an ARB interaction (\"potassium isn't influenced by ARBs\"). The Memory Aid and Rapid Reference say otherwise — the lecture wins. The M6L3 digoxin slide still lists ACE inhibitors and ARBs as digoxin interactions, so that is taught only in the digoxin lesson." },
  { title: "Oxygen in acute MI (NAOMI)", body: "The M7L1 notes say oxygen if saturation is below 94% on room air; the slide says below 90%. Pharm Quest teaches oxygen for low saturation but never tests the exact cutoff." },
  { title: "Colesevelam spacing", body: "The slide says other drugs 1 hour before or 4 hours after; the notes say 1 hour before or 4–6 hours after. Taught as \"1 hour before or 4–6 hours after\"." },
  { title: "Opioid hold parameters", body: "The lecture notes say hold if respirations are below 12 (naloxone below 10). The extra SBP < 100 and HR < 60 rules come from the Study Guide and are labeled that way." },
  { title: "Meperidine", body: "The only meperidine-specific facts are a Memory Aid line marked 'standard pharm, not in her notes'. They are covered lightly and labeled as such." },
  { title: "Rivaroxaban / argatroban antidotes", body: "The M7L2 slide lists andexanet alfa for Xa inhibitors (the app follows it). No argatroban antidote is asked, because the files don't assign one clearly." },
  { title: "Beta-blockers", body: "Their full lecture is in Module 4 (not in this folder). Details beyond the M7L1 slide come from the Memory Aid and are labeled." },
  { title: "Potassium values", body: "The files give no numeric potassium normal range, so items describe results as low/high." },
  { title: "Dosage calculations", body: "The folder gives formulas (Memory Aid CALC) but no worked problems. Dosage Dojo generates practice problems from those formulas — numbers are for math practice only." },
];

export default function SourcesPage() {
  const total = QUESTIONS.length;
  return (
    <Screen>
      <TopBar back="/settings" title="Sources & coverage" />
      <div className="card p-4 text-sm leading-relaxed">
        <p>
          All study content comes from your course folder: the twelve <b>Module 5–8 lecture files</b> (instructor notes and on-slide text — the primary teaching source), the <b>Exam 2 Blueprint</b> (scope and weighting), the <b>chapter objectives</b>, the syllabus, and the <b>Memory Aid</b>, <b>Study Guide</b> and <b>Rapid Reference</b> as support. Where they disagree, the lecture wins (see below). General pharmacology references are never used.
        </p>
        <p className="mt-2 text-muted">
          {total} hand-written questions · {CONCEPTS.length} concepts · {NODES.length} quest nodes · {ANTIDOTES.length} antidote pairs · {LAB_LOCKS.length} Lab Lock scenarios · {CONTRASTS.length} contrast sets · {RAPID.length} rapid-review cards · unlimited generated calculation problems.
        </p>
      </div>

      <SectionTitle>Blueprint → content map</SectionTitle>
      <div className="card divide-y divide-line">
        {TOPICS.map((t) => {
          const qs = QUESTIONS.filter((q) => q.topic === t.id);
          const app = qs.filter((q) => ["apply", "analyze", "evaluate"].includes(q.cognitive)).length;
          const nodes = NODES.filter((n) => n.topic === t.id).map((n) => n.title);
          return (
            <div key={t.id} className="p-4 text-sm" data-testid="coverage-row">
              <div className="flex justify-between gap-2">
                <span className="font-extrabold">{t.title}</span>
                <span className="shrink-0 font-bold text-muted">
                  {t.min}–{t.max} Qs
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted">Blueprint: {t.blueprintDrugs}</p>
              <p className="mt-1 text-xs">
                <b>Nodes:</b> {nodes.join(" · ")}
              </p>
              <p className="text-xs">
                <b>Items:</b> {t.id === "calc" ? "generated (7 types)" : `${qs.length} questions (${qs.length ? Math.round((app / qs.length) * 100) : 0}% application-level)`} · {CONCEPTS.filter((c) => c.topic === t.id).length} concepts
              </p>
            </div>
          );
        })}
      </div>

      <SectionTitle>Known gaps & judgment calls</SectionTitle>
      <div className="flex flex-col gap-3">
        {COVERAGE_NOTES.map((n) => (
          <div key={n.title} className="card p-4">
            <p className="font-extrabold">{n.title}</p>
            <p className="mt-1 text-sm text-muted">{n.body}</p>
          </div>
        ))}
      </div>
    </Screen>
  );
}
