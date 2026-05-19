export type QuestionLike = {
  key: string;
  number: number;
  type: string;
  isRequired: boolean;
  options?: Record<string, unknown> | null;
};

export type AnswerLike = {
  answerText?: string | null;
  answerJson?: Record<string, unknown> | null;
};

export function isQuestionAnswered(q: QuestionLike, answer?: AnswerLike | null): boolean {
  if (!answer) return false;
  if (q.type === "TEXT_LONG" || q.type === "TEXT_SHORT") {
    return Boolean(answer.answerText?.trim());
  }
  if (q.type === "THREE_FIELDS") {
    const fields = (answer.answerJson?.fields as string[] | undefined) ?? [];
    return fields.filter((f) => f?.trim()).length >= 3;
  }
  if (q.type === "SCALE_1_5") {
    return answer.answerJson?.value !== undefined && answer.answerJson?.value !== null;
  }
  if (q.type === "SINGLE_CHOICE") {
    return Boolean(answer.answerJson?.choice);
  }
  if (q.type === "MULTIPLE_CHOICE") {
    const sel = answer.answerJson?.selected as string[] | undefined;
    return Boolean(sel && sel.length > 0);
  }
  return false;
}

/** Progression en dessous de ce seuil = soumission verrouillée probablement erronée. */
export const PHANTOM_SUBMISSION_MAX_PERCENT = 10;

export function isPhantomLockedSubmission(
  status: string,
  completed: number,
  total: number,
): boolean {
  if (status !== "SUBMITTED") return false;
  if (total <= 0) return false;
  const percent = Math.round((completed / total) * 100);
  return percent < PHANTOM_SUBMISSION_MAX_PERCENT;
}

export function computeQuestionnaireProgress(
  questions: QuestionLike[],
  answers: Record<string, AnswerLike | undefined>,
): { completed: number; total: number; percent: number; firstIncompleteIndex: number } {
  const total = questions.length;
  let completed = 0;
  let firstIncompleteIndex = -1;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]!;
    if (isQuestionAnswered(q, answers[q.key])) {
      completed += 1;
    } else if (firstIncompleteIndex < 0) {
      firstIncompleteIndex = i;
    }
  }
  if (firstIncompleteIndex < 0 && total > 0) firstIncompleteIndex = total - 1;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percent, firstIncompleteIndex };
}
