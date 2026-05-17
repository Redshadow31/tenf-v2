"use client";

import { useEffect, useState } from "react";
import type { ModeratorStatusView } from "@/lib/staff-questionnaire/status-labels";

export type QuestionnaireHubState = {
  loading: boolean;
  moderatorView: ModeratorStatusView | null;
  progress: { completed: number; total: number } | null;
};

export function useMyQuestionnaireHubFetch(enabled: boolean): QuestionnaireHubState {
  const [loading, setLoading] = useState(enabled);
  const [moderatorView, setModeratorView] = useState<ModeratorStatusView | null>(null);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/moderation/my-questionnaire", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && res.ok) {
          setModeratorView(data.submission?.moderatorView ?? "A_REMPLIR");
          setProgress(data.progress ?? null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { loading, moderatorView, progress };
}

export function questionnaireCtaLabel(view: ModeratorStatusView | null): string {
  if (
    view === "SYNTHESE_DISPONIBLE" ||
    view === "OBJECTIFS_DEFINIS" ||
    view === "BILAN_FINAL_DISPONIBLE"
  ) {
    return "Voir ma synthèse";
  }
  if (
    view === "EN_COURS" ||
    view === "ENVOYE" ||
    view === "ANALYSE_EN_COURS"
  ) {
    return "Reprendre";
  }
  return "Commencer";
}
