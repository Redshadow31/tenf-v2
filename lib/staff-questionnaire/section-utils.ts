import type { AnswerLike, QuestionLike } from "@/lib/staff-questionnaire/question-utils";
import { isQuestionAnswered } from "@/lib/staff-questionnaire/question-utils";

export type QuestionnaireSection = {
  key: string;
  title: string;
  questionCount: number;
  startIndex: number;
};

/** Dérive l’ordre des parties depuis les questions (sans inventer de libellés). */
export function buildSectionsFromQuestions<
  Q extends { sectionKey: string; sectionTitle: string },
>(questions: Q[]): QuestionnaireSection[] {
  const sections: QuestionnaireSection[] = [];
  const indexByKey = new Map<string, number>();

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]!;
    let idx = indexByKey.get(q.sectionKey);
    if (idx === undefined) {
      idx = sections.length;
      indexByKey.set(q.sectionKey, idx);
      sections.push({
        key: q.sectionKey,
        title: q.sectionTitle,
        questionCount: 0,
        startIndex: i,
      });
    }
    sections[idx]!.questionCount += 1;
  }

  return sections;
}

export type SectionStepStatus = "future" | "active" | "done";

export function getSectionStepStatuses(
  sections: QuestionnaireSection[],
  questions: Array<QuestionLike & { sectionKey: string; key: string }>,
  answers: Record<string, AnswerLike | undefined>,
  currentSectionKey: string | undefined,
): SectionStepStatus[] {
  return sections.map((section) => {
    const sectionQuestions = questions.filter((q) => q.sectionKey === section.key);
    const allAnswered =
      sectionQuestions.length > 0 &&
      sectionQuestions.every((q) => isQuestionAnswered(q, answers[q.key]));

    if (section.key === currentSectionKey) return "active";
    if (allAnswered) return "done";
    return "future";
  });
}

export function getCurrentSectionIndex(
  sections: QuestionnaireSection[],
  sectionKey: string | undefined,
): number {
  if (!sectionKey) return 0;
  const idx = sections.findIndex((s) => s.key === sectionKey);
  return idx >= 0 ? idx : 0;
}
