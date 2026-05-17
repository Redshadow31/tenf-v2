"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  useMyQuestionnaireHubFetch,
  type QuestionnaireHubState,
} from "@/components/admin/moderation/questionnaire/useMyQuestionnaireHub";

const QuestionnaireHubContext = createContext<QuestionnaireHubState | undefined>(
  undefined,
);

export function QuestionnaireHubProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const state = useMyQuestionnaireHubFetch(enabled);
  return (
    <QuestionnaireHubContext.Provider value={state}>
      {children}
    </QuestionnaireHubContext.Provider>
  );
}

/** Données questionnaire hub — partagées si un Provider enveloppe la page. */
export function useMyQuestionnaireHub(enabled: boolean): QuestionnaireHubState {
  const shared = useContext(QuestionnaireHubContext);
  const fetched = useMyQuestionnaireHubFetch(enabled && shared === undefined);
  return shared ?? fetched;
}

export { questionnaireCtaLabel } from "@/components/admin/moderation/questionnaire/useMyQuestionnaireHub";
