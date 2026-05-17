"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Loader2 } from "lucide-react";
import ModerationPageShell from "@/components/admin/moderation/ModerationPageShell";
import QuestionnaireStatusBadge from "@/components/admin/moderation/questionnaire/QuestionnaireStatusBadge";
import { MODERATION_BASE } from "@/lib/moderation/moderationTree";
import { ADMIN_STATUS_LABELS } from "@/lib/staff-questionnaire/status-labels";
import type { StaffQuestionnaireSubmissionStatus } from "@/lib/staff-questionnaire/types";

type Row = {
  memberId: string;
  pseudo: string;
  roleStaff: string;
  submissionId: string | null;
  status: string;
  statusLabel: string;
  startedAt: string | null;
  submittedAt: string | null;
  updatedAt: string | null;
  summaryPublished: boolean;
  objectivesDefined: boolean;
  progressCompleted: number;
  progressTotal: number;
  progressPercent: number;
  inProgress: boolean;
};

export default function StaffQuestionnairesAdminClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [submittedFilter, setSubmittedFilter] = useState<"all" | "yes" | "no">("all");
  const [summaryFilter, setSummaryFilter] = useState<"all" | "yes" | "no">("all");

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/moderation/staff-questionnaires", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Chargement impossible");
        setRows(data.rows ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (submittedFilter === "yes" && !r.submittedAt) return false;
      if (submittedFilter === "no" && r.submittedAt) return false;
      if (summaryFilter === "yes" && !r.summaryPublished) return false;
      if (summaryFilter === "no" && r.summaryPublished) return false;
      return true;
    });
  }, [rows, statusFilter, submittedFilter, summaryFilter]);

  return (
    <ModerationPageShell
      breadcrumb={[
        { label: "Admin", href: "/admin" },
        { label: "Modération", href: MODERATION_BASE },
        { label: "Questionnaires posture staff" },
      ]}
      title="Questionnaires posture staff"
      description="Suivi des réponses, analyses et synthèses modérateurs"
      audienceLabel="Vue admin"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/admin/moderation/staff-questionnaires/export"
            className="inline-flex items-center gap-2 rounded-lg border border-violet-400/40 bg-violet-500/15 px-3 py-2 text-sm font-semibold text-violet-100"
          >
            <Download className="h-4 w-4" />
            Export CSV complet
          </a>
          <a
            href="/api/admin/moderation/staff-questionnaires/export-free-text"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm font-semibold text-zinc-200"
          >
            <Download className="h-4 w-4" />
            Export réponses libres
          </a>
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-white"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(ADMIN_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={submittedFilter}
            onChange={(e) => setSubmittedFilter(e.target.value as "all" | "yes" | "no")}
            className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-white"
          >
            <option value="all">Soumis : tous</option>
            <option value="yes">Soumis</option>
            <option value="no">Non soumis</option>
          </select>
          <select
            value={summaryFilter}
            onChange={(e) => setSummaryFilter(e.target.value as "all" | "yes" | "no")}
            className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-white"
          >
            <option value="all">Synthèse : toutes</option>
            <option value="yes">Synthèse publiée</option>
            <option value="no">Synthèse non publiée</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
          </div>
        ) : error ? (
          <p className="text-rose-300">{error}</p>
        ) : (
          <div
            className="overflow-x-auto rounded-xl border"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="border-b border-white/10 text-zinc-400">
                <tr>
                  <th className="px-3 py-2">Pseudo</th>
                  <th className="px-3 py-2">Rôle</th>
                  <th className="px-3 py-2">Statut</th>
                  <th className="px-3 py-2">Progression</th>
                  <th className="px-3 py-2">Début</th>
                  <th className="px-3 py-2">Soumission</th>
                  <th className="px-3 py-2">Synthèse</th>
                  <th className="px-3 py-2">Objectifs</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.memberId} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-3 py-2 text-white">{r.pseudo}</td>
                    <td className="px-3 py-2 text-zinc-400">{r.roleStaff}</td>
                    <td className="px-3 py-2">
                      <QuestionnaireStatusBadge
                        label={
                          ADMIN_STATUS_LABELS[r.status as StaffQuestionnaireSubmissionStatus] ??
                          r.status
                        }
                        tone="violet"
                      />
                    </td>
                    <td className="px-3 py-2 min-w-[10rem]">
                      {r.submissionId ? (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-zinc-500">
                            <span>
                              {r.progressCompleted}/{r.progressTotal}
                            </span>
                            <span>{r.progressPercent}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-black/40">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500"
                              style={{ width: `${r.progressPercent}%` }}
                            />
                          </div>
                          {r.inProgress && r.updatedAt ? (
                            <p className="text-[10px] text-zinc-600">
                              MAJ {new Date(r.updatedAt).toLocaleDateString("fr-FR")}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-zinc-500">
                      {r.startedAt ? new Date(r.startedAt).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="px-3 py-2 text-zinc-500">
                      {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="px-3 py-2">{r.summaryPublished ? "Oui" : "Non"}</td>
                    <td className="px-3 py-2">{r.objectivesDefined ? "Oui" : "Non"}</td>
                    <td className="px-3 py-2">
                      {r.submissionId ? (
                        <Link
                          href={`/admin/moderation/staff/questionnaires/${r.submissionId}`}
                          className="text-violet-300 hover:text-violet-200"
                        >
                          Ouvrir
                        </Link>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ModerationPageShell>
  );
}
