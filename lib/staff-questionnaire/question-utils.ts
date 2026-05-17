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
