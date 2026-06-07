"use client";

import { useMemo } from "react";
import { Clock, FileText, User } from "lucide-react";
import EvaluationDSectionHeader from "@/components/admin/evaluation-d/EvaluationDSectionHeader";
import { EvaluationDPanel, EvaluationDStatTile } from "@/components/admin/evaluation-d/EvaluationDPanel";
import {
  evalDActionBadgeClass,
  evalDTableHeadClass,
  evalDTableScrollWrapClass,
  evalDTableShellClass,
  evalDZoneClass,
} from "@/lib/admin/evaluation-d/evaluationDStyles";
import type { OverrideLog } from "@/lib/admin/evaluation-d/evaluationDTypes";

type Props = {
  logs: OverrideLog[];
};

export default function EvaluationDHistoryPanel({ logs }: Props) {
  const stats = useMemo(() => {
    const uniqueMembers = new Set(logs.map((l) => l.resourceId).filter(Boolean));
    const uniqueActors = new Set(logs.map((l) => l.actorUsername || l.actorDiscordId).filter(Boolean));
    return { members: uniqueMembers.size, actors: uniqueActors.size };
  }, [logs]);

  return (
    <EvaluationDPanel
      kicker="Traçabilité"
      title={`Journal des overrides (${logs.length})`}
      intro="Chaque ligne documente une action staff : note manuelle, bonus, statut ou rôle."
      tone="neutral"
      className="mb-8"
    >
      {logs.length === 0 ? (
        <div className={`${evalDZoneClass} flex flex-col items-center justify-center py-14 text-center`}>
          <FileText className="mb-3 h-10 w-10 text-zinc-600" aria-hidden />
          <p className="text-sm font-medium text-zinc-400">Aucun override enregistré pour ce mois</p>
          <p className="mt-1 max-w-sm text-xs text-zinc-600">
            Les modifications manuelles depuis le tableau d&apos;édition apparaîtront ici avec auteur et motif.
          </p>
        </div>
      ) : (
        <>
          <EvaluationDSectionHeader
            kicker="Synthèse"
            title="Vue d'ensemble du mois"
            intro="Volume d'actions et membres concernés."
            tone="neutral"
            icon={<Clock className="h-4 w-4" aria-hidden />}
          />
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <EvaluationDStatTile label="Actions" value={logs.length} accent="#a78bfa" icon={<FileText className="h-4 w-4" aria-hidden />} />
            <EvaluationDStatTile label="Membres touchés" value={stats.members} accent="#f472b6" icon={<User className="h-4 w-4" aria-hidden />} />
            <EvaluationDStatTile label="Staff impliqués" value={stats.actors} accent="#34d399" icon={<User className="h-4 w-4" aria-hidden />} />
          </div>

          <EvaluationDSectionHeader
            kicker="Chronologie"
            title="Détail des overrides"
            tone="violet"
            icon={<FileText className="h-4 w-4" aria-hidden />}
          />
          <div className={evalDTableShellClass}>
            <div className={evalDTableScrollWrapClass}>
              <table className="w-full min-w-[720px] text-sm">
                <thead className="sticky top-0 z-30">
                  <tr className={evalDTableHeadClass}>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Action</th>
                    <th className="px-4 py-3 text-left">Membre</th>
                    <th className="px-4 py-3 text-left">Par</th>
                    <th className="px-4 py-3 text-left">Motif</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-white/[0.05] transition hover:bg-white/[0.03]">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-400">
                        {new Date(log.timestamp).toLocaleString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${evalDActionBadgeClass(log.action)}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-white">{log.resourceId || "—"}</td>
                      <td className="px-4 py-3 text-zinc-400">{log.actorUsername || log.actorDiscordId || "—"}</td>
                      <td className="max-w-xs px-4 py-3 text-xs leading-relaxed text-zinc-500">
                        {String(log.metadata?.reason || log.metadata?.sourcePage || "Non renseigné")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </EvaluationDPanel>
  );
}
