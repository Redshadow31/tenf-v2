"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardList, ExternalLink, Loader2, TrendingUp } from "lucide-react";
import type {
  MemberStaffJourneyExtras,
  StaffJourneyEvaluationLink,
  StaffJourneyQuestionnaireLink,
} from "@/lib/admin/members-gestion/memberStaffJourney";

export default function MemberStaffJourneyLinks({
  memberIdentifier,
}: {
  memberIdentifier: string;
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MemberStaffJourneyExtras | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/members/${encodeURIComponent(memberIdentifier)}/staff-journey`,
          { cache: "no-store" },
        );
        const json = await res.json();
        if (!cancelled && res.ok) setData(json);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [memberIdentifier]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-zinc-500 py-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Chargement des liens staff…
      </div>
    );
  }

  if (!data?.questionnaire && !data?.lastEvaluation) {
    return (
      <p className="text-xs text-zinc-500">
        Aucun questionnaire posture ni évaluation mensuelle liée pour l&apos;instant.
      </p>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {data.questionnaire ? (
        <QuestionnaireCard link={data.questionnaire} />
      ) : null}
      {data.lastEvaluation ? (
        <EvaluationCard link={data.lastEvaluation} />
      ) : null}
    </div>
  );
}

function QuestionnaireCard({ link }: { link: StaffJourneyQuestionnaireLink }) {
  return (
    <Link
      href={link.href}
      className="group flex items-start gap-3 rounded-xl border border-violet-400/25 bg-violet-500/10 p-3 transition hover:border-violet-400/40 hover:bg-violet-500/15"
    >
      <ClipboardList className="h-5 w-5 shrink-0 text-violet-300" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-200/90">
          Questionnaire posture
        </p>
        <p className="mt-0.5 text-sm font-medium text-white">{link.statusLabel}</p>
        {link.submittedAt ? (
          <p className="mt-1 text-[11px] text-zinc-500">
            Soumis le {new Date(link.submittedAt).toLocaleDateString("fr-FR")}
          </p>
        ) : null}
      </div>
      <ExternalLink className="h-4 w-4 shrink-0 text-zinc-500 group-hover:text-violet-200" />
    </Link>
  );
}

function EvaluationCard({ link }: { link: StaffJourneyEvaluationLink }) {
  return (
    <Link
      href={link.href}
      className="group flex items-start gap-3 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3 transition hover:border-emerald-400/40 hover:bg-emerald-500/15"
    >
      <TrendingUp className="h-5 w-5 shrink-0 text-emerald-300" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200/90">
          Dernière évaluation
        </p>
        <p className="mt-0.5 text-sm font-medium text-white">{link.monthLabel}</p>
        <p className="mt-1 text-[11px] text-zinc-500">
          {link.finalNote != null ? `Note finale : ${link.finalNote}` : "Voir fiche performance"}
          {link.totalPoints != null ? ` · ${link.totalPoints} pts` : ""}
        </p>
      </div>
      <ExternalLink className="h-4 w-4 shrink-0 text-zinc-500 group-hover:text-emerald-200" />
    </Link>
  );
}
