"use client";

import { Screen, TopBar, SectionTitle } from "@/components/ui";
import { TOPICS, NODES, CONCEPTS } from "@/data/curriculum";
import { QUESTIONS } from "@/data/bank";
import { ANTIDOTES } from "@/data/antidotes";
import { CONTRASTS } from "@/data/contrasts";
import { RAPID } from "@/data/rapid";
import { LAB_LOCKS } from "@/data/labs";

const COVERAGE_NOTES: { title: string; body: string }[] = [
  { title: "Antihypertensive \"common terms\"", body: "The blueprint says to review common terms, but no glossary is in the supplied files. Pharm Quest only uses terms that appear in the Memory Aid (orthostatic hypotension, reflex tachycardia, angioedema, dysgeusia, peripheral edema, neutropenia, rebound hypertension, therapeutic duplication, inotropic/chronotropic/dromotropic). Check your lecture slides for any others." },
  { title: "Meperidine", body: "The only meperidine-specific fact is a Memory Aid line marked 'standard pharm, not in her notes' (toxic metabolite; avoid in renal impairment and older adults; seizure risk). It's covered lightly and labeled as such." },
  { title: "Rivaroxaban antidote", body: "The Memory Aid says 'none in her notes', but the coagulation slide (slide 8) lists andexanet alfa as the Xa-inhibitor antidote. The app follows the slide." },
  { title: "Argatroban antidote", body: "The slides list idarucizumab under 'direct thrombin inhibitors', while the Memory Aid ties it to dabigatran only. To avoid teaching something ambiguous, the app only asks dabigatran → idarucizumab and never asks for an argatroban antidote." },
  { title: "Digoxin therapeutic range", body: "Memory Aid: 0.5–1.5 ng/mL, noting a quiz printed 0.5–2.0 ('use the range given in the question'). Questions either state the range or use values that are unambiguous under both." },
  { title: "Potassium values", body: "The files give no numeric K+ normal range, so potassium items describe results as low/high rather than quoting mEq/L cutoffs." },
  { title: "Acetaminophen level timing", body: "Taught exactly as the Memory Aid states (level drawn < 4 hr; after 4 hr assume toxic and treat). Confirm with your instructor if your lecture said otherwise." },
  { title: "Dosage calculations", body: "The files provide formulas but no worked problems. Dosage Dojo generates practice problems from those formulas with generic 'medication' wording — the numbers are for math practice only, not dosing guidance. Every answer is verified by automated tests." },
  { title: "Antiplatelet antidote", body: "No antidote for aspirin/clopidogrel is given in the files, so none is taught." },
];

export default function SourcesPage() {
  const total = QUESTIONS.length;
  return (
    <Screen>
      <TopBar back="/settings" title="Sources & coverage" />
      <div className="card p-4 text-sm leading-relaxed">
        <p>
          All study content comes from three files: the <b>Fall 2026 Exam 2 Blueprint</b> (what is tested and how much), the <b>Exam 2 Memory Aid</b> (Modules 5–8 knowledge base), and the <b>M7L2 Coagulation Modifiers Notes</b> (including the on-slide text). Where general references differ, the course material wins.
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
