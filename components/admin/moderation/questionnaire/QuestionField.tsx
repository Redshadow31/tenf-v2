"use client";

import type { ReactNode } from "react";
import { QUI } from "@/components/admin/moderation/questionnaire/questionnaire-ui";

export type QuestionFieldQuestion = {
  key: string;
  number: number;
  label: string;
  helpText: string | null;
  type: string;
  options: Record<string, unknown> | null;
  isRequired: boolean;
};

export type AnswerState = {
  answerText?: string;
  answerJson?: Record<string, unknown>;
};

function choicesFromOptions(options: Record<string, unknown> | null): string[] {
  const c = options?.choices;
  return Array.isArray(c) ? c.map(String) : [];
}

/** Carte consentement / choix — même langage visuel que les réponses du wizard. */
export function ConsentChoice({
  id,
  checked,
  onChange,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label htmlFor={id} className={QUI.choice}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={QUI.choiceInput}
      />
      <span className="min-w-0 flex-1 leading-relaxed">{children}</span>
    </label>
  );
}

export default function QuestionField({
  question,
  value,
  onChange,
  large = false,
  describedBy,
}: {
  question: QuestionFieldQuestion;
  value?: AnswerState;
  onChange: (patch: AnswerState) => void;
  large?: boolean;
  describedBy?: string;
}) {
  const opts = question.options;
  const choices = choicesFromOptions(opts);
  const complementLabel = (opts?.complementLabel as string) || undefined;
  const scaleLabels = (opts?.scaleLabels as Record<string, string>) || {};
  const threeLabels = (opts?.threeFieldLabels as string[]) || ["Champ 1", "Champ 2", "Champ 3"];

  const fieldId = `qf-${question.key}`;

  return (
    <div
      className={large ? "space-y-5" : "space-y-2"}
      aria-describedby={describedBy}
    >
      {question.helpText ? (
        <p className={`text-sm leading-relaxed ${QUI.textSecondary}`}>{question.helpText}</p>
      ) : null}

      {(question.type === "TEXT_LONG" || question.type === "TEXT_SHORT") && (
        <textarea
          id={fieldId}
          rows={question.type === "TEXT_LONG" ? (large ? 8 : 5) : 2}
          className={QUI.input}
          value={value?.answerText ?? ""}
          onChange={(e) => onChange({ answerText: e.target.value })}
          placeholder="Réponds avec tes propres mots…"
          aria-describedby={describedBy}
        />
      )}

      {question.type === "SINGLE_CHOICE" && (
        <div className="space-y-2" role="radiogroup" aria-labelledby={`${fieldId}-legend`}>
          <span id={`${fieldId}-legend`} className="sr-only">
            {question.label}
          </span>
          {choices.map((c) => (
            <label key={c} className={QUI.choice}>
              <input
                type="radio"
                name={question.key}
                className={QUI.choiceInput}
                checked={(value?.answerJson?.choice as string) === c}
                onChange={() =>
                  onChange({
                    answerJson: { ...(value?.answerJson ?? {}), choice: c },
                  })
                }
              />
              <span>{c}</span>
            </label>
          ))}
          {complementLabel ? (
            <textarea
              rows={3}
              placeholder={complementLabel}
              className={QUI.input}
              value={(value?.answerJson?.complement as string) ?? ""}
              onChange={(e) =>
                onChange({
                  answerJson: { ...(value?.answerJson ?? {}), complement: e.target.value },
                })
              }
              aria-describedby={describedBy}
            />
          ) : null}
        </div>
      )}

      {question.type === "MULTIPLE_CHOICE" && (
        <div className="space-y-2">
          {choices.map((c) => {
            const selected = (value?.answerJson?.selected as string[]) ?? [];
            const checked = selected.includes(c);
            return (
              <label key={c} className={QUI.choice}>
                <input
                  type="checkbox"
                  className={QUI.choiceInput}
                  checked={checked}
                  onChange={() => {
                    const next = checked
                      ? selected.filter((x) => x !== c)
                      : [...selected, c];
                    onChange({ answerJson: { selected: next } });
                  }}
                />
                <span>{c}</span>
              </label>
            );
          })}
          {complementLabel ? (
            <textarea
              rows={3}
              placeholder={complementLabel}
              className={QUI.input}
              value={(value?.answerJson?.complement as string) ?? ""}
              onChange={(e) =>
                onChange({
                  answerJson: { ...(value?.answerJson ?? {}), complement: e.target.value },
                })
              }
              aria-describedby={describedBy}
            />
          ) : null}
        </div>
      )}

      {question.type === "SCALE_1_5" && (
        <div className="space-y-4" role="radiogroup" aria-labelledby={`${fieldId}-legend`}>
          <span id={`${fieldId}-legend`} className="sr-only">
            {question.label}
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className={QUI.scaleCard}>
                <input
                  type="radio"
                  name={question.key}
                  className={QUI.choiceInput}
                  checked={Number(value?.answerJson?.value) === n}
                  onChange={() =>
                    onChange({
                      answerJson: { ...(value?.answerJson ?? {}), value: n },
                    })
                  }
                />
                <span className={`text-lg font-bold ${QUI.text}`}>{n}</span>
                {scaleLabels[String(n)] ? (
                  <span className={`text-[10px] leading-tight ${QUI.textMuted}`}>
                    {scaleLabels[String(n)]}
                  </span>
                ) : null}
              </label>
            ))}
          </div>
          {complementLabel ? (
            <textarea
              rows={3}
              placeholder={complementLabel}
              className={QUI.input}
              value={(value?.answerJson?.complement as string) ?? ""}
              onChange={(e) =>
                onChange({
                  answerJson: { ...(value?.answerJson ?? {}), complement: e.target.value },
                })
              }
              aria-describedby={describedBy}
            />
          ) : null}
        </div>
      )}

      {question.type === "THREE_FIELDS" && (
        <div className="space-y-3">
          {threeLabels.map((label, i) => {
            const fields = (value?.answerJson?.fields as string[]) ?? ["", "", ""];
            return (
              <div key={label}>
                <label
                  htmlFor={`${fieldId}-${i}`}
                  className={`text-xs font-semibold uppercase tracking-wide ${QUI.sectionLabel}`}
                >
                  {label}
                </label>
                <input
                  id={`${fieldId}-${i}`}
                  className={`mt-1.5 ${QUI.input}`}
                  value={fields[i] ?? ""}
                  onChange={(e) => {
                    const next = [...fields];
                    next[i] = e.target.value;
                    onChange({ answerJson: { fields: next } });
                  }}
                  aria-describedby={describedBy}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
