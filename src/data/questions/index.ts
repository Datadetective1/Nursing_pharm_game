import type { Question } from "@/lib/types";
import { analgesicsQuestions } from "./analgesics";
import { antiinflamQuestions } from "./antiinflam";
import { antihtnQuestions } from "./antihtn";
import { diureticsQuestions } from "./diuretics";
import { hfQuestions } from "./hf";
import { coagQuestions } from "./coag";
import { lipidsQuestions } from "./lipids";
import { anginaQuestions } from "./angina";
import { cnsdepQuestions } from "./cnsdep";
import { cnsstimQuestions } from "./cnsstim";
import { anticonvQuestions } from "./anticonv";

/** Every hand-authored question (calculations are generated separately in src/data/calc.ts). */
export const STATIC_QUESTIONS: Question[] = [
  ...analgesicsQuestions,
  ...antiinflamQuestions,
  ...antihtnQuestions,
  ...diureticsQuestions,
  ...hfQuestions,
  ...coagQuestions,
  ...lipidsQuestions,
  ...anginaQuestions,
  ...cnsdepQuestions,
  ...cnsstimQuestions,
  ...anticonvQuestions,
];
