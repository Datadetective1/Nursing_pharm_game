import type { Lesson } from "@/lib/lessons/types";

const MA = "Exam2 Memory Aid · CALC";

/** Module 1 · Dosage calculations — the only calc source in the folder is the Memory Aid's CALC line (+ blueprint types). */
export const calcLessons: Lesson[] = [
  {
    unit: "u-calc",
    title: "Dosage Calculations",
    minutes: 5,
    steps: [
      {
        id: "convert",
        kind: "numbers",
        title: "Three conversions to know cold",
        say: "Most 2-step problems are one conversion plus the dose.",
        items: [
          { value: "lb ÷ 2.2", label: "= kg" },
          { value: "g × 1000", label: "= mg" },
          { value: "mg × 1000", label: "= mcg" },
        ],
        hook: "Convert FIRST, then dose — and keep units in every step.",
        concepts: ["calc-2step", "calc-3step"],
        source: MA,
      },
      {
        id: "mgkg",
        kind: "chain",
        title: "Weight-based (mg/kg) dosing",
        say: "Weight-based dosing multiplies.",
        links: [
          { label: "Step 1", text: "Convert lb → kg (÷ 2.2)" },
          { label: "Step 2", text: "mg/kg × kg = dose in mg" },
          { label: "Step 3", text: "Turn the dose into tablets or mL" },
        ],
        concepts: ["calc-mgkg"],
        source: MA,
      },
      {
        id: "safe",
        kind: "idea",
        title: "Is the dose safe?",
        say: "Calculate the safe range for this client FIRST, then compare the order to it.",
        points: ["Range low = low mg/kg × kg", "Range high = high mg/kg × kg", "Order inside the range = safe; outside = question it"],
        tag: "hold",
        concepts: ["calc-safe"],
        source: MA,
      },
      {
        id: "rates",
        kind: "numbers",
        title: "IV rates",
        items: [
          { value: "mL/hr", label: "total volume ÷ hours" },
          { value: "mL/hr", label: "units/hr ÷ concentration (units/mL)" },
          { value: "gtts/min", label: "(mL/hr × drop factor) ÷ 60 → round to whole" },
        ],
        hook: "Microdrip (60 gtts/mL): gtts/min = mL/hr.",
        concepts: ["calc-mlhr", "calc-unitshr", "calc-gtts"],
        source: MA,
      },
      {
        id: "drip",
        kind: "activity",
        title: "Try a drip",
        say: "Work it out on the pump — the lab checks each step.",
        activity: "act:drip-mlhr:1",
        concepts: ["calc-mlhr"],
        source: MA,
      },
    ],
    keys: {
      "calc-2step": "Convert units first (g→mg ×1000, mg→mcg ×1000), then calculate the dose.",
      "calc-3step": "Chain the conversions: each step's units must cancel into the next.",
      "calc-mgkg": "lb ÷ 2.2 = kg, then mg/kg × kg = dose — weight-based dosing multiplies.",
      "calc-safe": "Calculate the safe range for this client first, THEN compare the order to it.",
      "calc-mlhr": "mL/hr = total volume ÷ total hours.",
      "calc-unitshr": "mL/hr = ordered units/hr ÷ concentration (units per mL).",
      "calc-gtts": "gtts/min = (mL/hr × drop factor) ÷ 60, rounded to a whole drop.",
    },
    summary: {
      drug: "Dosage calculations",
      mechanism: "Convert → set up → calculate → check units",
      danger: "Skipping the safe-dose comparison",
      priority: "Round drops to whole numbers · compare to the safe range",
    },
  },
];
